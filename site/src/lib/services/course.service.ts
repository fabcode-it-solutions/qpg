import { db } from "@/db";
import {
  courses,
  videos,
  userProgress,
  courseSubscriptions,
  type UserProgress as DbUserProgress,
  type NewUserProgress,
  type CourseSubscription,
  type NewCourseSubscription,
} from "@/db/schema/courses";
import {
  userSubscriptions,
  paymentTransactions,
  type UserSubscription,
  type NewUserSubscription,
  type PaymentTransaction,
  type NewPaymentTransaction,
} from "@/db/schema/auth";
import { eq, and, desc, asc, count, sql, or, gte } from "drizzle-orm";
import { AppError } from "@/lib/utils/errors";
import {
  Course,
  Video,
  CreateVideo,
  CourseProgress,
  Category,
} from "@/types/course";
import { CourseProgressSummary } from "@/types";

export class CourseService {
  async getCourseById(courseId: string): Promise<Course | null> {
    try {
      const [course] = await db
        .select()
        .from(courses)
        .where(eq(courses.id, courseId));

      if (!course) return null;

      // Transform minimal DB record to Course interface for compatibility
      return {
        id: course.id,
        title: course.title,
        description: null, // Managed in Sanity
        shortDescription: null, // Managed in Sanity
        thumbnailUrl: null, // Managed in Sanity
        price: "0", // Managed in Sanity
        priceId: "", // Managed in Sanity
        categoryId: null, // Managed in Sanity
        category: null, // Managed in Sanity
        difficulty: null, // Managed in Sanity
        duration: null, // Managed in Sanity
        isPublished: course.isPublished,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
      };
    } catch (error) {
      console.error("Database error fetching course:", error);
      // Return null instead of throwing - let Sanity be the primary source
      return null;
    }
  }

  async getAllPublishedCourses(
    page: number = 1,
    limit: number = 5
  ): Promise<{ courses: Course[]; total: number; totalPages: number }> {
    return { courses: [], total: 0, totalPages: 0 };
  }

  async getCoursesByCategory(category: string): Promise<Course[]> {
    return [];
  }

  async searchCourses(query: string): Promise<Course[]> {
    return [];
  }

  async addVideo(video: CreateVideo): Promise<Video> {
    throw new AppError("Videos are now managed in Sanity CMS", 501);
  }

  async getVideoById(videoId: string): Promise<Video | null> {
    try {
      const [video] = await db
        .select()
        .from(videos)
        .where(eq(videos.id, videoId));

      if (!video) return null;

      // Transform minimal DB record to Video interface for compatibility
      return {
        id: video.id,
        courseId: video.courseId,
        title: video.title,
        description: null, // Managed in Sanity
        bunnyVideoId: "", // Managed in Sanity
        bunnyLibraryId: "", // Managed in Sanity
        bunnyCollectionId: null, // Managed in Sanity
        bunnyStreamUrl: null, // Managed in Sanity
        bunnyThumbnailUrl: null, // Managed in Sanity
        bunnyVideoStatus: "ready", // Managed in Sanity
        bunnyEncodingProgress: 100, // Managed in Sanity
        tokenSecurityKey: "", // Managed in Sanity
        duration: null, // Managed in Sanity
        width: null, // Managed in Sanity
        height: null, // Managed in Sanity
        fileSize: null, // Managed in Sanity
        bitrate: null, // Managed in Sanity
        framerate: null, // Managed in Sanity
        codec: null, // Managed in Sanity
        order: 0, // Managed in Sanity
        isPublished: video.isPublished || false,
        createdAt: video.createdAt || new Date(),
        updatedAt: video.updatedAt || new Date(),
      };
    } catch (error) {
      console.error("Database error fetching video:", error);
      // Return null instead of throwing - let Sanity be the primary source
      return null;
    }
  }

  async getVideosByCourse(courseId: string): Promise<Video[]> {
    return [];
  }

  async hasUserAccess(userId: string, courseId: string): Promise<boolean> {
    try {
      // Use the comprehensive course access system
      const { checkCourseAccess } = await import(
        "@/lib/access-control/course-access"
      );
      const accessResult = await checkCourseAccess(userId, courseId);
      return accessResult.hasAccess;
    } catch (error) {
      console.error("Error checking user access:", error);
      throw new AppError("Failed to check user access", 500);
    }
  }

  async createSubscription(
    subscription: NewUserSubscription
  ): Promise<UserSubscription> {
    try {
      // Create the new subscription
      const [newSubscription] = await db
        .insert(userSubscriptions)
        .values(subscription)
        .returning();

      return newSubscription;
    } catch (error: any) {
      console.error("Error creating subscription:", error);
      throw new AppError("Failed to create subscription", 500);
    }
  }

  async getUserSubscriptionsForCourse(
    userId: string,
    courseId: string
  ): Promise<CourseSubscription[]> {
    try {
      const subscriptions = await db
        .select()
        .from(courseSubscriptions)
        .where(
          and(
            eq(courseSubscriptions.userId, userId),
            eq(courseSubscriptions.courseId, courseId)
          )
        )
        .orderBy(desc(courseSubscriptions.createdAt));

      return subscriptions;
    } catch (error) {
      console.error("Failed to get user subscriptions for course:", error);
      return [];
    }
  }

  async updateSubscriptionStatus(
    subscriptionId: string,
    status:
      | "active"
      | "inactive"
      | "expired"
      | "cancelled"
      | "pending"
      | "trial"
  ): Promise<void> {
    try {
      await db
        .update(userSubscriptions)
        .set({
          status,
          updatedAt: new Date(),
        })
        .where(eq(userSubscriptions.id, subscriptionId));
    } catch (error) {
      throw new AppError("Failed to update subscription status", 500);
    }
  }

  async updateSubscription(
    subscriptionId: string,
    updates: Partial<
      Pick<
        UserSubscription,
        | "status"
        | "endDate"
        | "cancelledAt"
        | "cancellationReason"
        | "amount"
        | "currency"
      >
    >
  ): Promise<void> {
    try {
      await db
        .update(userSubscriptions)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(userSubscriptions.id, subscriptionId));
    } catch (error) {
      console.error("Error updating subscription:", error);
      throw new AppError("Failed to update subscription", 500);
    }
  }

  async getUserSubscriptions(userId: string): Promise<UserSubscription[]> {
    try {
      return await db
        .select()
        .from(userSubscriptions)
        .where(
          and(
            eq(userSubscriptions.userId, userId),
            or(
              eq(userSubscriptions.status, "active"),
              eq(userSubscriptions.status, "pending_cancellation")
            )
          )
        )
        .orderBy(desc(userSubscriptions.createdAt));
    } catch (error) {
      console.log("user subscription fetch error", error);
      throw new AppError("Failed to fetch user subscriptions", 500);
    }
  }

  async getSubscriptionsByAuthorizeNetCustomerId(
    customerProfileId: string
  ): Promise<UserSubscription[]> {
    try {
      return await db
        .select()
        .from(userSubscriptions)
        .where(eq(userSubscriptions.customerProfileId, customerProfileId))
        .orderBy(desc(userSubscriptions.createdAt));
    } catch (error) {
      throw new AppError(
        "Failed to fetch subscriptions by Authorize.net customer ID",
        500
      );
    }
  }

  async getUserVideoProgress(userId: string, videoId: string): Promise<any> {
    try {
      const [progress] = await db
        .select()
        .from(userProgress)
        .where(
          and(
            eq(userProgress.userId, userId),
            eq(userProgress.videoId, videoId)
          )
        );

      return progress || null;
    } catch (error) {
      throw new AppError("Failed to fetch user video progress", 500);
    }
  }

  async updateProgress(progress: NewUserProgress): Promise<DbUserProgress> {
    try {
      // Ensure all duration values are integers to prevent database type errors
      const safeProgress = {
        ...progress,
        watchedDuration: Math.floor(progress.watchedDuration || 0),
        totalDuration: progress.totalDuration
          ? Math.floor(progress.totalDuration)
          : null,
        progressPercentage: Math.round(progress.progressPercentage || 0),
      };

      const existingProgress = await db
        .select()
        .from(userProgress)
        .where(
          and(
            eq(userProgress.userId, safeProgress.userId),
            eq(userProgress.videoId, safeProgress.videoId)
          )
        );

      let updatedProgress: DbUserProgress;

      if (existingProgress.length > 0) {
        const [updated] = await db
          .update(userProgress)
          .set({
            watchedDuration: safeProgress.watchedDuration,
            totalDuration: safeProgress.totalDuration,
            progressPercentage: safeProgress.progressPercentage,
            isCompleted: safeProgress.isCompleted,
            lastWatchedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(userProgress.id, existingProgress[0].id))
          .returning();

        updatedProgress = updated;
      } else {
        const [newProgress] = await db
          .insert(userProgress)
          .values({
            ...safeProgress, // Use the safe version with integer values
            lastWatchedAt: new Date(),
          })
          .returning();

        updatedProgress = newProgress;
      }

      // Note: Course progress updates are now handled by the enhanced progress service

      return updatedProgress;
    } catch (error: any) {
      // Handle foreign key constraint errors more gracefully
      if (error?.code === "23503") {
        const constraint = error?.constraint || "";
        if (constraint.includes("user_id")) {
          throw new AppError(
            "User session is invalid. Please log in again.",
            401
          );
        }
        if (constraint.includes("video_id")) {
          throw new AppError("Video not found", 404);
        }
        if (constraint.includes("course_id")) {
          throw new AppError("Course not found", 404);
        }
      }
      console.log("failed to update the video progress", error);

      throw new AppError("Failed to update progress", 500);
    }
  }

  /**
   * Get comprehensive course progress using new progress service
   */
  async getEnhancedCourseProgress(
    userId: string,
    courseId: string
  ): Promise<CourseProgressSummary | null> {
    try {
      throw new AppError(
        "Progress tracking is now handled by enhanced-progress.service",
        501
      );
    } catch (error) {
      return null;
    }
  }

  /**
   * Get user's overall progress across all courses
   */
  async getUserProgressOverview(userId: string) {
    try {
      throw new AppError(
        "Progress tracking is now handled by enhanced-progress.service",
        501
      );
    } catch (error) {
      return {
        userId,
        totalCourses: 0,
        completedCourses: 0,
        inProgressCourses: 0,
        totalWatchTime: 0,
        coursesProgress: [],
      };
    }
  }

  async getCourseProgress(
    userId: string,
    courseId: string
  ): Promise<CourseProgress> {
    try {
      const totalVideosResult = await db
        .select({ count: count() })
        .from(videos)
        .where(eq(videos.courseId, courseId));

      const completedVideosResult = await db
        .select({ count: count() })
        .from(userProgress)
        .where(
          and(
            eq(userProgress.userId, userId),
            eq(userProgress.courseId, courseId),
            eq(userProgress.isCompleted, true)
          )
        );

      const totalVideos = totalVideosResult[0]?.count || 0;
      const completedVideos = completedVideosResult[0]?.count || 0;
      const progressPercentage =
        totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0;

      return {
        courseId,
        totalVideos,
        completedVideos,
        progressPercentage,
      };
    } catch (error) {
      throw new AppError("Failed to calculate course progress", 500);
    }
  }

  async getUserProgress(
    userId: string,
    courseId: string
  ): Promise<DbUserProgress[]> {
    try {
      return await db
        .select()
        .from(userProgress)
        .where(
          and(
            eq(userProgress.userId, userId),
            eq(userProgress.courseId, courseId)
          )
        );
    } catch (error) {
      throw new AppError("Failed to fetch user progress", 500);
    }
  }

  // Category methods - now handled by Sanity via hybrid service
  async getAllCategories(): Promise<Category[]> {
    return [];
  }

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    return null;
  }

  async getCoursesByCategoryID(
    categoryId: string,
    page: number = 1,
    limit: number = 5
  ): Promise<{ courses: Course[]; total: number; totalPages: number }> {
    return { courses: [], total: 0, totalPages: 0 };
  }

  // Payment Transaction methods
  async createPaymentTransaction(
    payment: NewPaymentTransaction
  ): Promise<PaymentTransaction> {
    try {
      const [newPayment] = await db
        .insert(paymentTransactions)
        .values(payment)
        .returning();

      return newPayment;
    } catch (error: any) {
      console.error("Error creating payment transaction:", error);
      throw new AppError("Failed to create payment transaction", 500);
    }
  }

  async getUserPaymentTransactions(
    userId: string,
    limit: number = 20
  ): Promise<PaymentTransaction[]> {
    try {
      const payments = await db
        .select()
        .from(paymentTransactions)
        .where(eq(paymentTransactions.userId, userId))
        .orderBy(desc(paymentTransactions.createdAt))
        .limit(limit);
      return payments;
    } catch (error) {
      console.error("Error fetching user payment transactions:", error);
      throw new AppError("Failed to fetch payment transactions", 500);
    }
  }

  // Note: Course-specific payment tracking is now handled via subscription relationships

  async getPaymentByTransactionId(
    transactionId: string
  ): Promise<PaymentTransaction | null> {
    try {
      const [payment] = await db
        .select()
        .from(paymentTransactions)
        .where(eq(paymentTransactions.transactionId, transactionId));

      return payment || null;
    } catch (error) {
      throw new AppError("Failed to fetch payment by transaction ID", 500);
    }
  }

  async getPaymentTransactionById(
    paymentId: string
  ): Promise<PaymentTransaction | null> {
    try {
      const [payment] = await db
        .select()
        .from(paymentTransactions)
        .where(eq(paymentTransactions.id, paymentId));

      return payment || null;
    } catch (error) {
      throw new AppError("Failed to fetch payment by ID", 500);
    }
  }

  async getPaymentTransactionsBySubscriptionId(
    subscriptionId: string
  ): Promise<PaymentTransaction[]> {
    try {
      const payments = await db
        .select()
        .from(paymentTransactions)
        .where(
          eq(paymentTransactions.authorizeNetSubscriptionId, subscriptionId)
        )
        .orderBy(desc(paymentTransactions.createdAt));

      return payments;
    } catch (error) {
      console.log(
        "error fetching payment transactions by subscription ID",
        error
      );
      throw new AppError("Failed to fetch payments by subscription ID", 500);
    }
  }

  async updatePaymentTransaction(
    paymentId: string,
    updates: Partial<
      Pick<
        PaymentTransaction,
        "status" | "processedAt" | "responseMessage" | "amount" | "description"
      >
    >
  ): Promise<void> {
    try {
      await db
        .update(paymentTransactions)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(paymentTransactions.id, paymentId));
    } catch (error) {
      console.error("Error updating payment transaction:", error);
      throw new AppError("Failed to update payment transaction", 500);
    }
  }

  // Authorize.net webhook event processing
  async alreadyProcessed(eventId: string): Promise<boolean> {
    try {
      const { authorizeNetWebhookEvents } = await import("@/db/schema/courses");
      const [event] = await db
        .select()
        .from(authorizeNetWebhookEvents)
        .where(eq(authorizeNetWebhookEvents.eventId, eventId))
        .limit(1);
      return !!event;
    } catch (err) {
      console.warn("alreadyProcessed check failed:", err);
      return false;
    }
  }

  async markProcessed(eventId: string, type: string) {
    try {
      const { authorizeNetWebhookEvents } = await import("@/db/schema/courses");
      await db
        .insert(authorizeNetWebhookEvents)
        .values({
          eventId,
          eventType: type,
          processed: true,
        })
        .onConflictDoNothing();
    } catch (err) {
      console.warn("markProcessed failed (non-fatal):", err);
    }
  }

  // Authorize.net webhook event management
  async getAuthorizeNetWebhookEvent(eventId: string) {
    try {
      const { authorizeNetWebhookEvents } = await import("@/db/schema/courses");
      const [event] = await db
        .select()
        .from(authorizeNetWebhookEvents)
        .where(eq(authorizeNetWebhookEvents.eventId, eventId));
      return event || null;
    } catch (error) {
      console.error("Error getting webhook event:", error);
      return null;
    }
  }

  async createAuthorizeNetWebhookEvent(eventData: {
    eventId: string;
    eventType: string;
    processed: boolean;
  }) {
    try {
      const { authorizeNetWebhookEvents } = await import("@/db/schema/courses");
      const [event] = await db
        .insert(authorizeNetWebhookEvents)
        .values(eventData)
        .returning();
      return event;
    } catch (error) {
      console.error("Error creating webhook event:", error);
      return null;
    }
  }

  async updateAuthorizeNetWebhookEvent(
    eventId: string,
    updateData: { processed: boolean }
  ) {
    try {
      const { authorizeNetWebhookEvents } = await import("@/db/schema/courses");
      await db
        .update(authorizeNetWebhookEvents)
        .set(updateData)
        .where(eq(authorizeNetWebhookEvents.eventId, eventId));
      return true;
    } catch (error) {
      console.error("Error updating webhook event:", error);
      return false;
    }
  }

  // Subscription management
  async getSubscriptionByAuthorizeNetId(
    authorizeNetSubId: string
  ): Promise<UserSubscription | null> {
    try {
      const [subscription] = await db
        .select()
        .from(userSubscriptions)
        .where(
          eq(userSubscriptions.authorizeNetSubscriptionId, authorizeNetSubId)
        );
      return subscription || null;
    } catch (error) {
      console.error("Error getting subscription by Authorize.net ID:", error);
      return null;
    }
  }

  async getSubscriptionById(
    subscriptionId: string
  ): Promise<UserSubscription | null> {
    try {
      const [subscription] = await db
        .select()
        .from(userSubscriptions)
        .where(eq(userSubscriptions.id, subscriptionId));
      return subscription || null;
    } catch (error) {
      console.error("Error getting subscription by ID:", error);
      return null;
    }
  }

  // Payment session management
  async createPaymentSession(sessionData: {
    authorizeNetTransactionId: string;
    authorizeNetCustomerProfileId: string;
    authorizeNetSubscriptionId: string;
    userId: string;
    courseId: string;
    amount: number;
    currency: string;
  }) {
    try {
      const { paymentSessions } = await import("@/db/schema/courses");
      const [session] = await db
        .insert(paymentSessions)
        .values(sessionData)
        .returning();
      return session;
    } catch (error) {
      console.error("Error creating payment session:", error);
      return null;
    }
  }

  async getPaymentSessionsByCustomer(customerProfileId: string) {
    try {
      const { paymentSessions } = await import("@/db/schema/courses");
      const sessions = await db
        .select()
        .from(paymentSessions)
        .where(
          eq(paymentSessions.authorizeNetCustomerProfileId, customerProfileId)
        )
        .orderBy(desc(paymentSessions.createdAt));
      return sessions;
    } catch (error) {
      console.error("Error getting payment sessions by customer:", error);
      return [];
    }
  }

  async getRecentPaymentSessionsByCustomer(
    customerProfileId: string,
    since: Date
  ) {
    try {
      const { paymentSessions } = await import("@/db/schema/courses");
      const { gte } = await import("drizzle-orm");
      const sessions = await db
        .select()
        .from(paymentSessions)
        .where(
          and(
            eq(
              paymentSessions.authorizeNetCustomerProfileId,
              customerProfileId
            ),
            gte(paymentSessions.createdAt, since)
          )
        )
        .orderBy(desc(paymentSessions.createdAt));
      return sessions;
    } catch (error) {
      console.error("Error getting recent payment sessions:", error);
      return [];
    }
  }

  // User subscription management
  async deactivateUserSubscriptions(userId: string) {
    try {
      await db
        .update(userSubscriptions)
        .set({
          status: "cancelled",
          cancelledAt: new Date(),
          cancellationReason: "Replaced by new subscription",
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(userSubscriptions.userId, userId),
            eq(userSubscriptions.status, "active")
          )
        );
      return true;
    } catch (error) {
      console.error("Error deactivating user subscriptions:", error);
      return false;
    }
  }

  // Webhook cleanup - auto-delete old processed events
  async cleanupOldWebhookEvents(daysOld: number = 5) {
    try {
      const { authorizeNetWebhookEvents } = await import("@/db/schema/courses");
      const { lt } = await import("drizzle-orm");

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      await db
        .delete(authorizeNetWebhookEvents)
        .where(
          and(
            eq(authorizeNetWebhookEvents.processed, true),
            lt(authorizeNetWebhookEvents.createdAt, cutoffDate)
          )
        );

      console.log(`Cleaned up old webhook events older than ${daysOld} days`);
      return true;
    } catch (error) {
      console.error("Error cleaning up webhook events:", error);
      return false;
    }
  }

  // Authorize.net webhook event storage methods
  async storeAuthorizeNetWebhookEvent(
    eventId: string,
    eventType: string,
    customerProfileId: string,
    eventData: any
  ) {
    try {
      const { authorizeNetWebhookEvents } = await import("@/db/schema/courses");
      await db
        .insert(authorizeNetWebhookEvents)
        .values({
          eventId,
          eventType,
          customerProfileId,
          eventData: JSON.stringify(eventData),
          processed: false,
        })
        .onConflictDoNothing();
      return true;
    } catch (error) {
      console.error("Error storing webhook event:", error);
      return false;
    }
  }

  async getUnprocessedAuthorizeNetWebhookEvents(customerProfileId: string) {
    try {
      const { authorizeNetWebhookEvents } = await import("@/db/schema/courses");
      const events = await db
        .select({
          eventId: authorizeNetWebhookEvents.eventId,
          eventType: authorizeNetWebhookEvents.eventType,
          eventData: authorizeNetWebhookEvents.eventData,
        })
        .from(authorizeNetWebhookEvents)
        .where(
          and(
            eq(authorizeNetWebhookEvents.customerProfileId, customerProfileId),
            eq(authorizeNetWebhookEvents.processed, false)
          )
        )
        .orderBy(asc(authorizeNetWebhookEvents.createdAt));

      return events.map((event) => ({
        ...event,
        eventData: JSON.parse(event.eventData || "{}"),
      }));
    } catch (error) {
      console.error("Error getting unprocessed webhook events:", error);
      return [];
    }
  }

  async markAuthorizeNetWebhookEventsProcessed(customerProfileId: string) {
    try {
      const { authorizeNetWebhookEvents } = await import("@/db/schema/courses");
      await db
        .update(authorizeNetWebhookEvents)
        .set({ processed: true })
        .where(
          and(
            eq(authorizeNetWebhookEvents.customerProfileId, customerProfileId),
            eq(authorizeNetWebhookEvents.processed, false)
          )
        );
      return true;
    } catch (error) {
      console.error("Error marking webhook events as processed:", error);
      return false;
    }
  }

  async createOrUpdateSubscriptionFromAuthorizeNetWebhook(data: {
    userId: string;
    customerProfileId: string;
    subscriptionId: string;
    amount: number;
    currency: string;
    name: string;
    description?: string;
    intervalLength: number;
    intervalUnit: string;
    startDate: Date;
    endDate?: Date;
  }) {
    try {
      const [subscription] = await db
        .insert(userSubscriptions)
        .values({
          userId: data.userId,
          authorizeNetSubscriptionId: data.subscriptionId,
          customerProfileId: data.customerProfileId,
          paymentProfileId: "", // Will be updated when payment profile is available
          name: data.name,
          description: data.description,
          status: "active",
          amount: (data.amount / 100).toFixed(2),
          currency: data.currency,
          intervalLength: data.intervalLength,
          intervalUnit: data.intervalUnit,
          startDate: data.startDate,
          endDate: data.endDate,
        })
        .onConflictDoUpdate({
          target: userSubscriptions.authorizeNetSubscriptionId,
          set: {
            status: "active",
            amount: (data.amount / 100).toFixed(2),
            currency: data.currency,
            updatedAt: new Date(),
          },
        })
        .returning();

      return subscription;
    } catch (error) {
      console.error(
        "Error creating/updating subscription from Authorize.net webhook:",
        error
      );
      throw error;
    }
  }

  async createPaymentFromAuthorizeNetWebhook(data: {
    userId: string;
    subscriptionId: string;
    transactionId: string;
    amount: number;
    currency: string;
    customerProfileId?: string;
    paymentProfileId?: string;
    responseCode?: string;
    responseMessage?: string;
    authCode?: string;
    processedAt?: Date;
  }) {
    try {
      return await this.createPaymentTransaction({
        userId: data.userId,
        transactionId: data.transactionId,
        customerProfileId: data.customerProfileId,
        paymentProfileId: data.paymentProfileId,
        authorizeNetSubscriptionId: data.subscriptionId,
        type: "subscription_payment",
        status: "completed",
        amount: (data.amount / 100).toFixed(2),
        currency: data.currency,
        paymentMethod: "credit_card",
        description: "Subscription payment",
        responseCode: data.responseCode,
        responseMessage: data.responseMessage,
        authCode: data.authCode,
        processedAt: data.processedAt || new Date(),
      });
    } catch (error) {
      console.error(
        "Error creating payment from Authorize.net webhook:",
        error
      );
      throw error;
    }
  }
}
