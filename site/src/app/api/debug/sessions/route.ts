import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";

export async function GET(req: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: "Not available in production" }, { status: 404 });
  }

  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Simple mock response since we removed the complex security service
    return NextResponse.json({
      totalActiveSessions: 0,
      totalTokens: 0,
      userSessions: 0,
      sessions: [],
      allSessions: []
    });

  } catch (error) {
    console.error("Debug sessions error:", error);
    return NextResponse.json({ error: "Failed to get sessions" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: "Not available in production" }, { status: 404 });
  }

  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Mock session clearing
    return NextResponse.json({ 
      success: true,
      message: "All sessions cleared for user"
    });

  } catch (error) {
    console.error("Clear sessions error:", error);
    return NextResponse.json({ error: "Failed to clear sessions" }, { status: 500 });
  }
}