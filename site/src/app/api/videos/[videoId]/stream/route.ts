import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { hybridCourseService } from "@/lib/services/hybrid-course.service";
import { videoUnlockService } from "@/lib/services/video-unlock.service";
import { headers } from "next/headers";
import { validateId, sanitizeString } from "@/lib/utils/security";

const courseService = hybridCourseService;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params;
    const headersList = await headers();

    // Validate videoId format
    if (!videoId || !validateId(videoId)) {
      return NextResponse.json({ error: "Invalid video ID" }, { status: 400 });
    }

    // Require authentication for all video access
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get video details and check access
    const video = await courseService.getVideoById(videoId);
    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const hasAccess = await courseService.hasUserAccess(
      session.user.id,
      video.courseId
    );
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check video unlock access
    const videoAccess = await videoUnlockService.checkVideoAccess(
      session.user.id,
      videoId
    );

    if (!videoAccess) {
      return NextResponse.json({ error: "Video access not found" }, { status: 404 });
    }

    // Handle preview vs full access
    const searchParams = new URL(req.url).searchParams;
    const isPreview = searchParams.get("preview") === "true";

    if (!videoAccess.isUnlocked && !videoAccess.canPreview) {
      return NextResponse.json(
        { 
          error: "Video is locked",
          unlockReason: sanitizeString(videoAccess.unlockReason || ''),
          unlockDate: videoAccess.unlockDate,
        },
        { status: 403 }
      );
    }

    if (!videoAccess.isUnlocked && videoAccess.canPreview && !isPreview) {
      return NextResponse.json(
        { 
          error: "Full video is locked, preview available",
          canPreview: true,
          unlockReason: sanitizeString(videoAccess.unlockReason || ''),
          unlockDate: videoAccess.unlockDate,
        },
        { status: 403 }
      );
    }

    // For Bunny.net videos, redirect to the secure stream URL or return error
    if (!video.bunnyStreamUrl) {
      return NextResponse.json({ error: "Video stream not available" }, { status: 404 });
    }
    
    return streamVideo(video.bunnyStreamUrl, headersList.get("range"));

  } catch (error) {
    console.error("Video stream error:", error);
    return NextResponse.json(
      { error: "Failed to access video" },
      { status: 500 }
    );
  }
}

async function streamVideo(videoUrl: string, range: string | null): Promise<NextResponse> {
  try {
    // Stream the video with support for range requests
    const videoResponse = await fetch(videoUrl, {
      headers: range ? { Range: range } : {},
    });

    if (!videoResponse.ok) {
      throw new Error(`Failed to fetch video: ${videoResponse.status}`);
    }

    // Copy response headers
    const responseHeaders = new Headers();
    
    // Copy important headers from the original response
    const headersToPreserve = [
      'content-length',
      'content-range',
      'content-type',
      'accept-ranges',
      'last-modified',
      'etag'
    ];
    
    headersToPreserve.forEach(header => {
      const value = videoResponse.headers.get(header);
      if (value) {
        responseHeaders.set(header, value);
      }
    });

    // Add security headers
    responseHeaders.set("Cache-Control", "private, no-cache");
    responseHeaders.set("X-Content-Type-Options", "nosniff");
    responseHeaders.set("Content-Security-Policy", "default-src 'none'; media-src 'self'");

    return new NextResponse(videoResponse.body, {
      status: videoResponse.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Video streaming error:", error);
    throw new Error("Failed to stream video");
  }
}