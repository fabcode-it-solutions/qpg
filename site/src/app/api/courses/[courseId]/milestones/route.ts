import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { videoUnlockService } from "@/lib/services/video-unlock.service";
import { hybridCourseService } from "@/lib/services/hybrid-course.service";

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

    // Check if user has access to the course
    const hasAccess = await hybridCourseService.hasUserAccess(
      session.user.id,
      courseId
    );

    if (!hasAccess) {
      return NextResponse.json(
        { error: "No access to this course" },
        { status: 403 }
      );
    }

    // Get course videos with access information
    const courseContent = await videoUnlockService.getCourseVideosWithAccess(
      session.user.id,
      courseId
    );

    if (!courseContent) {
      return NextResponse.json(
        { error: "Course content not found" },
        { status: 404 }
      );
    }

    // Transform the response for frontend consumption
    const response = {
      course: {
        id: courseContent.course.id,
        title: courseContent.course.title,
        progressiveUnlock: courseContent.course.progressiveUnlock,
      },
      videos: courseContent.videos.map((videoAccess) => ({
        id: videoAccess.video.id,
        title: videoAccess.video.title,
        order: videoAccess.video.order,
        duration: videoAccess.video.duration,
        isUnlocked: videoAccess.isUnlocked,
        canPreview: videoAccess.canPreview,
        unlockReason: videoAccess.unlockReason,
        unlockDate: videoAccess.unlockDate,
        isFree: videoAccess.video.isFree,
        unlockSettings: videoAccess.video.unlockSettings,
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Course videos fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch course videos" },
      { status: 500 }
    );
  }
}