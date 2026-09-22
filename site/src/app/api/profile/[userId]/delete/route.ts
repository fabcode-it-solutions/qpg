import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/db";
import { users, userSubscriptions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { SubscriptionService } from "@/lib/services/subscription.service";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    const { userId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Users can only delete their own account
    if (session.user.id !== userId) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // Get all user subscriptions (active and inactive)
    const userSubs = await SubscriptionService.getUserSubscriptions(userId);

    const activeSubscriptions = userSubs.filter(
      (sub) => sub.status === "active"
    );

    // Cancel all active subscriptions using the service
    const cancellationResults = [];
    for (const subscription of activeSubscriptions) {
      try {
        await SubscriptionService.cancelSubscription(
          subscription.id,
          userId,
          "Account deletion"
        );

        cancellationResults.push({
          subscriptionId: subscription.id,
          success: true,
        });
      } catch (error) {
        console.error(
          `Failed to cancel subscription ${subscription.id}:`,
          error
        );
        cancellationResults.push({
          subscriptionId: subscription.id,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Check if all subscriptions were successfully cancelled
    const failedCancellations = cancellationResults.filter(
      (result) => !result.success
    );
    if (failedCancellations.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to cancel some subscriptions. Please contact support.",
          details: failedCancellations,
        },
        { status: 500 }
      );
    }

    // Delete user account (cascade will handle related records)
    await db.delete(users).where(eq(users.id, userId));

    return NextResponse.json({
      success: true,
      message: "Account deleted successfully",
      cancelledSubscriptions: cancellationResults.length,
    });
  } catch (error) {
    console.error("Account deletion error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete account. Please try again or contact support.",
      },
      { status: 500 }
    );
  }
}
