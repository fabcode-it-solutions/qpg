import { NextRequest, NextResponse } from "next/server";
import { contentSyncService } from "@/lib/services/content-sync.service";

export async function POST(req: NextRequest) {
  try {
    const { courseId, videoId, syncAll, force } = await req.json();

    if (syncAll) {
      if (force) {
        contentSyncService.clearCache();
      }
      const result = await contentSyncService.syncAllContent();
      return NextResponse.json({
        success: true,
        message: `Synced ${result.courses} courses and ${result.videos} videos`,
        data: result,
      });
    }

    if (courseId) {
      const success = await contentSyncService.syncCourse(courseId);
      if (success) {
        await contentSyncService.syncCourseVideos(courseId);
      }
      return NextResponse.json({
        success,
        message: success ? `Course ${courseId} synced` : `Failed to sync course ${courseId}`,
      });
    }

    if (videoId) {
      const success = await contentSyncService.syncVideo(videoId);
      return NextResponse.json({
        success,
        message: success ? `Video ${videoId} synced` : `Failed to sync video ${videoId}`,
      });
    }

    return NextResponse.json(
      { error: "Missing courseId, videoId, or syncAll parameter" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Content sync API error:", error);
    return NextResponse.json(
      { error: "Content sync failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const result = await contentSyncService.smartInitialSync();
    return NextResponse.json({
      success: true,
      message: "Smart sync completed",
      data: result,
    });
  } catch (error) {
    console.error("Smart sync API error:", error);
    return NextResponse.json(
      { error: "Smart sync failed" },
      { status: 500 }
    );
  }
}