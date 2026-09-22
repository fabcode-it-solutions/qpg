import { db } from "@/db";
import { courseSubscriptions } from "@/db/schema";
import { userSubscriptions } from "@/db/schema/auth";
import { eq, and, lt, sql } from "drizzle-orm";

/**
 * Sync subscription statuses based on dates
 * Should be run periodically (cron job)
 */
export async function syncSubscriptionStatuses() {
  const now = new Date();

  try {
    // 1. Mark expired subscriptions
    const expiredSubscriptions = await db
      .update(userSubscriptions)
      .set({ status: "expired" })
      .where(
        and(
          eq(userSubscriptions.status, "active"),
          lt(userSubscriptions.nextPaymentDate, now)
        )
      )
      .returning({ id: userSubscriptions.id });

    // 2. Mark expired pending cancellations as cancelled
    const cancelledSubscriptions = await db
      .update(userSubscriptions)
      .set({ status: "cancelled" })
      .where(
        and(
          eq(userSubscriptions.status, "pending_cancellation"),
          lt(userSubscriptions.endDate, now)
        )
      )
      .returning({ id: userSubscriptions.id });

    // 3. Update course subscriptions for expired
    if (expiredSubscriptions.length > 0) {
      await db
        .update(courseSubscriptions)
        .set({ status: "expired" })
        .where(
          eq(courseSubscriptions.subscriptionId, expiredSubscriptions[0].id)
        );
    }

    // 4. Update course subscriptions for cancelled
    if (cancelledSubscriptions.length > 0) {
      await db
        .update(courseSubscriptions)
        .set({ status: "cancelled" })
        .where(
          eq(courseSubscriptions.subscriptionId, cancelledSubscriptions[0].id)
        );
    }

    console.log(
      `Synced ${expiredSubscriptions.length} expired and ${cancelledSubscriptions.length} cancelled subscriptions`
    );

    return {
      expired: expiredSubscriptions.length,
      cancelled: cancelledSubscriptions.length,
    };
  } catch (error) {
    console.error("Subscription sync failed:", error);
    throw error;
  }
}

/**
 * Handle payment failure - suspend subscription
 */
export async function handlePaymentFailure(subscriptionId: string) {
  try {
    await db
      .update(userSubscriptions)
      .set({
        status: "suspended",
        failedPayments: sql`${userSubscriptions.failedPayments} + 1`,
      })
      .where(eq(userSubscriptions.authorizeNetSubscriptionId, subscriptionId));

    await db
      .update(courseSubscriptions)
      .set({ status: "inactive" })
      .where(
        eq(
          courseSubscriptions.subscriptionId,
          db
            .select({ id: userSubscriptions.id })
            .from(userSubscriptions)
            .where(
              eq(userSubscriptions.authorizeNetSubscriptionId, subscriptionId)
            )
        )
      );
  } catch (error) {
    console.error("Payment failure handling failed:", error);
    throw error;
  }
}

/**
 * Handle successful payment - reactivate if suspended
 */
export async function handlePaymentSuccess(subscriptionId: string) {
  try {
    const subscription = await db
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.authorizeNetSubscriptionId, subscriptionId))
      .limit(1);

    if (subscription.length && subscription[0].status === "suspended") {
      await db
        .update(userSubscriptions)
        .set({
          status: "active",
          failedPayments: 0,
        })
        .where(eq(userSubscriptions.id, subscription[0].id));

      await db
        .update(courseSubscriptions)
        .set({ status: "active" })
        .where(eq(courseSubscriptions.subscriptionId, subscription[0].id));
    }
  } catch (error) {
    console.error("Payment success handling failed:", error);
    throw error;
  }
}
