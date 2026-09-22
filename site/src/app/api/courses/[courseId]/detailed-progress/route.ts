import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { hybridCourseService } from "@/lib/services/hybrid-course.service";
import { enhancedProgressService } from "@/lib/services/enhanced-progress.service";
import { sanitizeString } from "@/lib/utils/security";

const courseService = hybridCourseService;

export async function GET(
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

    const { courseId } = await params;

    // Validate courseId format
    if (!courseId || typeof courseId !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(courseId)) {
      return NextResponse.json({ error: "Invalid course ID" }, { status: 400 });
    }

    // Check if user has access to the course
    const hasAccess = await courseService.hasUserAccess(
      session.user.id,
      courseId
    );

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get detailed course progress
    const progress = await enhancedProgressService.getEnhancedCourseProgress(
      session.user.id,
      courseId
    );

    if (!progress) {
      return NextResponse.json(
        { error: "Course not found or no progress data" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      progress: {
        courseTitle: sanitizeString(progress.courseTitle || ''),
        progressPercentage: progress.progressPercentage,
        completedVideos: progress.completedVideos,
        totalVideos: progress.totalVideos,
        totalDuration: progress.totalDuration,
        watchedDuration: progress.watchedDuration,
        lastActivityAt: progress.lastActivityAt,
        estimatedTimeRemaining: progress.estimatedTimeRemaining,
        videosProgress: progress.videosProgress.map((video: any) => ({
          videoId: sanitizeString(video.videoId || ''),
          title: sanitizeString(video.title || ''),
          duration: video.duration,
          watchedDuration: video.watchedDuration,
          progressPercentage: video.progressPercentage,
          isCompleted: video.isCompleted,
          lastWatchedAt: video.lastWatchedAt,
        })),
      },
    });
  } catch (error) {
    console.error("Detailed course progress error:", error);
    return NextResponse.json(
      { error: "Failed to fetch detailed course progress" },
      { status: 500 }
    );
  }
}
