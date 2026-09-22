import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { hybridCourseService } from "@/lib/services/hybrid-course.service";
import { enhancedProgressService } from "@/lib/services/enhanced-progress.service";
import { validateId, sanitizeString } from "@/lib/utils/security";

/**
 * Debug endpoint for video progress tracking
 * Provides detailed information about video duration resolution and progress calculation
 */

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get("videoId");
    const courseId = searchParams.get("courseId");

    if (!videoId || !courseId || !validateId(videoId) || !validateId(courseId)) {
      return NextResponse.json(
        { error: "Valid videoId and courseId are required" },
        { status: 400 }
      );
    }

    // Get video metadata from Sanity
    let videoMetadata = null;
    let sanityError = null;
    try {
      videoMetadata = await hybridCourseService.getVideoById(videoId);
    } catch (error) {
      sanityError = error instanceof Error ? error.message : "Unknown error";
    }

    // Get current progress from database
    const currentProgress = await enhancedProgressService.getUserVideoProgress(
      session.user.id,
      videoId
    );

    // Get course progress
    const courseProgress = await enhancedProgressService.getCourseProgress(
      session.user.id,
      courseId
    );

    // Duration analysis
    const durationAnalysis = {
      sanityDuration: videoMetadata?.duration || null,
      progressTotalDuration: currentProgress?.totalDuration || null,
      recommendedDuration: videoMetadata?.duration || 
        currentProgress?.totalDuration || 
        900, // 15 minutes default
      durationSource: videoMetadata?.duration 
        ? "sanity" 
        : currentProgress?.totalDuration 
        ? "database" 
        : "default",
    };

    // Progress calculation analysis
    const progressAnalysis = currentProgress ? {
      watchedDuration: currentProgress.watchedDuration,
      totalDuration: currentProgress.totalDuration,
      storedProgressPercentage: currentProgress.progressPercentage,
      recalculatedProgressPercentage: durationAnalysis.recommendedDuration > 0 
        ? Math.round((currentProgress.watchedDuration / durationAnalysis.recommendedDuration) * 100)
        : 0,
      isCompleted: currentProgress.isCompleted,
      shouldBeCompleted: durationAnalysis.recommendedDuration > 0 
        ? currentProgress.watchedDuration >= (durationAnalysis.recommendedDuration * 0.9)
        : false,
      lastWatchedAt: currentProgress.lastWatchedAt,
      watchCount: currentProgress.watchCount,
    } : null;

    return NextResponse.json({
      success: true,
      debug: {
        userId: session.user.id,
        videoId,
        courseId,
        timestamp: new Date().toISOString(),
        
        // Video metadata analysis
        videoMetadata: {
          found: !!videoMetadata,
          title: sanitizeString(videoMetadata?.title || ''),
          duration: videoMetadata?.duration || null,
          bunnyVideoId: sanitizeString(videoMetadata?.bunnyVideoId || ''),
          order: videoMetadata?.order || null,
          sanityError: sanitizeString(sanityError || ''),
        },
        
        // Duration resolution analysis
        durationAnalysis,
        
        // Progress analysis
        progressAnalysis,
        
        // Course progress summary
        courseProgress: courseProgress ? {
          totalVideos: courseProgress.totalVideos,
          completedVideos: courseProgress.completedVideos,
          overallProgress: courseProgress.overallProgress,
          timeWeightedProgress: courseProgress.timeWeightedProgress,
          totalCourseDuration: courseProgress.totalCourseDuration,
          totalWatchedDuration: courseProgress.totalWatchedDuration,
          estimatedTimeRemaining: courseProgress.estimatedTimeRemaining,
        } : null,
        
        // System recommendations
        recommendations: {
          durationNeedsUpdate: !videoMetadata?.duration && 
            (!currentProgress?.totalDuration || currentProgress.totalDuration === 300),
          progressNeedsRecalculation: progressAnalysis && 
            Math.abs(progressAnalysis.storedProgressPercentage - progressAnalysis.recalculatedProgressPercentage) > 5,
          completionStatusNeedsUpdate: progressAnalysis && 
            progressAnalysis.isCompleted !== progressAnalysis.shouldBeCompleted,
        },
      }
    });
  } catch (error) {
    console.error("Debug progress endpoint error:", error);
    return NextResponse.json(
      { 
        error: "Failed to analyze progress", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { action, videoId, courseId } = await req.json();

    if (!videoId || !courseId || !validateId(videoId) || !validateId(courseId)) {
      return NextResponse.json(
        { error: "Valid videoId and courseId are required" },
        { status: 400 }
      );
    }

    const sanitizedAction = sanitizeString(action || '');
    if (!['recalculate_progress', 'fix_course_progress'].includes(sanitizedAction)) {
      return NextResponse.json(
        { error: "Invalid action" },
        { status: 400 }
      );
    }

    let result = null;

    switch (action) {
      case "recalculate_progress":
        // Get video metadata and current progress
        const videoMetadata = await hybridCourseService.getVideoById(videoId);
        const currentProgress = await enhancedProgressService.getUserVideoProgress(
          session.user.id,
          videoId
        );

        if (currentProgress && videoMetadata?.duration) {
          // Update with correct duration
          await enhancedProgressService.trackProgress({
            userId: session.user.id,
            videoId,
            courseId,
            watchedDuration: currentProgress.watchedDuration,
            totalDuration: videoMetadata.duration,
            currentTime: currentProgress.watchedDuration,
            timestamp: new Date(),
          });
          
          result = { message: "Progress recalculated successfully" };
        } else {
          result = { message: "No progress found or missing video metadata" };
        }
        break;

      case "fix_course_progress":
        // Recalculate entire course progress
        const courseProgress = await enhancedProgressService.getCourseProgress(
          session.user.id,
          courseId
        );
        result = { 
          message: "Course progress recalculated", 
          courseProgress 
        };
        break;

      default:
        return NextResponse.json(
          { error: "Invalid action. Available: recalculate_progress, fix_course_progress" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      action,
      result,
    });
  } catch (error) {
    console.error("Debug progress action error:", error);
    return NextResponse.json(
      { 
        error: "Failed to perform action", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}