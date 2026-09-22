import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/config";
import { SubscriptionService } from "@/lib/services/subscription.service";
import { SubscriptionsResponse } from "@/types/profile";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
): Promise<NextResponse<SubscriptionsResponse>> {
  try {
    const session = await getServerSession(authOptions);
    const { userId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Users can only access their own subscriptions
    if (session.user.id !== userId) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // Get user subscriptions using service
    const subscriptions = await SubscriptionService.getUserSubscriptions(
      userId
    );

    return NextResponse.json({
      success: true,
      subscriptions: subscriptions,
    });
  } catch (error) {
    console.error("Subscriptions fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch subscriptions" },
      { status: 500 }
    );
  }
}
