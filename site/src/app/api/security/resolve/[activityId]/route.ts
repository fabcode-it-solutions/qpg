import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/db";
import { suspiciousActivities } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ activityId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Only admins can resolve security alerts
    if (!(session.user as any).isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { activityId } = await params;

    // Update the activity as resolved
    await db
      .update(suspiciousActivities)
      .set({
        resolved: new Date(),
      })
      .where(eq(suspiciousActivities.id, activityId));

    // Ensure no user input is reflected in the response to prevent XSS
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Resolve activity error:", error);
    return NextResponse.json(
      { error: "Failed to resolve activity" },
      { status: 500 }
    );
  }
}
