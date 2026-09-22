import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/config";
import { SubscriptionService } from "@/lib/services/subscription.service";
import { ApiResponse } from "@/types/profile";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ subscriptionId: string }> }
): Promise<NextResponse<ApiResponse>> {
  try {
    const session = await getServerSession(authOptions);
    const { subscriptionId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Cancel subscription using service
    await SubscriptionService.cancelSubscription(
      subscriptionId,
      session.user.id,
      "User requested cancellation"
    );

    return NextResponse.json({
      success: true,
      message: "Subscription cancelled successfully",
    });
  } catch (error) {
    console.error("Subscription cancellation error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Failed to cancel subscription";

    return NextResponse.json(
      { success: false, error: errorMessage },
      {
        status:
          error instanceof Error &&
          "code" in error &&
          (error as any).code === "SUBSCRIPTION_NOT_FOUND"
            ? 404
            : 500,
      }
    );
  }
}
