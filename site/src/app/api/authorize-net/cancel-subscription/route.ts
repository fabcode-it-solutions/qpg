import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/db";
import { userSubscriptions } from "@/db/schema/auth";
import { courseSubscriptions } from "@/db/schema/courses";
import { eq, and } from "drizzle-orm";
import { AuthorizeNetService } from "@/lib/authorize-net/authorize-net.service";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { subscriptionId } = await req.json();

    if (!subscriptionId) {
      return NextResponse.json(
        { error: "Subscription ID required" },
        { status: 400 }
      );
    }

    // Get user subscription
    const userSubscription = await db
      .select()
      .from(userSubscriptions)
      .where(
        and(
          eq(userSubscriptions.userId, session.user.id),
          eq(userSubscriptions.authorizeNetSubscriptionId, subscriptionId)
        )
      )
      .limit(1);

    if (!userSubscription.length) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    const subscription = userSubscription[0];

    if (subscription.status === "cancelled") {
      return NextResponse.json(
        { error: "Subscription already cancelled" },
        { status: 400 }
      );
    }

    const authorizeNetService = new AuthorizeNetService();

    // Cancel subscription with Authorize.net
    const cancelResult = await authorizeNetService.cancelSubscription(
      subscriptionId
    );

    if (!cancelResult.success) {
      return NextResponse.json(
        { error: cancelResult.errors?.[0] || "Cancellation failed" },
        { status: 400 }
      );
    }

    // Update subscription to pending_cancellation (maintains access until period end)
    const nextPaymentDate = subscription.nextPaymentDate
      ? new Date(subscription.nextPaymentDate)
      : new Date();
    const now = new Date();
    const hasTimeLeft = nextPaymentDate > now;

    await db
      .update(userSubscriptions)
      .set({
        status: hasTimeLeft ? "pending_cancellation" : "cancelled",
        cancelledAt: new Date(),
        cancellationReason: "user_requested",
        cancelledBy: "user",
        // Set end date to next payment date to maintain access
        endDate: hasTimeLeft ? nextPaymentDate : new Date(),
      })
      .where(eq(userSubscriptions.id, subscription.id));

    // Keep course subscription active until period end
    if (hasTimeLeft) {
      await db
        .update(courseSubscriptions)
        .set({
          status: "pending_cancellation",
          expiresAt: nextPaymentDate,
        })
        .where(eq(courseSubscriptions.subscriptionId, subscription.id));
    } else {
      await db
        .update(courseSubscriptions)
        .set({
          status: "cancelled",
        })
        .where(eq(courseSubscriptions.subscriptionId, subscription.id));
    }

    return NextResponse.json({
      success: true,
      message: "Subscription cancelled successfully",
      subscriptionId,
    });
  } catch (error) {
    console.error("Subscription cancellation error:", error);
    return NextResponse.json({ error: "Cancellation failed" }, { status: 500 });
  }
}
