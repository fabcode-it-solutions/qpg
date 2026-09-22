import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { hybridCourseService } from "@/lib/services/hybrid-course.service";
import { enhancedProgressService } from "@/lib/services/enhanced-progress.service";
import { validateId } from "@/lib/utils/security";

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
    if (!courseId || !validateId(courseId)) {
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

    // Get course progress summary
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
        progressPercentage: progress.progressPercentage,
        completedVideos: progress.completedVideos,
        totalVideos: progress.totalVideos,
        totalDuration: progress.totalDuration,
        watchedDuration: progress.watchedDuration,
        lastActivityAt: progress.lastActivityAt,
        estimatedTimeRemaining: progress.estimatedTimeRemaining,
      },
    });
  } catch (error) {
    console.error("Course progress summary error:", error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: "Failed to fetch course progress" },
      { status: 500 }
    );
  }
}
