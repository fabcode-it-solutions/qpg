import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { hybridCourseService } from "@/lib/services/hybrid-course.service";

const courseService = hybridCourseService;

export async function requireCourseAccess(
  req: NextRequest,
  courseId: string
): Promise<{ hasAccess: boolean; userId?: string; error?: NextResponse }> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return {
        hasAccess: false,
        error: NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        ),
      };
    }

    const hasAccess = await courseService.hasUserAccess(
      session.user.id,
      courseId
    );

    if (!hasAccess) {
      return {
        hasAccess: false,
        userId: session.user.id,
        error: NextResponse.json(
          { error: "Access denied. Subscription required." },
          { status: 403 }
        ),
      };
    }

    return {
      hasAccess: true,
      userId: session.user.id,
    };
  } catch (error) {
    console.error("Course access check error:", error);
    return {
      hasAccess: false,
      error: NextResponse.json(
        { error: "Failed to verify access" },
        { status: 500 }
      ),
    };
  }
}

export async function checkVideoAccess(
  req: NextRequest,
  courseId: string,
  videoId: string
): Promise<{ hasAccess: boolean; userId?: string; error?: NextResponse }> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return {
        hasAccess: false,
        error: NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        ),
      };
    }

    const video = await courseService.getVideoById(videoId);
    if (!video) {
      return {
        hasAccess: false,
        userId: session.user.id,
        error: NextResponse.json({ error: "Video not found" }, { status: 404 }),
      };
    }

    // All videos require subscription
    const hasAccess = await courseService.hasUserAccess(
      session.user.id,
      courseId
    );

    if (!hasAccess) {
      return {
        hasAccess: false,
        userId: session.user.id,
        error: NextResponse.json(
          { error: "Access denied. Subscription required." },
          { status: 403 }
        ),
      };
    }

    return {
      hasAccess: true,
      userId: session.user.id,
    };
  } catch (error) {
    console.error("Video access check error:", error);
    return {
      hasAccess: false,
      error: NextResponse.json(
        { error: "Failed to verify video access" },
        { status: 500 }
      ),
    };
  }
}
