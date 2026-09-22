import { CourseService } from "./course.service";
import { sanityService } from "../sanity/service";
import { contentSyncService } from "./content-sync.service";
import {
  TransformedCourse,
  TransformedVideo,
  TransformedCategory,
} from "../sanity/types";
import { Course, Video, Category } from "@/types/course";

/**
 * Hybrid Course Service that combines Sanity CMS data with database functionality
 *
 * This service provides:
 * - Content management through Sanity (courses, videos, categories)
 * - User data and progress through database (subscriptions, progress tracking)
 * - Seamless integration between both systems
 */
export class HybridCourseService {
  private dbService: CourseService;

  constructor() {
    this.dbService = new CourseService();
  }

  // Transform Sanity course to match existing Course type
  private transformSanityCourse(sanityCourse: TransformedCourse): Course {
    return {
      id: sanityCourse.id,
      title: sanityCourse.title,
      description: sanityCourse.description || null,
      shortDescription: sanityCourse.shortDescription || null,
      thumbnailUrl: sanityCourse.thumbnailUrl || null,
      price: sanityCourse.price,
      priceId: sanityCourse.stripePriceId,
      categoryId: sanityCourse.id, // We'll use the course ID as a fallback
      category: sanityCourse.category || null, // Assuming category is string name
      difficulty: sanityCourse.difficulty || "beginner",
      duration: sanityCourse.duration || null,
      isPublished: sanityCourse.isPublished,
      createdAt: new Date(), // Sanity doesn't have exact match
      updatedAt: new Date(),
      // Include additional Sanity fields
      learningOutcomes: sanityCourse.learningOutcomes,
      prerequisites: sanityCourse.prerequisites,
      tags: sanityCourse.tags,
      slug: sanityCourse.slug,
    };
  }

  // Transform Sanity video to match existing Video type
  private transformSanityVideo(sanityVideo: TransformedVideo): Video {
    return {
      id: sanityVideo.id,
      courseId: sanityVideo.courseId,
      title: sanityVideo.title,
      description: sanityVideo.description || null,
      // videoUrl is a legacy field not in the Video interface
      bunnyVideoId: sanityVideo.bunnyVideoId,
      bunnyLibraryId: sanityVideo.bunnyLibraryId,
      bunnyCollectionId: sanityVideo.bunnyCollectionId || null,
      bunnyStreamUrl: sanityVideo.bunnyStreamUrl || null,
      bunnyThumbnailUrl: sanityVideo.bunnyThumbnailUrl || null,
      bunnyVideoStatus: sanityVideo.bunnyVideoStatus,
      bunnyEncodingProgress: sanityVideo.bunnyEncodingProgress,
      tokenSecurityKey: "sanity-managed", // We'll handle this differently for Sanity content
      duration: sanityVideo.duration || null,
      width: sanityVideo.width || null,
      height: sanityVideo.height || null,
      fileSize: sanityVideo.fileSize || null,
      bitrate: sanityVideo.bitrate || null,
      framerate: sanityVideo.framerate?.toString() || null,
      codec: sanityVideo.codec || null,
      order: sanityVideo.order,
      isPublished: sanityVideo.isPublished,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  // Transform Sanity category to match existing Category type
  private transformSanityCategory(
    sanityCategory: TransformedCategory
  ): Category {
    return {
      id: sanityCategory.id,
      name: sanityCategory.name,
      slug: sanityCategory.slug,
      description: sanityCategory.description || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  // Category methods
  async getAllCategories(): Promise<Category[]> {
    try {
      const sanityCategories = await sanityService.getAllCategories();
      return sanityCategories.map((cat) => this.transformSanityCategory(cat));
    } catch (error) {
      console.error(
        "Error fetching categories from Sanity, falling back to database:",
        error
      );
      return await this.dbService.getAllCategories();
    }
  }

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    try {
      const sanityCategory = await sanityService.getCategoryBySlug(slug);
      return sanityCategory
        ? this.transformSanityCategory(sanityCategory)
        : null;
    } catch (error) {
      console.error(
        "Error fetching category from Sanity, falling back to database:",
        error
      );
      return await this.dbService.getCategoryBySlug(slug);
    }
  }

  // Course methods - Always use Sanity for content, database for user-specific data
  async getAllPublishedCourses(page: number = 1, limit: number = 12) {
    try {
      const result = await sanityService.getAllCoursesPaginated(page, limit);
      const transformedCourses = result.courses.map((course) =>
        this.transformSanityCourse(course)
      );

      return {
        courses: transformedCourses,
        total: result.total,
        totalPages: result.totalPages,
        currentPage: result.currentPage,
      };
    } catch (error) {
      console.error(
        "Error fetching courses from Sanity, falling back to database:",
        error
      );
      return await this.dbService.getAllPublishedCourses(page, limit);
    }
  }

  async getCoursesByCategoryID(
    categoryId: string,
    page: number = 1,
    limit: number = 12
  ) {
    try {
      const result = await sanityService.getCoursesByCategoryPaginated(
        categoryId,
        page,
        limit
      );
      const transformedCourses = result.courses.map((course) =>
        this.transformSanityCourse(course)
      );

      return {
        courses: transformedCourses,
        total: result.total,
        totalPages: result.totalPages,
        currentPage: result.currentPage,
      };
    } catch (error) {
      console.error(
        "Error fetching courses by category from Sanity, falling back to database:",
        error
      );
      return await this.dbService.getCoursesByCategoryID(
        categoryId,
        page,
        limit
      );
    }
  }

  async getCourseWithVideos(
    courseId: string
  ): Promise<(Course & { videos: Video[] }) | null> {
    try {
      // Try to get from Sanity first
      const sanityCourseWithVideos = await sanityService.getCourseWithVideos(
        courseId
      );
      if (sanityCourseWithVideos) {
        const transformedCourse = this.transformSanityCourse(
          sanityCourseWithVideos
        );
        const transformedVideos = sanityCourseWithVideos.videos.map((video) =>
          this.transformSanityVideo(video)
        );

        return {
          ...transformedCourse,
          videos: transformedVideos,
        };
      }

      // Fallback to database
      return null;
    } catch (error) {
      console.error(
        "Error fetching course with videos from Sanity, falling back to database:",
        error
      );
      return null;
    }
  }

  async searchCourses(query: string): Promise<Course[]> {
    try {
      const sanityCourses = await sanityService.searchCourses(query);
      return sanityCourses.map((course) => this.transformSanityCourse(course));
    } catch (error) {
      console.error(
        "Error searching courses in Sanity, falling back to database:",
        error
      );
      return await this.dbService.searchCourses(query);
    }
  }

  async getFeaturedCourses(): Promise<Course[]> {
    try {
      const sanityCourses = await sanityService.getFeaturedCourses();
      return sanityCourses.map((course) => this.transformSanityCourse(course));
    } catch (error) {
      console.error(
        "Error fetching featured courses from Sanity, falling back to database:",
        error
      );
      // Database doesn't have featured courses, so return first 6
      const result = await this.dbService.getAllPublishedCourses(1, 6);
      return result.courses;
    }
  }

  // Course by ID method
  async getCourseById(courseId: string): Promise<Course | null> {
    try {
      const sanityCourse = await sanityService.getCourseById(courseId);

      if (sanityCourse) {
        return this.transformSanityCourse(sanityCourse);
      }

      // If not found in Sanity, try database
      const dbCourse = await this.dbService.getCourseById(courseId);

      return dbCourse;
    } catch (error) {
      console.error(
        "Error fetching course by ID from Sanity, falling back to database:",
        error
      );
      return await this.dbService.getCourseById(courseId);
    }
  }

  // Video methods
  async getVideoById(videoId: string): Promise<Video | null> {
    try {
      // First try to get from Sanity
      const sanityVideo = await sanityService.getVideoById(videoId);
      if (sanityVideo) {
        // Ensure video exists in database for foreign key constraints
        await this.ensureVideoInDatabase(sanityVideo.id, sanityVideo);

        return this.transformSanityVideo(sanityVideo);
      }

      // Fallback to database
      const dbVideo = await this.dbService.getVideoById(videoId);

      return dbVideo;
    } catch (error) {
      console.error(
        "Error fetching video from Sanity, falling back to database:",
        error
      );
      return await this.dbService.getVideoById(videoId);
    }
  }

  // Helper method to ensure video exists in database for foreign key constraints
  private async ensureVideoInDatabase(videoId: string, sanityVideo?: any) {
    try {
      const synced = await contentSyncService.ensureContentExists(
        undefined,
        videoId
      );
      if (!synced) {
        throw new Error(`Failed to sync video ${videoId} to database`);
      }
      return await this.dbService.getVideoById(videoId);
    } catch (error) {
      console.error("Error ensuring video in database:", error);
      throw error;
    }
  }

  // Method to sync all videos for a course to database
  async syncCourseVideosToDatabase(courseId: string): Promise<void> {
    try {
      await contentSyncService.syncCourseVideos(courseId);
    } catch (error) {
      console.error("Error syncing course videos to database:", error);
      throw error;
    }
  }

  // User-specific methods - Always use database
  async hasUserAccess(userId: string, courseId: string): Promise<boolean> {
    return await this.dbService.hasUserAccess(userId, courseId);
  }

  async getCourseProgress(userId: string, courseId: string) {
    return await this.dbService.getCourseProgress(userId, courseId);
  }

  // Progress tracking methods - Always use database
  async updateProgress(progressData: any) {
    try {
      // Validate user exists in database first
      if (progressData.userId) {
        await this.ensureUserExists(progressData.userId);
      }

      // Ensure course exists in database before updating progress
      if (progressData.courseId) {
        await this.ensureCourseInDatabase(progressData.courseId);
      }

      // Ensure video exists in database before updating progress
      if (progressData.videoId) {
        await this.ensureVideoInDatabase(progressData.videoId);
      }

      // Check if method exists in the database service
      if (
        "updateProgress" in this.dbService &&
        typeof this.dbService.updateProgress === "function"
      ) {
        return await (this.dbService as any).updateProgress(progressData);
      }
      console.warn("updateProgress method not found in CourseService");
      return null;
    } catch (error) {
      console.error("Error updating progress:", error);
      throw error;
    }
  }

  // Helper method to ensure user exists in database
  private async ensureUserExists(userId: string) {
    try {
      const { db } = await import("@/db");
      const { users } = await import("@/db/schema");
      const { eq } = await import("drizzle-orm");

      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!existingUser) {
        console.error(
          `User ${userId} not found in database during progress update`
        );
        throw new Error(`User session is invalid. Please log in again.`);
      }

      return existingUser;
    } catch (error) {
      console.error("Error checking if user exists:", error);
      throw error;
    }
  }

  async getEnhancedCourseProgress(userId: string, courseId: string) {
    // Check if method exists in the database service
    if (
      "getEnhancedCourseProgress" in this.dbService &&
      typeof this.dbService.getEnhancedCourseProgress === "function"
    ) {
      return await this.dbService.getEnhancedCourseProgress(userId, courseId);
    }
    console.warn("getEnhancedCourseProgress method not found in CourseService");
    return null;
  }

  // Subscription methods - Always use database
  async createSubscription(subscriptionData: any) {
    try {
      // First, ensure the course exists in the database
      await this.ensureCourseInDatabase(subscriptionData.courseId);

      // Sync all videos for this course to ensure they're in database
      // This is important for progress tracking and video access
      await this.syncCourseVideosToDatabase(subscriptionData.courseId);

      // Check if method exists in the database service
      if (
        "createSubscription" in this.dbService &&
        typeof this.dbService.createSubscription === "function"
      ) {
        const result = await this.dbService.createSubscription(
          subscriptionData
        );
        return result;
      }
      console.warn("createSubscription method not found in CourseService");
      return null;
    } catch (error) {
      console.error("Error creating subscription:", error);
      throw error;
    }
  }

  // Helper method to ensure course exists in database for foreign key constraints
  private async ensureCourseInDatabase(courseId: string) {
    try {
      const synced = await contentSyncService.ensureContentExists(courseId);
      if (!synced) {
        throw new Error(`Failed to sync course ${courseId} to database`);
      }
      return await this.dbService.getCourseById(courseId);
    } catch (error) {
      console.error("Error ensuring course in database:", error);
      throw error;
    }
  }

  // Authorize.net-related methods - Always use database
  async getSubscriptionsByAuthorizeNetCustomerId(customerProfileId: string) {
    if (
      "getSubscriptionsByAuthorizeNetCustomerId" in this.dbService &&
      typeof this.dbService.getSubscriptionsByAuthorizeNetCustomerId === "function"
    ) {
      return await this.dbService.getSubscriptionsByAuthorizeNetCustomerId(
        customerProfileId
      );
    }
    console.warn(
      "getSubscriptionsByAuthorizeNetCustomerId method not found in CourseService"
    );
    return [];
  }

  async updateSubscription(subscriptionId: string, updateData: any) {
    if (
      "updateSubscription" in this.dbService &&
      typeof this.dbService.updateSubscription === "function"
    ) {
      return await this.dbService.updateSubscription(
        subscriptionId,
        updateData
      );
    }
    console.warn("updateSubscription method not found in CourseService");
    return null;
  }

  async createPaymentTransaction(paymentData: any) {
    try {
      if (
        "createPaymentTransaction" in this.dbService &&
        typeof this.dbService.createPaymentTransaction === "function"
      ) {
        return await this.dbService.createPaymentTransaction(paymentData);
      }
      console.warn("createPaymentTransaction method not found in CourseService");
      return null;
    } catch (error) {
      console.error("Error creating payment transaction:", error);
      throw error;
    }
  }

  async getPaymentByTransactionId(transactionId: string) {
    if (
      "getPaymentByTransactionId" in this.dbService &&
      typeof this.dbService.getPaymentByTransactionId === "function"
    ) {
      return await this.dbService.getPaymentByTransactionId(transactionId);
    }
    console.warn("getPaymentByTransactionId method not found in CourseService");
    return null;
  }

  async getUserPaymentTransactions(userId: string, limit?: number) {
    if (
      "getUserPaymentTransactions" in this.dbService &&
      typeof this.dbService.getUserPaymentTransactions === "function"
    ) {
      return await this.dbService.getUserPaymentTransactions(userId, limit);
    }
    console.warn("getUserPaymentTransactions method not found in CourseService");
    return [];
  }

  async updatePaymentTransaction(paymentId: string, updateData: any) {
    if (
      "updatePaymentTransaction" in this.dbService &&
      typeof this.dbService.updatePaymentTransaction === "function"
    ) {
      return await this.dbService.updatePaymentTransaction(
        paymentId,
        updateData
      );
    }
    console.warn("updatePaymentTransaction method not found in CourseService");
    return null;
  }

  async getPaymentTransactionById(paymentId: string) {
    if (
      "getPaymentTransactionById" in this.dbService &&
      typeof this.dbService.getPaymentTransactionById === "function"
    ) {
      return await this.dbService.getPaymentTransactionById(paymentId);
    }
    console.warn("getPaymentTransactionById method not found in CourseService");
    return null;
  }

  async getPaymentTransactionsBySubscriptionId(subscriptionId: string) {
    if (
      "getPaymentTransactionsBySubscriptionId" in this.dbService &&
      typeof this.dbService.getPaymentTransactionsBySubscriptionId === "function"
    ) {
      return await this.dbService.getPaymentTransactionsBySubscriptionId(subscriptionId);
    }
    console.warn("getPaymentTransactionsBySubscriptionId method not found in CourseService");
    return [];
  }

  // Note: Course-specific payment tracking is now handled via subscription relationships



  async getUserSubscriptions(userId: string) {
    if (
      "getUserSubscriptions" in this.dbService &&
      typeof this.dbService.getUserSubscriptions === "function"
    ) {
      return await this.dbService.getUserSubscriptions(userId);
    }
    console.warn("getUserSubscriptions method not found in CourseService");
    return [];
  }

  async getUserSubscriptionsForCourse(userId: string, courseId: string) {
    if (
      "getUserSubscriptionsForCourse" in this.dbService &&
      typeof this.dbService.getUserSubscriptionsForCourse === "function"
    ) {
      return await this.dbService.getUserSubscriptionsForCourse(
        userId,
        courseId
      );
    }
    console.warn(
      "getUserSubscriptionsForCourse method not found in CourseService"
    );
    return [];
  }

  async getUserVideoProgress(userId: string, videoId: string) {
    try {
      // Ensure video exists in database before getting progress
      await this.ensureVideoInDatabase(videoId);

      if (
        "getUserVideoProgress" in this.dbService &&
        typeof this.dbService.getUserVideoProgress === "function"
      ) {
        return await this.dbService.getUserVideoProgress(userId, videoId);
      }
      console.warn("getUserVideoProgress method not found in CourseService");
      return null;
    } catch (error) {
      console.error("Error getting user video progress:", error);
      return null;
    }
  }

  // Progress methods - Always use database
  async getDetailedProgress(userId: string, courseId: string) {
    try {
      // Check if method exists before calling
      if (
        "getDetailedProgress" in this.dbService &&
        typeof this.dbService.getDetailedProgress === "function"
      ) {
        return await this.dbService.getDetailedProgress(userId, courseId);
      }
      return null;
    } catch (error) {
      console.error("Error getting detailed progress:", error);
      return null;
    }
  }

  async getProgressSummary(userId: string, courseId: string) {
    try {
      // Check if method exists before calling
      if (
        "getProgressSummary" in this.dbService &&
        typeof this.dbService.getProgressSummary === "function"
      ) {
        return await this.dbService.getProgressSummary(userId, courseId);
      }
      return null;
    } catch (error) {
      console.error("Error getting progress summary:", error);
      return null;
    }
  }

  // Migration helper - sync Sanity content to database if needed
  async syncSanityToDatabase(): Promise<void> {
    try {
      const result = await contentSyncService.syncAllContent();
      console.log(
        `Sync completed: ${result.courses} courses, ${result.videos} videos`
      );
    } catch (error) {
      console.error("Error during sync:", error);
    }
  }

  async alreadyProcessed(eventId: string): Promise<boolean> {
    return await this.dbService.alreadyProcessed(eventId);
  }
  async markProcessed(eventId: string, type: string) {
    return await this.dbService.markProcessed(eventId, type);
  }

  // Authorize.net webhook event management
  async getAuthorizeNetWebhookEvent(eventId: string) {
    if (
      "getAuthorizeNetWebhookEvent" in this.dbService &&
      typeof this.dbService.getAuthorizeNetWebhookEvent === "function"
    ) {
      return await this.dbService.getAuthorizeNetWebhookEvent(eventId);
    }
    return null;
  }

  async createAuthorizeNetWebhookEvent(eventData: any) {
    if (
      "createAuthorizeNetWebhookEvent" in this.dbService &&
      typeof this.dbService.createAuthorizeNetWebhookEvent === "function"
    ) {
      return await this.dbService.createAuthorizeNetWebhookEvent(eventData);
    }
    return null;
  }

  async updateAuthorizeNetWebhookEvent(eventId: string, updateData: any) {
    if (
      "updateAuthorizeNetWebhookEvent" in this.dbService &&
      typeof this.dbService.updateAuthorizeNetWebhookEvent === "function"
    ) {
      return await this.dbService.updateAuthorizeNetWebhookEvent(eventId, updateData);
    }
    return null;
  }

  // Subscription management
  async getSubscriptionByAuthorizeNetId(authorizeNetSubId: string) {
    if (
      "getSubscriptionByAuthorizeNetId" in this.dbService &&
      typeof this.dbService.getSubscriptionByAuthorizeNetId === "function"
    ) {
      return await this.dbService.getSubscriptionByAuthorizeNetId(authorizeNetSubId);
    }
    return null;
  }

  async getSubscriptionById(subscriptionId: string) {
    if (
      "getSubscriptionById" in this.dbService &&
      typeof this.dbService.getSubscriptionById === "function"
    ) {
      return await this.dbService.getSubscriptionById(subscriptionId);
    }
    return null;
  }

  // Payment session management
  async createPaymentSession(sessionData: any) {
    if (
      "createPaymentSession" in this.dbService &&
      typeof this.dbService.createPaymentSession === "function"
    ) {
      return await this.dbService.createPaymentSession(sessionData);
    }
    return null;
  }

  async getPaymentSessionsByCustomer(customerProfileId: string) {
    if (
      "getPaymentSessionsByCustomer" in this.dbService &&
      typeof this.dbService.getPaymentSessionsByCustomer === "function"
    ) {
      return await this.dbService.getPaymentSessionsByCustomer(
        customerProfileId
      );
    }
    return [];
  }

  async getRecentPaymentSessionsByCustomer(
    customerProfileId: string,
    since: Date
  ) {
    if (
      "getRecentPaymentSessionsByCustomer" in this.dbService &&
      typeof this.dbService.getRecentPaymentSessionsByCustomer === "function"
    ) {
      return await this.dbService.getRecentPaymentSessionsByCustomer(
        customerProfileId,
        since
      );
    }
    return [];
  }

  // User subscription management
  async deactivateUserSubscriptions(userId: string) {
    if (
      "deactivateUserSubscriptions" in this.dbService &&
      typeof this.dbService.deactivateUserSubscriptions === "function"
    ) {
      return await this.dbService.deactivateUserSubscriptions(userId);
    }
    return null;
  }

  // Webhook cleanup
  async cleanupOldWebhookEvents(daysOld: number = 5) {
    if (
      "cleanupOldWebhookEvents" in this.dbService &&
      typeof this.dbService.cleanupOldWebhookEvents === "function"
    ) {
      return await this.dbService.cleanupOldWebhookEvents(daysOld);
    }
    return false;
  }
}

// Export singleton instance
export const hybridCourseService = new HybridCourseService();
