import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { hybridCourseService } from "@/lib/services/hybrid-course.service";
import { enhancedProgressService } from "@/lib/services/enhanced-progress.service";

const courseService = hybridCourseService;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { videoId } = await params;

    // Get video details first
    const video = await courseService.getVideoById(videoId);
    if (!video) {
      return NextResponse.json(
        { error: "Video not found" },
        { status: 404 }
      );
    }

    // Check if user has access to the course containing this video
    const hasAccess = await courseService.hasUserAccess(
      session.user.id,
      video.courseId
    );

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get user progress for this specific video using enhanced service
    const progress = await enhancedProgressService.getUserVideoProgress(
      session.user.id,
      videoId
    );

    return NextResponse.json({
      success: true,
      progress: progress || {
        videoId,
        userId: session.user.id,
        courseId: video.courseId,
        watchedDuration: 0,
        isCompleted: false,
        lastWatchedAt: null,
      },
    });
  } catch (error) {
    console.error("Video progress fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch video progress" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { videoId } = await params;

    // Parse request body
    const body = await req.json();
    const {
      watchedDuration,
      totalDuration,
      currentTime,
      sessionId,
    } = body;

    // Validate required fields
    if (
      typeof watchedDuration !== 'number' ||
      typeof totalDuration !== 'number' ||
      typeof currentTime !== 'number' ||
      watchedDuration < 0 ||
      totalDuration <= 0 ||
      currentTime < 0
    ) {
      return NextResponse.json(
        { error: "Invalid progress data" },
        { status: 400 }
      );
    }

    // Get video details first
    const video = await courseService.getVideoById(videoId);
    if (!video) {
      return NextResponse.json(
        { error: "Video not found" },
        { status: 404 }
      );
    }

    // Check if user has access to the course containing this video
    const hasAccess = await courseService.hasUserAccess(
      session.user.id,
      video.courseId
    );

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Track progress using enhanced service
    await enhancedProgressService.trackProgress({
      userId: session.user.id,
      videoId,
      courseId: video.courseId,
      watchedDuration,
      totalDuration,
      currentTime,
      sessionId,
      timestamp: new Date(),
    });


    // Get updated progress to return
    const updatedProgress = await enhancedProgressService.getUserVideoProgress(
      session.user.id,
      videoId
    );

    // Check for milestones
    const progressPercentage = (watchedDuration / totalDuration) * 100;
    const milestones = await enhancedProgressService.checkMilestones(
      session.user.id,
      videoId,
      progressPercentage
    );

    return NextResponse.json({
      success: true,
      progress: updatedProgress,
      milestones: milestones.length > 0 ? milestones : undefined,
    });
  } catch (error) {
    console.error("Video progress update error:", error);
    return NextResponse.json(
      { error: "Failed to update video progress" },
      { status: 500 }
    );
  }
}