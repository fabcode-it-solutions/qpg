import { db } from "@/db";
import {
  userProgress,
  videos,
  learningMilestones,
  courseEnrollments,
} from "@/db/schema/courses";
import { MilestoneData, ProgressAnalytics, VideoProgressUpdate } from "@/types";
import { eq, and, sql, asc } from "drizzle-orm";

export class EnhancedProgressService {
  /**
   * Track video progress with immediate processing
   */
  async trackProgress(update: VideoProgressUpdate): Promise<void> {
    // Process immediately for real-time tracking
    await this.processSingleUpdate(update);
  }

  /**
   * Get comprehensive user progress for a video
   */
  async getUserVideoProgress(userId: string, videoId: string) {
    const [progress] = await db
      .select()
      .from(userProgress)
      .where(
        and(eq(userProgress.userId, userId), eq(userProgress.videoId, videoId))
      )
      .limit(1);

    return progress || null;
  }

  /**
   * Get detailed course progress with analytics and proper duration handling
   */
  async getCourseProgress(userId: string, courseId: string) {
    // Get all videos in the course from Sanity/database
    let courseVideos;

    try {
      // Try to get videos with duration information from Sanity first
      const { hybridCourseService } = await import("./hybrid-course.service");
      const courseWithVideos = await hybridCourseService.getCourseWithVideos(
        courseId
      );

      if (courseWithVideos?.videos) {
        courseVideos = courseWithVideos.videos.map((video) => ({
          id: video.id,
          order: video.order,
          title: video.title,
          duration: video.duration || 0, // Include duration from Sanity
        }));
      } else {
        throw new Error("No videos found via hybrid service");
      }
    } catch (error) {
      console.warn(
        "Failed to get videos from hybrid service, falling back to database:",
        error
      );
      // Fallback to database query - database videos table doesn't have duration
      courseVideos = await db
        .select({
          id: videos.id,
          order: videos.order,
          title: videos.title,
        })
        .from(videos)
        .where(and(eq(videos.courseId, courseId), eq(videos.isPublished, true)))
        .orderBy(asc(videos.order));

      // Add default duration for database fallback since Sanity is unavailable
      courseVideos = courseVideos.map((video) => ({
        ...video,
        duration: 0, // Will be estimated later based on user progress or set to default
      }));
    }

    // Get progress for all videos
    const progressData = await db
      .select()
      .from(userProgress)
      .where(
        and(
          eq(userProgress.userId, userId),
          eq(userProgress.courseId, courseId)
        )
      );

    const progressMap = new Map(progressData.map((p) => [p.videoId, p]));

    // Enhanced video progress with duration information
    const videoProgress = courseVideos.map((video) => {
      const userProgressData = progressMap.get(video.id);

      // Calculate time-weighted progress for better accuracy
      const videoDuration = video.duration || 900; // Default to 15 minutes if not available
      const watchedTime = userProgressData?.watchedDuration || 0;
      const progressPercentage =
        videoDuration > 0
          ? Math.min((watchedTime / videoDuration) * 100, 100)
          : 0;

      return {
        ...video,
        progress: userProgressData || {
          watchedDuration: 0,
          totalDuration: videoDuration,
          progressPercentage: Math.round(progressPercentage),
          isCompleted: false,
          watchCount: 0,
          lastWatchedAt: null,
        },
      };
    });

    // Calculate enhanced overall progress
    const completedVideos = videoProgress.filter(
      (v) => v.progress.isCompleted
    ).length;
    const totalVideos = videoProgress.length;

    // Time-weighted progress calculation for more accurate representation
    const totalCourseDuration = videoProgress.reduce(
      (sum, v) => sum + (v.duration || 900),
      0
    );
    const totalWatchedDuration = videoProgress.reduce(
      (sum, v) => sum + (v.progress.watchedDuration || 0),
      0
    );

    const timeWeightedProgress =
      totalCourseDuration > 0
        ? (totalWatchedDuration / totalCourseDuration) * 100
        : 0;

    // Use the higher of completion-based or time-weighted progress
    const completionBasedProgress =
      totalVideos > 0 ? (completedVideos / totalVideos) * 100 : 0;
    const overallProgress = Math.max(
      completionBasedProgress,
      timeWeightedProgress
    );

    console.log(
      `📊 Course ${courseId} progress: ${completedVideos}/${totalVideos} videos completed, ${Math.round(
        timeWeightedProgress
      )}% time-weighted, ${Math.round(
        completionBasedProgress
      )}% completion-based`
    );

    return {
      courseId,
      totalVideos,
      completedVideos,
      overallProgress: Math.min(Math.round(overallProgress), 100), // Cap at 100%
      timeWeightedProgress: Math.round(timeWeightedProgress),
      totalCourseDuration,
      totalWatchedDuration: Math.round(totalWatchedDuration),
      videos: videoProgress,
      lastWatchedAt: progressData.reduce((latest, p) => {
        return !latest || (p.lastWatchedAt && p.lastWatchedAt > latest)
          ? p.lastWatchedAt
          : latest;
      }, null as Date | null),
      estimatedTimeRemaining: Math.max(
        0,
        totalCourseDuration - totalWatchedDuration
      ),
    };
  }

  /**
   * Get user's learning analytics
   */
  async getUserAnalytics(
    userId: string,
    timeRange: number = 30
  ): Promise<ProgressAnalytics> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - timeRange);

    // Get progress data within time range
    const progressData = await db
      .select()
      .from(userProgress)
      .where(
        and(
          eq(userProgress.userId, userId),
          sql`${userProgress.lastWatchedAt} >= ${cutoffDate}`
        )
      );

    // Calculate analytics
    const totalVideosWatched = progressData.filter(
      (p) => p.watchedDuration > 0
    ).length;
    const totalWatchTime = progressData.reduce(
      (sum, p) => sum + p.watchedDuration,
      0
    );
    const completedVideos = progressData.filter((p) => p.isCompleted).length;
    const averageSessionDuration =
      totalVideosWatched > 0 ? totalWatchTime / totalVideosWatched : 0;
    const completionRate =
      totalVideosWatched > 0 ? (completedVideos / totalVideosWatched) * 100 : 0;

    // Engagement score calculation (0-100)
    const watchTimeScore =
      Math.min(totalWatchTime / (timeRange * 3600), 1) * 40; // Max 40 points
    const completionScore = completionRate * 0.4; // Max 40 points
    const consistencyScore =
      totalVideosWatched > 0
        ? Math.min(totalVideosWatched / timeRange, 1) * 20 // Max 20 points
        : 0;
    const engagementScore = Math.round(
      watchTimeScore + completionScore + consistencyScore
    );

    return {
      totalVideosWatched,
      totalWatchTime,
      averageSessionDuration: Math.round(averageSessionDuration),
      completionRate: Math.round(completionRate * 100) / 100,
      engagementScore,
      favoriteTimeOfDay: this.calculateFavoriteTimeOfDay(progressData),
      weeklyProgress: await this.calculateWeeklyProgress(userId, timeRange),
    };
  }

  /**
   * Check and award milestones
   */
  async checkMilestones(
    userId: string,
    videoId: string,
    progressPercentage: number
  ): Promise<MilestoneData[]> {
    const milestones: MilestoneData[] = [];
    const thresholds = [25, 50, 75, 100];

    for (const threshold of thresholds) {
      if (progressPercentage >= threshold) {
        const milestoneType =
          threshold === 100 ? "video_complete" : `video_${threshold}`;

        // Check if milestone already exists
        const [existingMilestone] = await db
          .select()
          .from(learningMilestones)
          .where(
            and(
              eq(learningMilestones.userId, userId),
              eq(learningMilestones.videoId, videoId),
              eq(learningMilestones.type, milestoneType)
            )
          )
          .limit(1);

        if (!existingMilestone) {
          const milestone: MilestoneData = {
            type: milestoneType,
            percentage: threshold,
            videoId,
            metadata: {
              achievedAt: new Date(),
              progressPercentage,
            },
          };

          milestones.push(milestone);

          // Store milestone in database
          await db.insert(learningMilestones).values({
            userId,
            videoId,
            type: milestoneType,
            percentage: threshold,
            metadata: JSON.stringify(milestone.metadata),
          });
        }
      }
    }

    // Check for course completion milestone
    if (progressPercentage >= 100) {
      await this.checkCourseCompletion(userId, videoId);
    }

    return milestones;
  }

  /**
   * Update course enrollment progress
   */
  async updateCourseEnrollment(
    userId: string,
    courseId: string
  ): Promise<void> {
    const courseProgress = await this.getCourseProgress(userId, courseId);

    // Update or create course enrollment
    await db
      .insert(courseEnrollments)
      .values({
        userId,
        courseId,
        videosCompleted: courseProgress.completedVideos,
        overallProgress: courseProgress.overallProgress,
        isCompleted: courseProgress.overallProgress >= 100,
        completedAt: courseProgress.overallProgress >= 100 ? new Date() : null,
        lastAccessedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [courseEnrollments.userId, courseEnrollments.courseId],
        set: {
          videosCompleted: courseProgress.completedVideos,
          overallProgress: courseProgress.overallProgress,
          isCompleted: courseProgress.overallProgress >= 100,
          completedAt:
            courseProgress.overallProgress >= 100 ? new Date() : undefined,
          lastAccessedAt: new Date(),
          updatedAt: new Date(),
        },
      });
  }

  /**
   * Process single progress update immediately with professional duration handling and re-watch support
   */
  private async processSingleUpdate(
    update: VideoProgressUpdate
  ): Promise<void> {
    try {
      // Get existing progress to check for re-watch scenario
      const existingProgress = await this.getUserVideoProgress(update.userId, update.videoId);
      // Ensure we have valid duration data
      let effectiveTotalDuration = update.totalDuration;

      // If duration is invalid, try to get from video metadata
      if (!effectiveTotalDuration || effectiveTotalDuration <= 0) {
        try {
          // Import here to avoid circular dependency
          const { hybridCourseService } = await import(
            "./hybrid-course.service"
          );
          const videoMetadata = await hybridCourseService.getVideoById(
            update.videoId
          );

          if (videoMetadata?.duration && videoMetadata.duration > 0) {
            effectiveTotalDuration = videoMetadata.duration;
            console.log(
              `📊 Updated totalDuration from metadata: ${effectiveTotalDuration}s for video ${update.videoId}`
            );
          } else {
            // Intelligent fallback based on watched duration
            effectiveTotalDuration =
              update.watchedDuration > 0
                ? Math.max(update.watchedDuration * 1.2, 900) // 20% buffer or 15min minimum
                : 900; // 15 minutes default
            console.log(
              `🔧 Using intelligent fallback duration: ${effectiveTotalDuration}s`
            );
          }
        } catch (error) {
          console.error("Error fetching video metadata for duration:", error);
          effectiveTotalDuration = Math.max(update.totalDuration || 900, 900);
        }
      }

      // Professional re-watch detection: If user seeks to beginning of completed video, allow re-tracking
      let finalWatchedDuration = update.watchedDuration;
      let isRewatch = false;
      
      if (existingProgress?.isCompleted) {
        // Check if user has significantly rewound from completion (more than 30 seconds back from end)
        const rewindThreshold = Math.max(30, effectiveTotalDuration * 0.05); // 30s or 5% of video
        const isSignificantRewind = update.watchedDuration < (existingProgress.watchedDuration - rewindThreshold);
        
        if (isSignificantRewind) {
          isRewatch = true;
          finalWatchedDuration = update.watchedDuration; // Use current position for re-watch
          console.log(`🔄 Re-watch detected for video ${update.videoId}: ${update.watchedDuration}s (was ${existingProgress.watchedDuration}s, threshold: ${rewindThreshold}s)`);
        } else {
          // Still near the end, maintain completion
          finalWatchedDuration = existingProgress.watchedDuration;
        }
      } else if (existingProgress) {
        // Normal progression: use the higher of current or existing watched duration
        finalWatchedDuration = Math.max(update.watchedDuration, existingProgress.watchedDuration);
      }

      // Professional progress calculation with safeguards
      const progressPercentage =
        effectiveTotalDuration > 0
          ? Math.min(
              Math.round(
                (finalWatchedDuration / effectiveTotalDuration) * 100
              ),
              100
            )
          : 0;

      // Smart completion detection - consider video completed at 90% or if watched duration exceeds 90% of total
      // For re-watch scenarios, recalculate completion based on current progress
      const isCompleted = isRewatch 
        ? (progressPercentage >= 90 || (effectiveTotalDuration > 0 && finalWatchedDuration >= effectiveTotalDuration * 0.9))
        : (progressPercentage >= 90 || (effectiveTotalDuration > 0 && finalWatchedDuration >= effectiveTotalDuration * 0.9));

      // Ensure all numeric values are integers for database compatibility
      const intWatchedDuration = Math.floor(finalWatchedDuration);
      const intTotalDuration = Math.floor(effectiveTotalDuration);

      // Upsert progress record with properly typed integer values
      await db
        .insert(userProgress)
        .values({
          userId: update.userId,
          videoId: update.videoId,
          courseId: update.courseId,
          watchedDuration: intWatchedDuration,
          totalDuration: intTotalDuration,
          progressPercentage,
          isCompleted,
          completedAt: isCompleted ? new Date() : null,
          lastWatchedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [userProgress.userId, userProgress.videoId],
          set: {
            watchedDuration: intWatchedDuration,
            totalDuration: intTotalDuration,
            progressPercentage,
            isCompleted,
            completedAt: isCompleted ? new Date() : undefined,
            watchCount: sql`${userProgress.watchCount} + 1`,
            lastWatchedAt: new Date(),
            updatedAt: new Date(),
          },
        });

      // Log successful progress update for monitoring
      console.log(
        `✅ Progress updated for video ${update.videoId}: ${finalWatchedDuration}/${effectiveTotalDuration}s (${progressPercentage}%) - Completed: ${isCompleted}${isRewatch ? ' [RE-WATCH]' : ''}${existingProgress?.isCompleted ? ' [WAS-COMPLETED]' : ''}`
      );

      // Check for milestones
      await this.checkMilestones(
        update.userId,
        update.videoId,
        progressPercentage
      );

      // Update course enrollment
      await this.updateCourseEnrollment(update.userId, update.courseId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check and award course completion milestone
   */
  private async checkCourseCompletion(
    userId: string,
    completedVideoId: string
  ): Promise<void> {
    const [video] = await db
      .select({ courseId: videos.courseId })
      .from(videos)
      .where(eq(videos.id, completedVideoId))
      .limit(1);

    if (!video) return;

    const courseProgress = await this.getCourseProgress(userId, video.courseId);

    if (courseProgress.overallProgress >= 100) {
      // Check if course completion milestone already exists
      const [existingMilestone] = await db
        .select()
        .from(learningMilestones)
        .where(
          and(
            eq(learningMilestones.userId, userId),
            eq(learningMilestones.courseId, video.courseId),
            eq(learningMilestones.type, "course_complete")
          )
        )
        .limit(1);

      if (!existingMilestone) {
        await db.insert(learningMilestones).values({
          userId,
          courseId: video.courseId,
          type: "course_complete",
          percentage: 100,
          metadata: JSON.stringify({
            achievedAt: new Date(),
            totalVideos: courseProgress.totalVideos,
            completedVideos: courseProgress.completedVideos,
          }),
        });
      }
    }
  }

  /**
   * Calculate favorite time of day for watching videos
   */
  private calculateFavoriteTimeOfDay(progressData: any[]): string {
    const hourCounts = new Array(24).fill(0);

    progressData.forEach((p) => {
      if (p.lastWatchedAt) {
        const hour = new Date(p.lastWatchedAt).getHours();
        hourCounts[hour]++;
      }
    });

    const maxIndex = hourCounts.indexOf(Math.max(...hourCounts));

    if (maxIndex < 6) return "Early Morning";
    if (maxIndex < 12) return "Morning";
    if (maxIndex < 18) return "Afternoon";
    if (maxIndex < 22) return "Evening";
    return "Night";
  }

  /**
   * Get enhanced course progress summary compatible with old API
   */
  async getEnhancedCourseProgress(
    userId: string,
    courseId: string
  ) {
    const rawProgress = await this.getCourseProgress(userId, courseId);
    
    if (!rawProgress) return null;

    // Get course title from hybrid service
    let courseTitle = "Unknown Course";
    try {
      const { hybridCourseService } = await import("./hybrid-course.service");
      const course = await hybridCourseService.getCourseById(courseId);
      courseTitle = course?.title || courseTitle;
    } catch (error) {
      console.warn("Failed to get course title:", error);
    }

    // Transform to match expected API interface
    return {
      courseId: rawProgress.courseId,
      courseTitle,
      totalVideos: rawProgress.totalVideos,
      completedVideos: rawProgress.completedVideos,
      progressPercentage: rawProgress.overallProgress,
      totalDuration: rawProgress.totalCourseDuration,
      watchedDuration: rawProgress.totalWatchedDuration,
      lastActivityAt: rawProgress.lastWatchedAt,
      estimatedTimeRemaining: rawProgress.estimatedTimeRemaining,
      videosProgress: rawProgress.videos.map((video: any) => ({
        videoId: video.videoId,
        title: video.title,
        duration: video.duration,
        watchedDuration: video.watchedDuration,
        progressPercentage: video.progressPercentage,
        isCompleted: video.isCompleted,
        lastWatchedAt: video.lastWatchedAt,
      })),
    };
  }

  /**
   * Get user's overall progress across all courses
   */
  async getUserProgressOverview(userId: string) {
    try {
      // Get all user subscriptions to count total courses
      const { hybridCourseService } = await import("./hybrid-course.service");
      const subscriptions = await hybridCourseService.getUserSubscriptions(userId);
      
      // Filter active subscriptions only
      const activeSubscriptions = subscriptions.filter((sub: any) => 
        sub.status === 'active' || sub.status === 'trialing'
      );
      
      const subscribedCourseIds = activeSubscriptions.map((sub: any) => sub.courseId);

      // Get all user progress data
      const allProgress = await db
        .select()
        .from(userProgress)
        .where(eq(userProgress.userId, userId));

      // Group by course
      const courseMap = new Map<string, any[]>();
      for (const progress of allProgress) {
        if (!courseMap.has(progress.courseId)) {
          courseMap.set(progress.courseId, []);
        }
        courseMap.get(progress.courseId)!.push(progress);
      }

      // Calculate course progress for each subscribed course
      const coursesProgress = [];
      let totalWatchTime = 0;
      let completedCourses = 0;
      let inProgressCourses = 0;

      for (const courseId of subscribedCourseIds) {
        const courseProgress = await this.getEnhancedCourseProgress(userId, courseId);
        if (courseProgress) {
          coursesProgress.push(courseProgress);
          totalWatchTime += courseProgress.watchedDuration;
          
          if (courseProgress.progressPercentage === 100) {
            completedCourses++;
          } else if (courseProgress.progressPercentage > 0) {
            inProgressCourses++;
          }
        }
      }

      return {
        userId,
        totalCourses: subscribedCourseIds.length, // Count all active subscriptions
        completedCourses,
        inProgressCourses,
        totalWatchTime,
        coursesProgress,
      };
    } catch (error) {
      console.error("Error getting user progress overview:", error);
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

  /**
   * Calculate weekly progress data
   */
  private async calculateWeeklyProgress(
    _userId: string,
    _days: number
  ): Promise<
    Array<{ week: string; videosWatched: number; totalTime: number }>
  > {
    // Implementation would query database for weekly aggregated data
    // Simplified for now
    return [];
  }
}

// Export singleton instance
export const enhancedProgressService = new EnhancedProgressService();
