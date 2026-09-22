import { sanityService } from "@/lib/sanity/service";
import { hybridCourseService } from "@/lib/services/hybrid-course.service";
import { enhancedProgressService } from "@/lib/services/enhanced-progress.service";
import { CourseVideoAccess, VideoAccessInfo } from "@/types/video";

/**
 * Simple Video Unlock Service
 * Much simpler approach - unlock rules are directly on videos
 */
export class VideoUnlockService {
  /**
   * Check if a video is accessible to a user
   */
  async checkVideoAccess(
    userId: string,
    videoId: string
  ): Promise<VideoAccessInfo | null> {
    try {
      console.log(
        `[VideoUnlock] Checking access for user ${userId}, video ${videoId}`
      );

      // Get video
      const video = await sanityService.getVideoById(videoId);

      if (!video) {
        console.log(`[VideoUnlock] Video ${videoId} not found`);
        return null;
      }

      // Check if user has course access
      const hasAccess = await hybridCourseService.hasUserAccess(
        userId,
        video.courseId
      );

      if (!hasAccess) {
        return {
          video,
          isUnlocked: false,
          canPreview: video.isFree,
          unlockReason: "No course subscription",
        };
      }

      // Get course settings
      const course = await sanityService.getCourseById(video.courseId);
      const progressiveUnlock = course?.progressiveUnlock;

      // If progressive unlock is not enabled, all videos are unlocked
      if (!progressiveUnlock?.enabled) {
        console.log(
          `[VideoUnlock] Progressive unlock disabled, video unlocked`
        );
        return {
          video,
          isUnlocked: true,
          canPreview: true,
          unlockReason: "Progressive unlock disabled",
        };
      }

      console.log(
        `[VideoUnlock] Progressive unlock is ENABLED, checking video unlock rules`
      );

      // Check video unlock settings
      const unlockSettings = video.unlockSettings;
      console.log(`[VideoUnlock] Video unlock settings:`, unlockSettings);

      if (!unlockSettings || unlockSettings.unlockType === "immediate") {
        console.log(`[VideoUnlock] Video available immediately`);
        return {
          video,
          isUnlocked: true,
          canPreview: true,
          unlockReason: "Available immediately",
        };
      }

      // Handle time-based unlock
      if (unlockSettings.unlockType === "after_days") {
        const unlockDate = await this.calculateUnlockDate(
          userId,
          video.courseId,
          unlockSettings.unlockAfterDays || 0
        );

        const now = new Date();
        const isUnlocked = now >= unlockDate;

        return {
          video,
          isUnlocked,
          canPreview:
            isUnlocked || progressiveUnlock.allowPreview || video.isFree,
          unlockReason: isUnlocked
            ? `Unlocked after ${unlockSettings.unlockAfterDays} days`
            : `Unlocks on ${unlockDate.toLocaleDateString()}`,
          unlockDate,
        };
      }

      // Handle completion-based unlock
      if (unlockSettings.unlockType === "after_completion") {
        console.log(
          `[VideoUnlock] Checking completion-based unlock for video order ${video.order}`
        );
        const isUnlocked = await this.checkPreviousVideoCompletion(
          userId,
          video.courseId,
          video.order
        );
        console.log(`[VideoUnlock] Completion check result: ${isUnlocked}`);

        return {
          video,
          isUnlocked,
          canPreview:
            isUnlocked || progressiveUnlock.allowPreview || video.isFree,
          unlockReason: isUnlocked
            ? "Previous video completed"
            : "Complete the previous video first",
        };
      }

      // Default to locked
      return {
        video,
        isUnlocked: false,
        canPreview: progressiveUnlock.allowPreview || video.isFree,
        unlockReason: "Video is locked",
      };
    } catch (error) {
      console.error("Error checking video access:", error);
      return null;
    }
  }

  /**
   * Get all videos for a course with access information
   */
  async getCourseVideosWithAccess(
    userId: string,
    courseId: string
  ): Promise<CourseVideoAccess | null> {
    try {
      // Check if user has course access
      const hasAccess = await hybridCourseService.hasUserAccess(
        userId,
        courseId
      );
      if (!hasAccess) {
        return null;
      }

      // Get course and videos
      const course = await sanityService.getCourseById(courseId);
      const videos = await sanityService.getVideosByCourse(courseId);

      if (!course) return null;

      // Check access for each video
      const videosWithAccess: VideoAccessInfo[] = [];

      for (const video of videos) {
        const accessInfo = await this.checkVideoAccess(userId, video.id);
        if (accessInfo) {
          videosWithAccess.push(accessInfo);
        }
      }

      // Sort by order
      videosWithAccess.sort((a, b) => a.video.order - b.video.order);

      return {
        course: {
          id: course.id,
          title: course.title,
          progressiveUnlock: course.progressiveUnlock,
        },
        videos: videosWithAccess,
      };
    } catch (error) {
      console.error("Error getting course videos with access:", error);
      return null;
    }
  }

  /**
   * Calculate when a video should unlock based on subscription date
   */
  private async calculateUnlockDate(
    userId: string,
    courseId: string,
    daysAfter: number
  ): Promise<Date> {
    try {
      // Get user's subscription for this course
      const subscriptions = await hybridCourseService.getUserSubscriptions(
        userId
      );
      const courseSubscription = subscriptions.find(
        (sub: any) => sub.courseId === courseId && sub.status === "active"
      );

      if (courseSubscription?.startDate) {
        const startDate = new Date(courseSubscription.startDate);
        const unlockDate = new Date(startDate);
        unlockDate.setDate(unlockDate.getDate() + daysAfter);
        return unlockDate;
      }

      // Fallback to now if no subscription found
      return new Date();
    } catch (error) {
      console.error("Error calculating unlock date:", error);
      return new Date();
    }
  }

  /**
   * Check if previous videos in the course are completed
   */
  private async checkPreviousVideoCompletion(
    userId: string,
    courseId: string,
    currentVideoOrder: number
  ): Promise<boolean> {
    try {
      console.log(
        `[VideoUnlock] Checking previous completion for video order ${currentVideoOrder}`
      );

      // Get all videos for the course to determine if this is actually the first video
      const videos = await sanityService.getVideosByCourse(courseId);
      console.log(`[VideoUnlock] Found ${videos.length} videos in course`);

      // Sort videos by order to find the actual first video
      const sortedVideos = videos.sort((a, b) => a.order - b.order);
      const firstVideo = sortedVideos[0];

      console.log(
        `[VideoUnlock] First video order: ${firstVideo?.order}, current video order: ${currentVideoOrder}`
      );

      // If this is actually the first video in the sequence, it's unlocked
      if (firstVideo && currentVideoOrder === firstVideo.order) {
        console.log(
          `[VideoUnlock] This IS the first video (order ${currentVideoOrder}), unlocked`
        );
        return true;
      }

      console.log(
        `[VideoUnlock] This is NOT the first video, checking previous video completion`
      );

      // Find the previous video from the already sorted videos
      const previousVideos = sortedVideos
        .filter((v) => v.order < currentVideoOrder)
        .sort((a, b) => b.order - a.order); // Sort descending to get the latest previous video

      console.log(
        `[VideoUnlock] Previous videos:`,
        previousVideos.map((v) => ({ order: v.order, title: v.title }))
      );

      if (previousVideos.length === 0) {
        console.log(`[VideoUnlock] No previous videos found, unlocked`);
        return true; // No previous videos
      }

      const previousVideo = previousVideos[0];
      console.log(`[VideoUnlock] Checking completion of previous video:`, {
        id: previousVideo.id,
        title: previousVideo.title,
      });

      // Check if the previous video is completed using enhanced progress service
      const progress = await enhancedProgressService.getUserVideoProgress(
        userId,
        previousVideo.id
      );

      const isCompleted = progress?.isCompleted || false;
      console.log(`[VideoUnlock] Previous video completed: ${isCompleted}`);
      return isCompleted;
    } catch (error) {
      console.error("Error checking previous video completion:", error);
      return false; // Default to locked on error for security
    }
  }
}

// Export singleton instance
export const videoUnlockService = new VideoUnlockService();
