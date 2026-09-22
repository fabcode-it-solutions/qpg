import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/db";
import { userSubscriptions } from "@/db/schema/auth";
import { courseSubscriptions, courses } from "@/db/schema/courses";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user subscriptions with course details
    const subscriptions = await db
      .select({
        id: userSubscriptions.id,
        authorizeNetSubscriptionId: userSubscriptions.authorizeNetSubscriptionId,
        name: userSubscriptions.name,
        description: userSubscriptions.description,
        status: userSubscriptions.status,
        amount: userSubscriptions.amount,
        currency: userSubscriptions.currency,
        intervalLength: userSubscriptions.intervalLength,
        intervalUnit: userSubscriptions.intervalUnit,
        startDate: userSubscriptions.startDate,
        nextPaymentDate: userSubscriptions.nextPaymentDate,
        cancelledAt: userSubscriptions.cancelledAt,
        cancellationReason: userSubscriptions.cancellationReason,
        createdAt: userSubscriptions.createdAt,
        courseTitle: courses.title,
        courseSlug: courses.slug,
      })
      .from(userSubscriptions)
      .leftJoin(
        courseSubscriptions,
        eq(courseSubscriptions.subscriptionId, userSubscriptions.id)
      )
      .leftJoin(courses, eq(courses.id, courseSubscriptions.courseId))
      .where(eq(userSubscriptions.userId, session.user.id))
      .orderBy(userSubscriptions.createdAt);

    return NextResponse.json({ subscriptions });
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscriptions" },
      { status: 500 }
    );
  }
}