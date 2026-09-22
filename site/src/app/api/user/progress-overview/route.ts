import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { hybridCourseService } from "@/lib/services/hybrid-course.service";
import { enhancedProgressService } from "@/lib/services/enhanced-progress.service";

const courseService = hybridCourseService;

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get user's progress overview across all courses
    const overview = await enhancedProgressService.getUserProgressOverview(session.user.id);

    return NextResponse.json({
      success: true,
      overview: {
        totalCourses: overview.totalCourses,
        completedCourses: overview.completedCourses,
        inProgressCourses: overview.inProgressCourses,
        totalWatchTime: overview.totalWatchTime,
        coursesProgress: overview.coursesProgress.map((course: any) => ({
          courseId: course.courseId,
          courseTitle: course.courseTitle,
          progressPercentage: course.progressPercentage,
          completedVideos: course.completedVideos,
          totalVideos: course.totalVideos,
          lastActivityAt: course.lastActivityAt,
          estimatedTimeRemaining: course.estimatedTimeRemaining,
        })),
      },
    });
  } catch (error) {
    console.error("User progress overview error:", error);
    return NextResponse.json(
      { error: "Failed to fetch progress overview" },
      { status: 500 }
    );
  }
}