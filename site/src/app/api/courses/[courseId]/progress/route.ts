import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { hybridCourseService } from "@/lib/services/hybrid-course.service";
import { enhancedProgressService } from "@/lib/services/enhanced-progress.service";
import { headers } from "next/headers";
import {
  validateId,
  sanitizeLogOutput,
  sanitizeString,
} from "@/lib/utils/security";

const courseService = hybridCourseService;

// Improved in-memory rate limiting with automatic cleanup
class RateLimiter {
  private rateLimitMap = new Map<
    string,
    { count: number; resetTime: number }
  >();
  private cleanupInterval: NodeJS.Timeout;

  private readonly RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
  private readonly RATE_LIMIT_MAX_REQUESTS = 30; // Max 30 requests per minute per user
  private readonly CLEANUP_INTERVAL = 5 * 60 * 1000; // Cleanup every 5 minutes

  constructor() {
    // Automatic cleanup to prevent memory leaks
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.CLEANUP_INTERVAL);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, limit] of this.rateLimitMap.entries()) {
      if (now > limit.resetTime) {
        this.rateLimitMap.delete(key);
      }
    }
  }

  checkRateLimit(userId: string, ip: string): boolean {
    const key = `${userId}-${ip}`;
    const now = Date.now();
    const userLimit = this.rateLimitMap.get(key);

    if (!userLimit || now > userLimit.resetTime) {
      this.rateLimitMap.set(key, {
        count: 1,
        resetTime: now + this.RATE_LIMIT_WINDOW,
      });
      return true;
    }

    if (userLimit.count >= this.RATE_LIMIT_MAX_REQUESTS) {
      return false;
    }

    userLimit.count++;
    return true;
  }

  // Get current stats for monitoring
  getStats(): { totalKeys: number; memoryUsage: string } {
    return {
      totalKeys: this.rateLimitMap.size,
      memoryUsage: `${Math.round((this.rateLimitMap.size * 64) / 1024)}KB`, // Rough estimate
    };
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.rateLimitMap.clear();
  }
}

// Global rate limiter instance
const rateLimiter = new RateLimiter();

// Video metadata cache to reduce database calls
const videoMetadataCache = new Map<
  string,
  { duration: number; timestamp: number }
>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Graceful shutdown
process.on("SIGINT", () => rateLimiter.destroy());
process.on("SIGTERM", () => rateLimiter.destroy());

// Milestone tracking function
async function trackMilestone(
  _userId: string,
  _courseId: string,
  _videoId: string,
  _milestone: number,
  _eventType: string
) {
  try {
    // In production, you might want to:
    // - Send to analytics service
    // - Trigger achievement notifications
    // - Update user achievements/badges
    // - Send engagement metrics to data warehouse

    return true;
  } catch (error) {
    return false;
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get client IP for rate limiting
    const headersList = await headers();
    const clientIP =
      headersList.get("x-forwarded-for") ||
      headersList.get("x-real-ip") ||
      "unknown";

    // Apply rate limiting
    if (!rateLimiter.checkRateLimit(session.user.id, clientIP)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please slow down." },
        { status: 429 }
      );
    }

    const { courseId } = await params;
    const body = await req.json();

    // Extract and sanitize values, ensuring integers for database compatibility
    const videoId = body.videoId;

    // Validate videoId format
    if (!videoId || !validateId(videoId)) {
      return NextResponse.json({ error: "Invalid video ID" }, { status: 400 });
    }
    const watchedDuration =
      typeof body.watchedDuration === "number"
        ? Math.floor(body.watchedDuration)
        : 0;
    const totalDuration =
      typeof body.totalDuration === "number"
        ? Math.floor(body.totalDuration)
        : null;
    const currentTime =
      typeof body.currentTime === "number"
        ? Math.floor(body.currentTime)
        : watchedDuration;
    const isCompleted = body.isCompleted || false;
    const milestone =
      typeof body.milestone === "number" ? body.milestone : null;
    const eventType = sanitizeString(body.eventType || "interval");
    const totalWatchTime =
      typeof body.totalWatchTime === "number"
        ? Math.floor(body.totalWatchTime)
        : 0;

    if (!videoId) {
      return NextResponse.json(
        { error: "Video ID is required" },
        { status: 400 }
      );
    }

    // Validate required fields
    if (typeof watchedDuration !== "number" || watchedDuration < 0) {
      return NextResponse.json(
        { error: "Invalid watched duration" },
        { status: 400 }
      );
    }

    // Check if user has access to the course
    const hasAccess = await courseService.hasUserAccess(
      session.user.id,
      courseId
    );

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Professional duration resolution with proper fallbacks
    let finalTotalDuration = totalDuration;
    const finalCurrentTime = currentTime || watchedDuration;

    // If no totalDuration provided, attempt to get it from video metadata
    if (!finalTotalDuration || finalTotalDuration <= 0) {
      try {
        // Check cache first
        const cached = videoMetadataCache.get(videoId);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
          finalTotalDuration = cached.duration;
        } else {
          // Get video metadata from Sanity/database
          const videoMetadata = await courseService.getVideoById(videoId);
          if (videoMetadata?.duration && videoMetadata.duration > 0) {
            finalTotalDuration = videoMetadata.duration;
            // Cache the result
            videoMetadataCache.set(videoId, {
              duration: finalTotalDuration,
              timestamp: Date.now(),
            });
          }
        }

        if (finalTotalDuration && finalTotalDuration > 0) {
          console.log(
            `📹 Using video metadata duration: ${finalTotalDuration}s for video ${videoId}`
          );
        } else {
          // Smart estimation based on content type and watch patterns
          if (watchedDuration > 0) {
            // If user has watched some content, estimate based on typical content length
            const estimatedDuration = Math.max(
              watchedDuration * 1.2, // 20% buffer for unwatched content
              watchedDuration > 600 ? watchedDuration * 1.1 : 900 // Longer videos get smaller buffer, short videos default to 15min
            );
            finalTotalDuration = Math.round(estimatedDuration);
            console.log(
              `⏱️ Estimated duration: ${finalTotalDuration}s based on watched time: ${watchedDuration}s`
            );
          } else {
            // Default for new videos - typical educational video length
            finalTotalDuration = 900; // 15 minutes default instead of 5 minutes
          }
        }
      } catch (error) {
        console.error(
          `❌ Error fetching video metadata for ${videoId}:`,
          error
        );
        // Fallback to intelligent estimation
        finalTotalDuration =
          watchedDuration > 0 ? Math.max(watchedDuration * 1.2, 900) : 900;
        console.log(
          `🔄 Fallback duration: ${finalTotalDuration}s for video ${videoId}`
        );
      }
    }

    // Track milestone if provided
    if (milestone && typeof milestone === "number") {
      await trackMilestone(
        session.user.id,
        courseId,
        videoId,
        milestone,
        eventType
      );
    }

    // Batch database operations for better performance
    const [progress, courseProgress] = await Promise.all([
      enhancedProgressService
        .trackProgress({
          userId: session.user.id,
          videoId,
          courseId,
          watchedDuration: Math.floor(watchedDuration),
          totalDuration: Math.floor(finalTotalDuration),
          currentTime: Math.floor(finalCurrentTime),
          timestamp: new Date(),
        })
        .then(() =>
          enhancedProgressService.getUserVideoProgress(session.user.id, videoId)
        ),
      enhancedProgressService.getCourseProgress(session.user.id, courseId),
    ]);

    return NextResponse.json({
      success: true,
      progress,
      courseProgress: courseProgress
        ? {
            progressPercentage: courseProgress.overallProgress,
            completedVideos: courseProgress.completedVideos,
            totalVideos: courseProgress.totalVideos,
            estimatedTimeRemaining: 0, // We don't calculate this in enhanced service yet
          }
        : null,
      milestone: milestone,
      totalWatchTime,
      eventType: sanitizeString(eventType),
    });
  } catch (error) {
    console.log(
      "Error updating progress:",
      sanitizeLogOutput(
        error instanceof Error ? error.message : "Unknown error"
      )
    );

    return NextResponse.json(
      { error: sanitizeString("Failed to update progress") },
      { status: 500 }
    );
  }
}
