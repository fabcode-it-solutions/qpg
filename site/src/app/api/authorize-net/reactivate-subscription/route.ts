import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/db";
import { userSubscriptions } from "@/db/schema/auth";
import { courseSubscriptions } from "@/db/schema/courses";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { subscriptionId } = await req.json();

    if (!subscriptionId) {
      return NextResponse.json({ error: "Subscription ID required" }, { status: 400 });
    }

    // Get user subscription
    const userSubscription = await db
      .select()
      .from(userSubscriptions)
      .where(
        and(
          eq(userSubscriptions.userId, session.user.id),
          eq(userSubscriptions.id, subscriptionId)
        )
      )
      .limit(1);

    if (!userSubscription.length) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    const subscription = userSubscription[0];

    // Check if subscription can be reactivated
    const now = new Date();
    const endDate = subscription.endDate ? new Date(subscription.endDate) : null;
    const canReactivate = subscription.status === "pending_cancellation" && 
                         endDate && now < endDate;

    if (!canReactivate) {
      return NextResponse.json({ 
        error: "Subscription cannot be reactivated" 
      }, { status: 400 });
    }

    // Reactivate subscription
    await db
      .update(userSubscriptions)
      .set({
        status: "active",
        cancelledAt: null,
        cancellationReason: null,
        cancelledBy: null,
        endDate: null, // Remove end date to continue billing
      })
      .where(eq(userSubscriptions.id, subscription.id));

    // Reactivate course subscriptions
    await db
      .update(courseSubscriptions)
      .set({
        status: "active",
        expiresAt: null,
      })
      .where(eq(courseSubscriptions.subscriptionId, subscription.id));

    return NextResponse.json({
      success: true,
      message: "Subscription reactivated successfully",
    });
  } catch (error) {
    console.error("Subscription reactivation error:", error);
    return NextResponse.json(
      { error: "Reactivation failed" },
      { status: 500 }
    );
  }
}