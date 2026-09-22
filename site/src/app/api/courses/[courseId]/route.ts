import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { hybridCourseService } from "@/lib/services/hybrid-course.service";

const courseService = hybridCourseService;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { courseId } = await params;

    // Validate courseId format
    if (!courseId || typeof courseId !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(courseId)) {
      return NextResponse.json({ error: "Invalid course ID" }, { status: 400 });
    }

    const course = await courseService.getCourseWithVideos(courseId);
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    let hasAccess = false;
    let progress = null;

    if (session?.user?.id) {
      hasAccess = await courseService.hasUserAccess(session.user.id, courseId);
      if (hasAccess) {
        progress = await courseService.getCourseProgress(session.user.id, courseId);
      }
    }

    const response = {
      course: {
        ...course,
        videos: hasAccess ? course.videos : [],
      },
      hasAccess,
      progress,
      totalVideos: course.videos.length,
      accessibleVideos: hasAccess ? course.videos.length : 0,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Get course error:", error);
    return NextResponse.json(
      { error: "Failed to fetch course" },
      { status: 500 }
    );
  }
}