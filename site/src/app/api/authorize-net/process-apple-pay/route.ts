import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/db";
import { v4 as uuidv4 } from "uuid";
import { paymentSessions } from "@/db/schema/courses";
import {
  paymentTransactions,
  userSubscriptions,
  authorizeNetPaymentProfiles,
} from "@/db/schema/auth";
import { courseSubscriptions } from "@/db/schema/courses";
import { eq } from "drizzle-orm";
import { AuthorizeNetService } from "@/lib/authorize-net/authorize-net.service";
import {
  taxJarService,
  createTaxInclusiveOrderData,
  DEFAULT_FROM_ADDRESS,
  calculateTaxInclusive,
} from "@/lib/taxjar";

/**
 * APPLE PAY ONE-TIME PAYMENT PROCESSING
 * Processes Apple Pay transactions for one-year course access
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId, applePayData, billingInfo, taxAmount } =
      await req.json();

    // Validate required fields
    if (!sessionId || !applePayData || !billingInfo) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get payment session
    const paymentSession = await db
      .select()
      .from(paymentSessions)
      .where(eq(paymentSessions.id, sessionId))
      .limit(1);

    if (
      !paymentSession.length ||
      paymentSession[0].userId !== session.user.id
    ) {
      return NextResponse.json({ error: "Invalid session" }, { status: 400 });
    }

    const payment = paymentSession[0];

    if (payment.status !== "pending") {
      return NextResponse.json(
        { error: "Session already processed" },
        { status: 400 }
      );
    }

    const authorizeNetService = new AuthorizeNetService();

    // Validate Apple Pay data
    const validation = authorizeNetService.validateApplePayData(applePayData);
    if (!validation.isValid) {
      console.error("[APPLE_PAY] Validation failed:", validation.errors);
      return NextResponse.json(
        {
          error: "Invalid Apple Pay data",
          details: validation.errors,
        },
        { status: 400 }
      );
    }

    // Calculate total amount including tax
    const totalAmount = taxAmount ? taxAmount + payment.amount : payment.amount;

    // Update payment session with final amount
    if (taxAmount) {
      await db
        .update(paymentSessions)
        .set({
          amount: totalAmount,
        })
        .where(eq(paymentSessions.id, sessionId));
    }

    console.log("[APPLE_PAY] Processing transaction:", {
      amount: totalAmount,
      userId: session.user.id,
      courseId: payment.courseId,
    });

    // ========================================================================
    // CREATE APPLE PAY TRANSACTION
    // ========================================================================
    const transactionResult =
      await authorizeNetService.createApplePayTransaction(
        applePayData,
        totalAmount,
        billingInfo,
        {
          invoiceNumber: `AP-${Date.now()}`,
          description: `Apple Pay - Course Access`,
        }
      );

    if (!transactionResult.success) {
      console.error(
        "[APPLE_PAY] Transaction failed:",
        transactionResult.errors
      );
      return NextResponse.json(
        {
          error: transactionResult.errors?.[0] || "Apple Pay payment failed",
        },
        { status: 400 }
      );
    }

    console.log(
      "[APPLE_PAY] Transaction successful:",
      transactionResult.transactionId
    );

    // Calculate access period - ONE YEAR
    const startDate = new Date();
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    // ========================================================================
    // STORE TRANSACTION AND CREATE ACCESS RECORDS
    // ========================================================================
    await db.transaction(async (tx) => {
      // 1. Create payment transaction record
      const [paymentTransaction] = await tx
        .insert(paymentTransactions)
        .values({
          userId: session.user.id,
          amount: totalAmount.toString(),
          currency: payment.currency,
          status: "completed",
          paymentMethod: "authorize_net_applepay",
          transactionId: transactionResult.transactionId!,
          responseCode: transactionResult.responseCode || null,
          responseMessage:
            transactionResult.responseMessage || "Apple Pay completed",
          type: "apple_pay",
        })
        .returning();

      console.log(
        "[APPLE_PAY] Transaction record created:",
        paymentTransaction.id
      );

      // 2. Create customer profile
      const customerProfileId = transactionResult.customerProfileId || uuidv4();
      const paymentProfileId = transactionResult.paymentProfileId || uuidv4();

      // 3. Store payment profile
      await tx.insert(authorizeNetPaymentProfiles).values({
        userId: session.user.id,
        customerProfileId,
        paymentProfileId,
        billingFirstName: billingInfo.firstName,
        billingLastName: billingInfo.lastName,
        billingAddress: billingInfo.address,
        billingCity: billingInfo.city,
        billingState: billingInfo.state,
        billingZip: billingInfo.zip,
        billingCountry: billingInfo.country || "US",
        isDefault: true,
        isActive: true,
      });

      // 4. Create access record
      const [userSubscription] = await tx
        .insert(userSubscriptions)
        .values({
          userId: session.user.id,
          authorizeNetSubscriptionId: `applepay_${transactionResult.transactionId}`,
          customerProfileId,
          paymentProfileId,
          name: "One-Year Course Access (Apple Pay)",
          description: "One-time Apple Pay payment - Valid for one year",
          status: "active",
          amount: totalAmount.toString(),
          currency: payment.currency,
          intervalLength: 12,
          intervalUnit: "months",
          totalOccurrences: 1, // One-time purchase
          startDate,
          endDate: expiresAt,
          nextPaymentDate: null, // No renewal
          lastPaymentDate: startDate,
          successfulPayments: 1,
          totalPaid: totalAmount.toString(),
        })
        .returning();

      console.log("[APPLE_PAY] Access record created:", userSubscription.id);

      // 5. Create course subscription
      await tx.insert(courseSubscriptions).values({
        userId: session.user.id,
        courseId: payment.courseId,
        subscriptionId: userSubscription.id,
        status: "active",
        accessLevel: "premium",
        startedAt: startDate,
        expiresAt,
      });

      console.log("[APPLE_PAY] Course access granted");

      // 6. Update payment session
      await tx
        .update(paymentSessions)
        .set({
          status: "completed",
          authorizeNetTransactionId: transactionResult.transactionId,
          authorizeNetCustomerProfileId: customerProfileId,
        })
        .where(eq(paymentSessions.id, sessionId));
    });

    // ========================================================================
    // BACKGROUND OPERATIONS
    // ========================================================================
    setImmediate(async () => {
      try {
        if (taxJarService.isConfigured()) {
          const courseItems = [
            {
              id: payment.courseId,
              description:
                "Cannabis Cultivation Course - One-Year Course Access (Apple Pay)",
              quantity: 1,
              totalPriceIncludingTax: payment.amount, // $99 in cents
              type: "course" as const,
            },
          ];
          const taxResult = await calculateTaxInclusive(
            {
              firstName: billingInfo.firstName,
              lastName: billingInfo.lastName,
              email: billingInfo.email,
              address: billingInfo.address,
              city: billingInfo.city,
              state: billingInfo.state,
              zip: billingInfo.zip,
              country: billingInfo.country || "US",
            },
            courseItems
          );

          const orderResult = await taxJarService.createOrder({
            transaction_id: transactionResult.transactionId!,
            transaction_date: new Date().toISOString().split("T")[0],
            provider: "api",
            from_country: DEFAULT_FROM_ADDRESS.country,
            from_zip: DEFAULT_FROM_ADDRESS.zip,
            from_state: DEFAULT_FROM_ADDRESS.state,
            from_city: DEFAULT_FROM_ADDRESS.city,
            from_street: DEFAULT_FROM_ADDRESS.street,
            to_country: billingInfo.country || "US",
            to_zip: billingInfo.zip,
            to_state: billingInfo.state,
            to_city: billingInfo.city,
            to_street: billingInfo.address,
            amount: Number((taxResult.basePrice / 100).toFixed(2)),
            shipping: 0,
            sales_tax: Number((taxResult.taxAmount / 100).toFixed(2)),
            customer_id: session.user.id,
            line_items: [
              {
                id: payment.courseId,
                quantity: 1,
                unit_price: Number((taxResult.basePrice / 100).toFixed(2)),
                description: "Cannabis Cultivation Course",
                product_tax_code: "31000", // Digital goods
              },
            ],
          });

          if (orderResult.success) {
            console.log(
              "[APPLE_PAY] TaxJar order created:",
              orderResult.transactionId
            );
          }
        }
      } catch (error) {
        console.error("[APPLE_PAY] Background operation failed:", error);
      }
    });

    // ========================================================================
    // RETURN SUCCESS
    // ========================================================================
    return NextResponse.json({
      success: true,
      transactionId: transactionResult.transactionId,
      courseId: payment.courseId,
      message:
        "Apple Pay payment successful! You now have one year of course access.",
      accessDetails: {
        startDate: startDate.toISOString(),
        expiresAt: expiresAt.toISOString(),
        daysOfAccess: 365,
        growingSeasons: 3,
      },
    });
  } catch (error) {
    console.error("[APPLE_PAY] Error processing payment:", error);
    return NextResponse.json(
      {
        error: "Failed to process Apple Pay payment",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
