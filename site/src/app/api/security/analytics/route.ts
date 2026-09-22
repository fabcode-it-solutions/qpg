import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const daysParam = searchParams.get("days") || "7";
    
    // Validate days parameter
    const days = parseInt(daysParam);
    if (isNaN(days) || days < 1 || days > 365) {
      return NextResponse.json(
        { error: "Invalid days parameter (1-365)" },
        { status: 400 }
      );
    }
    
    // Validate userId format if provided
    if (userId && !/^[a-zA-Z0-9_-]+$/.test(userId)) {
      return NextResponse.json(
        { error: "Invalid userId format" },
        { status: 400 }
      );
    }

    // Users can only view their own analytics unless they're admin
    const targetUserId = userId || session.user.id;
    
    // Check if user is trying to view someone else's data
    if (targetUserId !== session.user.id && !(session.user as any).isAdmin) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Mock analytics data since we removed the complex security service
    const analytics = {
      userId: targetUserId,
      days,
      totalVideoAccess: 0,
      securityViolations: 0,
      devToolsDetections: 0,
      suspiciousActivity: 0,
      lastAccessTime: new Date().toISOString()
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}