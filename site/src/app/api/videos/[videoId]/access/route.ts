import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { videoUnlockService } from "@/lib/services/video-unlock.service";

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

    // Get video access information
    const accessInfo = await videoUnlockService.checkVideoAccess(
      session.user.id,
      videoId
    );

    if (!accessInfo) {
      return NextResponse.json(
        { error: "Video not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      video: {
        id: accessInfo.video.id,
        title: accessInfo.video.title,
        duration: accessInfo.video.duration,
        isFree: accessInfo.video.isFree,
      },
      access: {
        isUnlocked: accessInfo.isUnlocked,
        canPreview: accessInfo.canPreview,
        unlockReason: accessInfo.unlockReason,
        unlockDate: accessInfo.unlockDate,
      },
    });
  } catch (error) {
    console.error("Video access check error:", error);
    return NextResponse.json(
      { error: "Failed to check video access" },
      { status: 500 }
    );
  }
}