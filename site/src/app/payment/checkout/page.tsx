import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/db";
import { paymentSessions } from "@/db/schema/courses";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import PaymentMethodSelector from "@/components/authorize-net/PaymentMethodSelector";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const { session: sessionId } = await searchParams;
  if (!sessionId) {
    notFound();
  }

  // Get payment session
  const paymentSession = await db
    .select()
    .from(paymentSessions)
    .where(eq(paymentSessions.id, sessionId))
    .limit(1);

  if (!paymentSession.length || paymentSession[0].userId !== session.user.id) {
    notFound();
  }

  const payment = paymentSession[0];

  if (payment.status !== "pending") {
    redirect("/courses");
  }

  // Get course details for title
  const { hybridCourseService } = await import(
    "@/lib/services/hybrid-course.service"
  );
  const course = await hybridCourseService.getCourseById(payment.courseId);
  const courseTitle = course?.title || "Course";

  return (
    <div className="min-h-screen bg-black py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-3 sm:p-8">
          <h1 className="text-3xl font-bold text-white mb-6 text-center">
            Complete Your Purchase
          </h1>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">
              Order Summary
            </h2>
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1 pr-4">
                <span className="text-white/80 text-sm">Course Access</span>
                <p className="text-white font-medium">{courseTitle}</p>
              </div>
              <span className="text-(--color-gold) font-bold">
                ${(payment.amount / 100).toFixed(2)}
              </span>
            </div>
            <div className="border-t border-white/10 pt-2 mt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-white">Total</span>
                <span className="text-xl font-bold text-(--color-gold)">
                  ${(payment.amount / 100).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <PaymentMethodSelector
            sessionId={sessionId}
            amount={payment.amount}
            courseTitle={courseTitle}
            paymentId={payment.id}
          />
        </div>
      </div>
    </div>
  );
}
