import { db } from "@/db";
import { courses, videos } from "@/db/schema/courses";
import { sanityService } from "@/lib/sanity/service";
import { eq, count } from "drizzle-orm";

/**
 * Content Sync Service
 * Ensures Sanity content has corresponding database references
 * with intelligent caching and rate limiting
 */
export class ContentSyncService {
  private syncCache = new Map<string, { timestamp: number; synced: boolean }>();
  private fullSyncInProgress = false;
  private lastFullSync = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly FULL_SYNC_INTERVAL = 30 * 60 * 1000; // 30 minutes
  /**
   * Check if content sync is needed based on cache
   */
  private isSyncNeeded(key: string): boolean {
    const cached = this.syncCache.get(key);
    if (!cached) return true;
    return Date.now() - cached.timestamp > this.CACHE_TTL;
  }

  /**
   * Mark content as synced in cache
   */
  private markSynced(key: string, synced: boolean): void {
    this.syncCache.set(key, { timestamp: Date.now(), synced });
  }

  /**
   * Sync a single course from Sanity to database
   */
  async syncCourse(courseId: string): Promise<boolean> {
    try {
      const cacheKey = `course:${courseId}`;
      
      // Check cache first
      if (!this.isSyncNeeded(cacheKey)) {
        return this.syncCache.get(cacheKey)?.synced || false;
      }

      // Check if course already exists in database
      const [existingCourse] = await db
        .select()
        .from(courses)
        .where(eq(courses.id, courseId))
        .limit(1);

      if (existingCourse) {
        this.markSynced(cacheKey, true);
        return true;
      }

      // Get course from Sanity
      const sanityCourse = await sanityService.getCourseById(courseId);
      if (!sanityCourse) {
        this.markSynced(cacheKey, false);
        return false;
      }

      // Create minimal database record
      await db.insert(courses).values({
        id: sanityCourse.id,
        title: sanityCourse.title,
        slug: sanityCourse.slug || sanityCourse.id,
        isPublished: sanityCourse.isPublished,
      });

      this.markSynced(cacheKey, true);
      return true;
    } catch (error) {
      console.error(`Failed to sync course ${courseId}:`, error);
      return false;
    }
  }

  /**
   * Sync a single video from Sanity to database
   */
  async syncVideo(videoId: string): Promise<boolean> {
    try {
      const cacheKey = `video:${videoId}`;
      
      // Check cache first
      if (!this.isSyncNeeded(cacheKey)) {
        return this.syncCache.get(cacheKey)?.synced || false;
      }

      // Check if video already exists in database
      const [existingVideo] = await db
        .select()
        .from(videos)
        .where(eq(videos.id, videoId))
        .limit(1);

      if (existingVideo) {
        this.markSynced(cacheKey, true);
        return true;
      }

      // Get video from Sanity
      const sanityVideo = await sanityService.getVideoById(videoId);
      if (!sanityVideo) {
        this.markSynced(cacheKey, false);
        return false;
      }

      // Ensure course exists first
      await this.syncCourse(sanityVideo.courseId);

      // Create minimal database record
      await db.insert(videos).values({
        id: sanityVideo.id,
        courseId: sanityVideo.courseId,
        title: sanityVideo.title,
        slug: sanityVideo.slug || sanityVideo.id,
        order: sanityVideo.order || 0,
        isPublished: sanityVideo.isPublished,
        isFree: false, // Default value
      });

      this.markSynced(cacheKey, true);
      return true;
    } catch (error) {
      console.error(`Failed to sync video ${videoId}:`, error);
      return false;
    }
  }

  /**
   * Sync all videos for a course
   */
  async syncCourseVideos(courseId: string): Promise<boolean> {
    try {
      // Ensure course exists first
      await this.syncCourse(courseId);

      // Get course with videos from Sanity
      const courseWithVideos = await sanityService.getCourseWithVideos(courseId);
      if (!courseWithVideos?.videos) return false;

      // Sync each video
      const results = await Promise.allSettled(
        courseWithVideos.videos.map(video => this.syncVideo(video.id))
      );

      // Return true if all videos synced successfully
      return results.every(result => 
        result.status === 'fulfilled' && result.value === true
      );
    } catch (error) {
      console.error(`Failed to sync videos for course ${courseId}:`, error);
      return false;
    }
  }

  /**
   * Check if full sync is needed
   */
  private async isFullSyncNeeded(): Promise<boolean> {
    // Check if full sync is already in progress
    if (this.fullSyncInProgress) return false;
    
    // Check time-based throttling
    if (Date.now() - this.lastFullSync < this.FULL_SYNC_INTERVAL) return false;
    
    // Check if database is empty (first time)
    const [courseCount] = await db.select({ count: count() }).from(courses);
    return courseCount.count === 0;
  }

  /**
   * Sync all published courses and their videos (throttled)
   */
  async syncAllContent(): Promise<{ courses: number; videos: number }> {
    try {
      if (!(await this.isFullSyncNeeded())) {
        console.log('Full sync skipped - not needed or throttled');
        return { courses: 0, videos: 0 };
      }

      this.fullSyncInProgress = true;
      console.log('Starting full content sync...');
      
      let courseCount = 0;
      let videoCount = 0;
      let page = 1;
      const limit = 20; // Reduced for cost efficiency

      while (true) {
        const result = await sanityService.getAllCoursesPaginated(page, limit);
        if (!result.courses.length) break;

        // Process in smaller batches to avoid overwhelming Sanity
        for (const course of result.courses) {
          const courseSync = await this.syncCourse(course.id);
          if (courseSync) courseCount++;

          const videoSync = await this.syncCourseVideos(course.id);
          if (videoSync) {
            // Use cached course data to avoid extra API call
            const courseWithVideos = await sanityService.getCourseWithVideos(course.id);
            videoCount += courseWithVideos?.videos?.length || 0;
          }
        }

        if (page >= result.totalPages) break;
        page++;
        
        // Small delay between pages to be API-friendly
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      this.lastFullSync = Date.now();
      console.log(`Full sync completed: ${courseCount} courses, ${videoCount} videos`);
      return { courses: courseCount, videos: videoCount };
    } catch (error) {
      console.error('Failed to sync all content:', error);
      return { courses: 0, videos: 0 };
    } finally {
      this.fullSyncInProgress = false;
    }
  }

  /**
   * Smart initial sync - only runs on first load or when needed
   */
  async smartInitialSync(): Promise<{ courses: number; videos: number }> {
    try {
      // Check if database has any courses
      const [courseCount] = await db.select({ count: count() }).from(courses);
      
      if (courseCount.count > 0) {
        console.log('Database already has content, skipping initial sync');
        return { courses: courseCount.count, videos: 0 };
      }

      console.log('First time load detected, starting initial sync...');
      return await this.syncAllContent();
    } catch (error) {
      console.error('Smart initial sync failed:', error);
      return { courses: 0, videos: 0 };
    }
  }

  /**
   * Auto-sync content when needed (called by hybrid service)
   */
  async ensureContentExists(courseId?: string, videoId?: string): Promise<boolean> {
    try {
      if (videoId) {
        return await this.syncVideo(videoId);
      }
      
      if (courseId) {
        return await this.syncCourse(courseId);
      }

      return false;
    } catch (error) {
      console.error('Failed to ensure content exists:', error);
      return false;
    }
  }

  /**
   * Clear sync cache (for testing or manual refresh)
   */
  clearCache(): void {
    this.syncCache.clear();
    this.lastFullSync = 0;
  }
}

export const contentSyncService = new ContentSyncService();