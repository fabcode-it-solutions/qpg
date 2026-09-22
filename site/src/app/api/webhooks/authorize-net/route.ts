import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { authorizeNetWebhookEvents } from "@/db/schema/courses";
import { paymentTransactions, userSubscriptions } from "@/db/schema/auth";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import crypto from "crypto";

// Webhook signature verification
function verifyWebhookSignature(body: string, signature: string | null): boolean {
  if (!signature || !process.env.AUTHORIZE_NET_WEBHOOK_SECRET) {
    console.error("Missing webhook signature or secret");
    return false;
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha512', process.env.AUTHORIZE_NET_WEBHOOK_SECRET)
      .update(body, 'utf8')
      .digest('hex');
    
    const providedSignature = signature.replace('sha512=', '');
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(providedSignature, 'hex')
    );
  } catch (error) {
    console.error("Signature verification failed:", error instanceof Error ? error.message : "Unknown error");
    return false;
  }
}

// Sanitize data for logging
function sanitizeForLog(data: any): string {
  if (typeof data === 'string') {
    return data.replace(/[\r\n\t]/g, ' ').substring(0, 200);
  }
  return JSON.stringify(data).replace(/[\r\n\t]/g, ' ').substring(0, 200);
}

export async function POST(req: NextRequest) {
  let eventId: string | null = null;
  
  try {
    const body = await req.text();
    const signature = req.headers.get("x-anet-signature");
    
    // Verify webhook signature
    if (!verifyWebhookSignature(body, signature)) {
      console.error("Webhook signature verification failed");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    let webhookData;
    try {
      webhookData = JSON.parse(body);
    } catch (parseError) {
      console.error("Invalid JSON in webhook:", sanitizeForLog(body));
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    // Validate required fields
    if (!webhookData.eventType) {
      console.error("Missing eventType in webhook data");
      return NextResponse.json({ error: "Missing eventType" }, { status: 400 });
    }

    // Use database transaction for atomicity
    await db.transaction(async (tx) => {
      // Store webhook event
      eventId = nanoid();
      await tx.insert(authorizeNetWebhookEvents).values({
        eventId: eventId,
        eventType: webhookData.eventType,
        eventData: JSON.stringify(webhookData),
        processed: false,
      });

      // Process webhook based on event type
      await processWebhookEvent(webhookData, tx);
      
      // Mark as processed
      await tx
        .update(authorizeNetWebhookEvents)
        .set({ processed: true })
        .where(eq(authorizeNetWebhookEvents.eventId, eventId!));
    });

    console.log("Webhook processed successfully:", sanitizeForLog(webhookData.eventType));
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error instanceof Error ? error.message : "Unknown error");
    
    // Mark event as failed if we have an eventId
    if (eventId) {
      try {
        await db
          .update(authorizeNetWebhookEvents)
          .set({ processed: false })
          .where(eq(authorizeNetWebhookEvents.eventId, eventId));
      } catch (updateError) {
        console.error("Failed to update webhook event status:", updateError instanceof Error ? updateError.message : "Unknown error");
      }
    }
    
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}

async function processWebhookEvent(webhookData: any, tx: any) {
  const eventType = webhookData.eventType;
  
  try {
    switch (eventType) {
      case "net.authorize.payment.authcapture.created":
        await handlePaymentCreated(webhookData, tx);
        break;
      case "net.authorize.payment.capture.created":
        await handlePaymentCaptured(webhookData, tx);
        break;
      case "net.authorize.payment.refund.created":
        await handlePaymentRefunded(webhookData, tx);
        break;
      case "net.authorize.payment.void.created":
        await handlePaymentVoided(webhookData, tx);
        break;
      case "net.authorize.customer.subscription.created":
        await handleSubscriptionCreated(webhookData, tx);
        break;
      case "net.authorize.customer.subscription.cancelled":
        await handleSubscriptionCancelled(webhookData, tx);
        break;
      default:
        console.log("Unhandled webhook event type:", sanitizeForLog(eventType));
    }
  } catch (error) {
    console.error("Error processing webhook event:", sanitizeForLog(eventType), error instanceof Error ? error.message : "Unknown error");
    throw error; // Re-throw to trigger transaction rollback
  }
}

async function handlePaymentCreated(webhookData: any, tx: any) {
  try {
    const payload = webhookData.payload;
    if (!payload?.id) {
      throw new Error("Missing transaction ID in payment created webhook");
    }
    
    const transactionId = payload.id;
    
    // Update existing payment transaction or create new one
    const existingTransaction = await tx
      .select()
      .from(paymentTransactions)
      .where(eq(paymentTransactions.transactionId, transactionId))
      .limit(1);

    if (existingTransaction.length > 0) {
      // Update existing transaction
      await tx
        .update(paymentTransactions)
        .set({
          status: "completed",
          responseCode: payload.responseCode || null,
          responseMessage: payload.responseReasonDescription || null,
        })
        .where(eq(paymentTransactions.transactionId, transactionId));
    }
  } catch (error) {
    console.error("Error handling payment created:", error instanceof Error ? error.message : "Unknown error");
    throw error;
  }
}

async function handlePaymentCaptured(webhookData: any, tx: any) {
  try {
    const payload = webhookData.payload;
    if (!payload?.id) {
      throw new Error("Missing transaction ID in payment captured webhook");
    }
    
    const transactionId = payload.id;
    
    await tx
      .update(paymentTransactions)
      .set({
        status: "completed",
        processedAt: new Date(),
      })
      .where(eq(paymentTransactions.transactionId, transactionId));
  } catch (error) {
    console.error("Error handling payment captured:", error instanceof Error ? error.message : "Unknown error");
    throw error;
  }
}

async function handlePaymentRefunded(webhookData: any, tx: any) {
  try {
    const payload = webhookData.payload;
    if (!payload?.id) {
      throw new Error("Missing transaction ID in payment refunded webhook");
    }
    
    const transactionId = payload.id;
    
    await tx
      .update(paymentTransactions)
      .set({
        status: "refunded",
        processedAt: new Date(),
      })
      .where(eq(paymentTransactions.transactionId, transactionId));
  } catch (error) {
    console.error("Error handling payment refunded:", error instanceof Error ? error.message : "Unknown error");
    throw error;
  }
}

async function handlePaymentVoided(webhookData: any, tx: any) {
  try {
    const payload = webhookData.payload;
    if (!payload?.id) {
      throw new Error("Missing transaction ID in payment voided webhook");
    }
    
    const transactionId = payload.id;
    
    await tx
      .update(paymentTransactions)
      .set({
        status: "cancelled",
        processedAt: new Date(),
      })
      .where(eq(paymentTransactions.transactionId, transactionId));
  } catch (error) {
    console.error("Error handling payment voided:", error instanceof Error ? error.message : "Unknown error");
    throw error;
  }
}

async function handleSubscriptionCreated(webhookData: any, tx: any) {
  try {
    const payload = webhookData.payload;
    if (!payload?.id) {
      throw new Error("Missing subscription ID in subscription created webhook");
    }
    
    const subscriptionId = payload.id;
    
    // Update subscription status if exists
    const existingSubscription = await tx
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.authorizeNetSubscriptionId, subscriptionId))
      .limit(1);

    if (existingSubscription.length > 0) {
      await tx
        .update(userSubscriptions)
        .set({
          status: "active",
        })
        .where(eq(userSubscriptions.authorizeNetSubscriptionId, subscriptionId));
    }
  } catch (error) {
    console.error("Error handling subscription created:", error instanceof Error ? error.message : "Unknown error");
    throw error;
  }
}

async function handleSubscriptionCancelled(webhookData: any, tx: any) {
  try {
    const payload = webhookData.payload;
    if (!payload?.id) {
      throw new Error("Missing subscription ID in subscription cancelled webhook");
    }
    
    const subscriptionId = payload.id;
    
    await tx
      .update(userSubscriptions)
      .set({
        status: "cancelled",
        cancelledAt: new Date(),
      })
      .where(eq(userSubscriptions.authorizeNetSubscriptionId, subscriptionId));
  } catch (error) {
    console.error("Error handling subscription cancelled:", error instanceof Error ? error.message : "Unknown error");
    throw error;
  }
}