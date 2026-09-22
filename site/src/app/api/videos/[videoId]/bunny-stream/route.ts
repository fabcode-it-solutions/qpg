import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { hybridCourseService } from "@/lib/services/hybrid-course.service";
import { getBunnyService } from "@/lib/bunny/bunny.service";
import { db } from "@/db";
import { videoAccessLogs } from "@/db/schema";

const courseService = hybridCourseService;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { videoId } = await params;

    // Get video details using hybrid service
    const video = await courseService.getVideoById(videoId);

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // Check if user has access to this video's course
    const hasAccess = await courseService.hasUserAccess(
      session.user.id,
      video.courseId
    );

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Access denied. Active subscription required." },
        { status: 403 }
      );
    }

    // Check if video has bunny video ID
    if (!video.bunnyVideoId) {
      return NextResponse.json(
        { error: "Video is not available" },
        { status: 404 }
      );
    }

    // For processing videos, still allow access but notify status
    if (video.bunnyVideoStatus === "error") {
      return NextResponse.json(
        { error: "Video processing failed" },
        { status: 503 }
      );
    }

    const bunnyService = getBunnyService();

    // Generate secure streaming URL with 2-hour expiration
    const secureStreamUrl = bunnyService.generateSecureUrl(
      video.bunnyVideoId,
      120, // 2 hours
      session.user.id
    );

    // Generate secure iframe URL as alternative
    const secureIframeUrl = bunnyService.generateSecureIframeUrl(
      video.bunnyVideoId,
      120 // 2 hours
    );

    // Get thumbnail URL
    const thumbnailUrl =
      video.bunnyThumbnailUrl ||
      bunnyService.getThumbnailUrl(video.bunnyVideoId);

    // Log video access for security monitoring
    await db.insert(videoAccessLogs).values({
      userId: session.user.id,
      videoId: video.id,
      courseId: video.courseId,
      action: "stream_started",
      ip:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    return NextResponse.json({
      success: true,
      video: {
        id: video.id,
        title: video.title,
        description: video.description,
        streamUrl: secureStreamUrl,
        iframeUrl: secureIframeUrl,
        thumbnailUrl: thumbnailUrl,
        duration: video.duration,
        width: video.width,
        height: video.height,
        // Security token info
        expiresAt: new Date(Date.now() + 120 * 60 * 1000).toISOString(),
      },
    });
  } catch (error) {
    console.error("Error generating secure stream URL:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
