import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/db";
import { suspiciousActivities } from "@/db/schema";
import { headers } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { type, videoId, timestamp, details } = body;

    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown";
    const userAgent = headersList.get("user-agent") || "unknown";

    // Log suspicious activity
    await db.insert(suspiciousActivities).values({
      userId: session.user.id,
      videoId: videoId || null,
      activityType: type,
      details: details || `Reported from ${ip} - ${userAgent}`,
      timestamp: new Date(timestamp),
    });

    // Here you could also send alerts to administrators
    if (type === "screen_recording_attempt" || type === "developer_tools_open") {
      console.warn("Security violation detected:", {
        userId: session.user.id,
        type,
        videoId,
        ip,
        userAgent,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Security report error:", error);
    return NextResponse.json(
      { error: "Failed to report security issue" },
      { status: 500 }
    );
  }
}