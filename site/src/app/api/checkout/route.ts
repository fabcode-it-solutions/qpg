import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { hybridCourseService } from "@/lib/services/hybrid-course.service";
import { validateId } from "@/lib/utils/security";
import { db } from "@/db";
import { paymentSessions } from "@/db/schema/courses";
import { nanoid } from "nanoid";

const courseService = hybridCourseService;

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { courseId } = await req.json();
    if (!courseId || !validateId(courseId)) {
      return NextResponse.json({ error: "Invalid course ID" }, { status: 400 });
    }

    const course = await courseService.getCourseById(courseId);
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    if (!course.isPublished) {
      return NextResponse.json(
        { error: "Course is not available for purchase" },
        { status: 400 }
      );
    }

    const hasAccess = await courseService.hasUserAccess(
      session.user.id,
      courseId
    );
    if (hasAccess) {
      return NextResponse.json(
        { error: "You already have access to this course" },
        { status: 400 }
      );
    }

    // Create payment session in database
    const sessionId = nanoid();
    const amount = Math.round(parseFloat(course.price) * 100); // Convert to cents

    await db.insert(paymentSessions).values({
      userId: session.user.id,
      courseId: courseId,
      amount: amount,
      currency: "USD",
      status: "pending",
    });

    // Create checkout URL
    const checkoutUrl = `${process.env.NEXTAUTH_URL}/payment/checkout?session=${sessionId}`;

    return NextResponse.json({ url: checkoutUrl });
  } catch (error) {
    console.error(
      "Checkout error:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
