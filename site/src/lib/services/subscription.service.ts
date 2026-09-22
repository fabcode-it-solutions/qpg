import { db } from "@/db";
import { userSubscriptions } from "@/db/schema/auth";
import { courseSubscriptions, courses } from "@/db/schema/courses";
import { eq, and, desc } from "drizzle-orm";
import { UserSubscription } from "@/types/profile";

export class SubscriptionService {
  /**
   * Get user subscriptions with course information
   */
  static async getUserSubscriptions(
    userId: string
  ): Promise<UserSubscription[]> {
    try {
      const subscriptions = await db
        .select({
          id: userSubscriptions.id,
          authorizeNetSubscriptionId: userSubscriptions.authorizeNetSubscriptionId,
          name: userSubscriptions.name,
          status: userSubscriptions.status,
          amount: userSubscriptions.amount,
          currency: userSubscriptions.currency,
          startDate: userSubscriptions.startDate,
          endDate: userSubscriptions.endDate,
          nextPaymentDate: userSubscriptions.nextPaymentDate,
          cancelledAt: userSubscriptions.cancelledAt,
          cancellationReason: userSubscriptions.cancellationReason,
        })
        .from(userSubscriptions)
        .where(eq(userSubscriptions.userId, userId))
        .orderBy(desc(userSubscriptions.createdAt));

      return subscriptions.map((sub) => ({
        id: sub.id,
        courseId: null,
        courseName: sub.name || "Subscription",
        type: "recurring",
        status: sub.status as "active" | "cancelled" | "suspended" | "expired" | "terminated",
        price: sub.amount || "0",
        currency: sub.currency || "USD",
        startedAt: sub.startDate?.toISOString() || "",
        expiresAt: sub.endDate?.toISOString(),
        trialEndsAt: undefined,
        canceledAt: sub.cancelledAt?.toISOString(),
        cancelReason: sub.cancellationReason,
        stripeSubscriptionId: sub.authorizeNetSubscriptionId,
        authorizeNetSubscriptionId: sub.authorizeNetSubscriptionId,
        name: sub.name,
        nextPaymentDate: sub.nextPaymentDate?.toISOString(),
      }));
    } catch (error) {
      console.error("Subscriptions fetch error:", error);
      throw new Error("Failed to fetch subscriptions");
    }
  }

  /**
   * Get single subscription by ID and user ID
   */
  static async getSubscription(
    subscriptionId: string,
    userId: string
  ): Promise<UserSubscription | null> {
    try {
      const subscription = await db
        .select({
          id: userSubscriptions.id,
          authorizeNetSubscriptionId: userSubscriptions.authorizeNetSubscriptionId,
          name: userSubscriptions.name,
          status: userSubscriptions.status,
          amount: userSubscriptions.amount,
          currency: userSubscriptions.currency,
          startDate: userSubscriptions.startDate,
          endDate: userSubscriptions.endDate,
          nextPaymentDate: userSubscriptions.nextPaymentDate,
          cancelledAt: userSubscriptions.cancelledAt,
          cancellationReason: userSubscriptions.cancellationReason,
        })
        .from(userSubscriptions)
        .where(
          and(
            eq(userSubscriptions.id, subscriptionId),
            eq(userSubscriptions.userId, userId)
          )
        )
        .limit(1);

      if (subscription.length === 0) {
        return null;
      }

      const sub = subscription[0];
      return {
        id: sub.id,
        courseId: null,
        courseName: sub.name || "Subscription",
        type: "recurring",
        status: sub.status as "active" | "cancelled" | "suspended" | "expired" | "terminated",
        price: sub.amount || "0",
        currency: sub.currency || "USD",
        startedAt: sub.startDate?.toISOString() || "",
        expiresAt: sub.endDate?.toISOString(),
        trialEndsAt: undefined,
        canceledAt: sub.cancelledAt?.toISOString(),
        cancelReason: sub.cancellationReason,
        stripeSubscriptionId: sub.authorizeNetSubscriptionId,
        authorizeNetSubscriptionId: sub.authorizeNetSubscriptionId,
        name: sub.name,
        nextPaymentDate: sub.nextPaymentDate?.toISOString(),
      };
    } catch (error) {
      console.error("Subscription fetch error:", error);
      throw new Error("Failed to fetch subscription");
    }
  }

  /**
   * Cancel user subscription
   */
  static async cancelSubscription(
    subscriptionId: string,
    userId: string,
    reason?: string
  ): Promise<boolean> {
    try {
      // Verify ownership and get current status
      const subscription = await db
        .select()
        .from(userSubscriptions)
        .where(
          and(
            eq(userSubscriptions.id, subscriptionId),
            eq(userSubscriptions.userId, userId)
          )
        )
        .limit(1);

      if (subscription.length === 0) {
        throw new Error("Subscription not found");
      }

      const sub = subscription[0];
      
      // Check if already cancelled
      if (sub.status === "cancelled" || sub.cancelledAt) {
        throw new Error("Subscription is already cancelled");
      }

      // TODO: Implement Authorize.net subscription cancellation API call
      // For now, just update the database
      await db
        .update(userSubscriptions)
        .set({
          status: "cancelled",
          cancelledAt: new Date(),
          cancellationReason: reason || "User requested cancellation",
          updatedAt: new Date(),
        })
        .where(eq(userSubscriptions.id, subscriptionId));

      return true;
    } catch (error) {
      console.error("Subscription cancellation error:", error);
      throw error instanceof Error
        ? error
        : new Error("Failed to cancel subscription");
    }
  }

  /**
   * Get active subscriptions count for user
   */
  static async getActiveSubscriptionsCount(userId: string): Promise<number> {
    try {
      const count = await db
        .select({ count: userSubscriptions.id })
        .from(userSubscriptions)
        .where(
          and(
            eq(userSubscriptions.userId, userId),
            eq(userSubscriptions.status, "active")
          )
        );

      return count.length;
    } catch (error) {
      console.error("Active subscriptions count error:", error);
      return 0;
    }
  }

  /**
   * Check if user has access to course
   */
  static async hasAccessToCourse(
    userId: string,
    courseId: string
  ): Promise<boolean> {
    try {
      // Check via courseSubscriptions table
      const subscription = await db
        .select()
        .from(courseSubscriptions)
        .where(
          and(
            eq(courseSubscriptions.userId, userId),
            eq(courseSubscriptions.courseId, courseId),
            eq(courseSubscriptions.status, "active")
          )
        )
        .limit(1);

      return subscription.length > 0;
    } catch (error) {
      console.error("Course access check error:", error);
      return false;
    }
  }

  /**
   * Get expiring subscriptions (within specified days)
   */
  static async getExpiringSubscriptions(
    userId: string,
    days: number = 7
  ): Promise<UserSubscription[]> {
    try {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + days);

      const subscriptions = await db
        .select({
          id: userSubscriptions.id,
          authorizeNetSubscriptionId: userSubscriptions.authorizeNetSubscriptionId,
          name: userSubscriptions.name,
          status: userSubscriptions.status,
          amount: userSubscriptions.amount,
          currency: userSubscriptions.currency,
          startDate: userSubscriptions.startDate,
          endDate: userSubscriptions.endDate,
          nextPaymentDate: userSubscriptions.nextPaymentDate,
          cancelledAt: userSubscriptions.cancelledAt,
          cancellationReason: userSubscriptions.cancellationReason,
        })
        .from(userSubscriptions)
        .where(
          and(
            eq(userSubscriptions.userId, userId),
            eq(userSubscriptions.status, "active")
          )
        );

      return subscriptions
        .filter((sub) => {
          if (!sub.endDate) return false;
          return new Date(sub.endDate) <= expirationDate;
        })
        .map((sub) => ({
          id: sub.id,
          courseId: null,
          courseName: sub.name || "Subscription",
          type: "recurring",
          status: sub.status as "active" | "cancelled" | "suspended" | "expired" | "terminated",
          price: sub.amount || "0",
          currency: sub.currency || "USD",
          startedAt: sub.startDate?.toISOString() || "",
          expiresAt: sub.endDate?.toISOString(),
          trialEndsAt: undefined,
          canceledAt: sub.cancelledAt?.toISOString(),
          cancelReason: sub.cancellationReason,
          stripeSubscriptionId: sub.authorizeNetSubscriptionId,
          authorizeNetSubscriptionId: sub.authorizeNetSubscriptionId,
          name: sub.name,
          nextPaymentDate: sub.nextPaymentDate?.toISOString(),
        }));
    } catch (error) {
      console.error("Expiring subscriptions fetch error:", error);
      return [];
    }
  }
}
