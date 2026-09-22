import { v4 as uuidv4 } from "uuid";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/db";
import { paymentSessions } from "@/db/schema/courses";
import {
  paymentTransactions,
  userSubscriptions,
  users,
  authorizeNetPaymentProfiles,
} from "@/db/schema/auth";
import { courseSubscriptions } from "@/db/schema/courses";
import { eq } from "drizzle-orm";
import { AuthorizeNetGooglePayService } from "@/lib/authorize-net/google-pay.service";
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

    const { sessionId, googlePayData, billingInfo, taxAmount } =
      await req.json();

    // Validate required fields
    if (!sessionId || !googlePayData || !billingInfo) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate Google Pay data
    if (!googlePayData.opaqueDataDescriptor || !googlePayData.opaqueDataValue) {
      return NextResponse.json(
        { error: "Invalid Google Pay data" },
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

    // Initialize Google Pay service
    const googlePayService = new AuthorizeNetGooglePayService({
      apiLoginId: process.env.AUTHORIZE_NET_API_LOGIN_ID || "",
      transactionKey: process.env.AUTHORIZE_NET_TRANSACTION_KEY || "",
      environment: process.env.AUTHORIZE_NET_ENVIRONMENT as
        | "sandbox"
        | "production",
    });
    const result = await googlePayService.createGooglePayTransaction(
      googlePayData,
      taxAmount ? payment.amount + taxAmount : payment.amount,
      billingInfo,
      {
        invoiceNumber: `GP-${Date.now()}`,
        description: "Google Pay - Course Access",
      }
    );
    // const customerId = `gp${Math.random().toString(36).substring(2, 8)}`;

    // Create Google Pay subscription
    // const subscriptionData = {
    //   name: "Course Access - Google Pay",
    //   amount: taxAmount ? payment.amount + taxAmount : payment.amount,
    //   intervalLength: 12,
    //   intervalUnit: "months" as const,
    //   totalOccurrences: 1,
    //   startDate: new Date(),
    //   googlePayData: {
    //     opaqueDataDescriptor: googlePayData.opaqueDataDescriptor,
    //     opaqueDataValue: googlePayData.opaqueDataValue,
    //   },
    //   billingInfo: {
    //     firstName: billingInfo.firstName,
    //     lastName: billingInfo.lastName,
    //     email: billingInfo.email,
    //     address: billingInfo.address,
    //     city: billingInfo.city,
    //     state: billingInfo.state,
    //     zip: billingInfo.zip,
    //     country: billingInfo.country || "US",
    //   },
    //   customer: {
    //     type: "individual",
    //     id: customerId,
    //     email: billingInfo.email,
    //     phoneNumber: billingInfo.phone || "",
    //     description: `Google Pay customer for ${session.user.email}`,
    //   },
    //   order: {
    //     invoiceNumber: `GP-INV-${Date.now()}`,
    //     description: `Google Pay subscription for course ${payment.courseId}`,
    //   },
    // };
    if (taxAmount) {
      await db
        .update(paymentSessions)
        .set({
          amount: taxAmount + payment.amount,
        })
        .where(eq(paymentSessions.id, sessionId));
    }
    // const subscriptionPromise =
    //   googlePayService.createGooglePaySubscription(subscriptionData);
    // const result = await Promise.race([subscriptionPromise]);

    if (!result.success) {
      return NextResponse.json(
        {
          error:
            result.errors?.[0] || "Google Pay subscription creation failed",
        },
        { status: 400 }
      );
    }
    const autoPaymentProfileId = uuidv4();
    const autocustomerProfileId = uuidv4();
    const authorizeNetSubscriptionId = result.transactionId!;
    const customerProfileId =
      result.customerProfileId || `gp_auto_generated_${autocustomerProfileId}`;
    const paymentProfileId =
      result.paymentProfileId || `gp_auto_generated_${autoPaymentProfileId}`;
    const transactionId = `gp_sub_${authorizeNetSubscriptionId}_initial`;

    // Critical operations - must complete before response
    await Promise.all([
      // Update payment session
      db
        .update(paymentSessions)
        .set({
          status: "completed",
          authorizeNetTransactionId: transactionId,
          authorizeNetSubscriptionId,
        })
        .where(eq(paymentSessions.id, sessionId)),

      // Update user profile
      db
        .update(users)
        .set({
          authorizeNetCustomerProfileId: customerProfileId,
          ...(billingInfo.phone && { phone: billingInfo.phone }),
        })
        .where(eq(users.id, session.user.id)),

      // Create payment profile
      db.insert(authorizeNetPaymentProfiles).values({
        userId: session.user.id,
        customerProfileId,
        paymentProfileId,
        cardType: "Google Pay",
        cardLast4: null, // Google Pay doesn't expose card details
        billingFirstName: billingInfo.firstName,
        billingLastName: billingInfo.lastName,
        billingAddress: billingInfo.address,
        billingCity: billingInfo.city,
        billingState: billingInfo.state,
        billingZip: billingInfo.zip,
        billingCountry: billingInfo.country || "US",
        isDefault: true,
        isActive: true,
      }),
    ]);

    // Create user subscription (must be sequential)
    const startDate = new Date();
    const nextPaymentDate = new Date();
    nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 12);

    const [userSubscription] = await db
      .insert(userSubscriptions)
      .values({
        userId: session.user.id,
        authorizeNetSubscriptionId,
        customerProfileId,
        paymentProfileId,
        name: "One-Year Course Access (Google Pay)",
        description: "One-time Google Pay payment - Valid for one year",
        status: "active",
        amount: payment.amount.toString(),
        currency: payment.currency,
        intervalLength: 12,
        intervalUnit: "months",
        totalOccurrences: 1,
        startDate,
        nextPaymentDate,
        lastPaymentDate: startDate,
        successfulPayments: 1,
        totalPaid: payment.amount.toString(),
      })
      .returning();

    // Create course subscription link (critical for access)
    await db.insert(courseSubscriptions).values({
      userId: session.user.id,
      courseId: payment.courseId,
      subscriptionId: userSubscription.id,
      status: "active",
      accessLevel: "premium",
      startedAt: startDate,
      expiresAt: null,
    });

    // Background operations (non-critical)
    setImmediate(async () => {
      try {
        // TaxJar Integration - Calculate and report tax
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

            // Calculate tax breakdown for $99 tax-inclusive price
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

            console.log(
              `[TAX RESULTS] --- >>>, ${JSON.stringify(taxResult, null, 2)}`
            );

            if (taxResult.success) {
              // Validate tax calculation results
              if (isNaN(taxResult.basePrice) || isNaN(taxResult.taxAmount)) {
                console.error("Invalid tax calculation results:", taxResult);
                throw new Error("Tax calculation returned invalid values");
              }

              // Create TaxJar order for tax reporting
              await taxJarService.createOrder({
                transaction_id: transactionId,
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
                amount: Number((taxResult.basePrice / 100).toFixed(2)), // Base price in dollars
                shipping: 0,
                sales_tax: Number((taxResult.taxAmount / 100).toFixed(2)), // Tax amount in dollars
                customer_id: session.user.id,
                line_items: [
                  {
                    id: payment.courseId,
                    quantity: 1,
                    unit_price: Number((taxResult.basePrice / 100).toFixed(2)),
                    description: "One-Year Course Access (Google Pay)",
                    product_tax_code: "31000", // Digital goods
                  },
                ],
              });

              console.log("TaxJar order created successfully (Google Pay):", {
                transactionId,
                basePrice: taxResult.basePrice,
                taxAmount: taxResult.taxAmount,
                totalPrice: taxResult.totalPrice,
              });
            }
          } catch (taxError) {
            console.error("TaxJar integration error (Google Pay):", taxError);
            // Don't fail the payment if TaxJar fails
          }
        }

        // Create transaction record
        await db.insert(paymentTransactions).values({
          userId: session.user.id,
          transactionId,
          customerProfileId,
          paymentProfileId,
          authorizeNetSubscriptionId,
          type: "subscription_create",
          status: "completed",
          amount: payment.amount.toString(),
          currency: payment.currency,
          paymentMethod: "google_pay",
          cardLast4: null,
          cardType: "Google Pay",
          description: `Google Pay subscription - ${payment.courseId}`,
          invoiceNumber: `GP-INV-${Date.now()}`,
          orderNumber: `GP-ORD-${payment.courseId}-${Date.now()}`,
          responseCode: "1",
          responseMessage:
            result.responseMessage ||
            "Google Pay subscription created successfully",
          processedAt: new Date(),
        });

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
              subscriptionId: authorizeNetSubscriptionId,
              amount: payment.amount,
              transactionId,
              paymentMethod: "Google Pay",
            }),
          }
        );
      } catch (error) {
        console.error("Google Pay background processing error:", error);
      }
    });

    return NextResponse.json({
      success: true,
      courseId: payment.courseId,
      transactionId,
      subscriptionId: authorizeNetSubscriptionId,
      paymentMethod: "google_pay",
    });
  } catch (error) {
    console.error("Google Pay payment processing error:", error);
    return NextResponse.json(
      { error: "Google Pay payment processing failed" },
      { status: 500 }
    );
  }
}
