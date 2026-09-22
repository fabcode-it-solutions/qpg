import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/db";
import { v4 as uuidv4 } from "uuid";
import { paymentSessions } from "@/db/schema/courses";
import {
  paymentTransactions,
  userSubscriptions,
  users,
  authorizeNetPaymentProfiles,
} from "@/db/schema/auth";
import { courseSubscriptions } from "@/db/schema/courses";
import { eq } from "drizzle-orm";
import { AuthorizeNetService } from "@/lib/authorize-net/authorize-net.service";
import {
  calculateTaxInclusive,
  createTaxInclusiveOrderData,
  taxJarService,
  DEFAULT_FROM_ADDRESS,
} from "@/lib/taxjar";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId, opaqueData, billingInfo, taxAmount } = await req.json();

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

    if (taxAmount) {
      await db
        .update(paymentSessions)
        .set({
          amount: taxAmount + payment.amount,
        })
        .where(eq(paymentSessions.id, sessionId));
    }
    const totalAmount = taxAmount ? taxAmount + payment.amount : payment.amount;

    const transactionResult = await authorizeNetService.createTransaction(
      opaqueData,
      totalAmount,
      billingInfo
    );
    console.log(transactionResult);
    if (!transactionResult.success) {
      console.error("[PAYMENT] Transaction failed:", transactionResult.errors);
      return NextResponse.json(
        {
          error: transactionResult.errors?.[0] || "Payment failed",
        },
        { status: 400 }
      );
    }

    console.log(
      "[PAYMENT] Transaction successful:",
      transactionResult.transactionId
    );
    // Calculate access period - ONE YEAR from purchase date
    const startDate = new Date();
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1); // Add 1 year
    console.log("[PAYMENT] Access period:", {
      startDate: startDate.toISOString(),
      expiresAt: expiresAt.toISOString(),
      days: 365,
    });

    // ========================================================================
    // STORE TRANSACTION AND CREATE ACCESS RECORDS
    // ========================================================================
    await db.transaction(async (tx) => {
      // 2. Create customer profile ID and payment profile ID
      const customerProfileId =
        transactionResult?.customerProfileId || uuidv4();
      const paymentProfileId = transactionResult?.paymentProfileId || uuidv4();
      // 1. Create payment transaction record
      const [paymentTransaction] = await tx
        .insert(paymentTransactions)
        .values({
          userId: session.user.id,
          amount: totalAmount.toString(),
          currency: payment.currency,
          status: "completed",
          paymentMethod: "authorize_net_card",
          transactionId: transactionResult.transactionId!,
          responseCode: transactionResult.responseCode || null,
          responseMessage:
            transactionResult.responseMessage || "Payment completed",
          type: "payment_create",
          customerProfileId,
          paymentProfileId,
        })
        .returning();

      console.log(
        "[PAYMENT] Transaction record created:",
        paymentTransaction.id
      );

      // 3. Store payment profile for future reference
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

      // ========================================================================
      // CREATE "SUBSCRIPTION" RECORD (Really just an access record)
      // ========================================================================
      // Note: We're using the userSubscriptions table for consistency
      // but this is NOT an Authorize.Net subscription - it's just access tracking
      const [userSubscription] = await tx
        .insert(userSubscriptions)
        .values({
          userId: session.user.id,
          // Store transaction ID in subscription ID field for reference
          authorizeNetSubscriptionId: `onetime_${transactionResult.transactionId}`,
          customerProfileId,
          paymentProfileId,
          name: "One-Year Course Access",
          description:
            "One-time payment - Valid for one year (3 growing seasons)",
          status: "active",
          amount: totalAmount.toString(),
          currency: payment.currency,

          // These fields indicate one-time purchase
          intervalLength: 12,
          intervalUnit: "months",
          totalOccurrences: 1, // Indicates one-time purchase

          // Important dates
          startDate,
          endDate: expiresAt, // Access expires in exactly 1 year
          nextPaymentDate: null, // NO RENEWAL - Critical!
          lastPaymentDate: startDate,

          // Payment tracking
          successfulPayments: 1,
          totalPaid: totalAmount.toString(),
        })
        .returning();

      console.log("[PAYMENT] Access record created:", userSubscription.id);

      // 4. Create course subscription link (grants access to course)
      await tx.insert(courseSubscriptions).values({
        userId: session.user.id,
        courseId: payment.courseId,
        subscriptionId: userSubscription.id,
        status: "active",
        accessLevel: "premium",
        startedAt: startDate,
        expiresAt, // Set course-specific expiration
      });

      console.log("[PAYMENT] Course access granted for:", payment.courseId);

      // 5. Update payment session status
      await tx
        .update(paymentSessions)
        .set({
          status: "completed",
          authorizeNetTransactionId: transactionResult.transactionId,
          authorizeNetCustomerProfileId: customerProfileId,
        })
        .where(eq(paymentSessions.id, sessionId));

      // Send confirmation email
      await fetch(
        `${process.env.NEXTAUTH_URL}/api/emails/purchase-confirmation`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: billingInfo.email,
            customerName: `${billingInfo.firstName} ${billingInfo.lastName}`,
            courseId: payment.courseId,
            subscriptionId: `onetime_${transactionResult.transactionId}`,
            amount: payment.amount,
            transactionId: transactionResult.transactionId!,
          }),
        }
      );
    });

    // ========================================================================
    // BACKGROUND OPERATIONS (Non-critical)
    // ========================================================================
    setImmediate(async () => {
      try {
        // TaxJar Integration
        if (taxJarService.isConfigured()) {
          try {
            const courseItems = [
              {
                id: payment.courseId,
                description: "Cannabis Cultivation Course",
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
                "[PAYMENT] TaxJar order created:",
                orderResult.transactionId
              );
            } else {
              console.error(
                "[PAYMENT] TaxJar order creation failed:",
                orderResult.error
              );
            }
          } catch (taxJarError) {
            console.error("[PAYMENT] TaxJar integration error:", taxJarError);
          }
        }
      } catch (backgroundError) {
        console.error(
          "[PAYMENT] Background operation failed:",
          backgroundError
        );
      }
    });

    // ========================================================================
    // RETURN SUCCESS
    // ========================================================================
    return NextResponse.json(
      {
        success: true,
        transactionId: transactionResult.transactionId,
        courseId: payment.courseId,
        message: "Payment successful! You now have one year of course access.",
        accessDetails: {
          startDate: startDate.toISOString(),
          expiresAt: expiresAt.toISOString(),
          daysOfAccess: 365,
          growingSeasons: 3,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Payment processing error:", error);
    return NextResponse.json(
      { error: "Payment processing failed" },
      { status: 500 }
    );
  }
}
