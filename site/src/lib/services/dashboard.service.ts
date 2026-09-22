import { db } from "@/db";
import { userSubscriptions } from "@/db/schema/auth";
import { courseSubscriptions } from "@/db/schema/courses";
import { eq, and, or } from "drizzle-orm";
import { hybridCourseService } from "./hybrid-course.service";
import { performanceMonitor } from "@/lib/utils/performance-monitor";

export interface DashboardData {
  subscriptions: Array<{
    subscriptionId: string;
    subscriptionStatus: string;
    subscriptionName: string | null;
    amount: string | null;
    currency: string | null;
    nextPaymentDate: Date | null;
    courseId: string;
    courseStatus:
      | "active"
      | "inactive"
      | "expired"
      | "cancelled"
      | "pending"
      | "pending_cancellation"
      | "trial";
  }>;
  courses: any[];
  progress: Record<string, any>;
}

class DashboardService {
  async getDashboardData(userId: string): Promise<DashboardData> {
    // Get active subscriptions with course info
    const activeSubscriptionsWithCourses = await performanceMonitor.trackDbCall(
      "getActiveSubscriptionsWithCourses",
      () =>
        db
          .select({
            subscriptionId: userSubscriptions.id,
            subscriptionStatus: userSubscriptions.status,
            subscriptionName: userSubscriptions.name,
            amount: userSubscriptions.amount,
            currency: userSubscriptions.currency,
            nextPaymentDate: userSubscriptions.nextPaymentDate,
            courseId: courseSubscriptions.courseId,
            courseStatus: courseSubscriptions.status,
          })
          .from(userSubscriptions)
          .innerJoin(
            courseSubscriptions,
            eq(courseSubscriptions.subscriptionId, userSubscriptions.id)
          )
          .where(
            and(
              eq(userSubscriptions.userId, userId),
              or(
                eq(userSubscriptions.status, "active"),
                eq(userSubscriptions.status, "pending_cancellation")
              ),
              or(
                eq(courseSubscriptions.status, "active"),
                eq(courseSubscriptions.status, "pending_cancellation")
              )
            )
          )
    );

    // Get unique course IDs
    const courseIds = [
      ...new Set(activeSubscriptionsWithCourses.map((sub) => sub.courseId)),
    ];

    // Fetch courses and progress in parallel
    const [coursesData, progressData] = await Promise.all([
      Promise.all(
        courseIds.map((courseId) =>
          performanceMonitor.trackDbCall("getCourseById", () =>
            hybridCourseService.getCourseById(courseId)
          )
        )
      ),
      Promise.all(
        courseIds.map((courseId) =>
          performanceMonitor.trackDbCall("getCourseProgress", () =>
            hybridCourseService.getCourseProgress(userId, courseId)
          )
        )
      ),
    ]);

    // Filter out null courses and build progress map
    const courses = coursesData.filter(Boolean);
    const progress: Record<string, any> = {};
    courseIds.forEach((courseId, index) => {
      if (progressData[index]) {
        progress[courseId] = progressData[index];
      }
    });

    return {
      subscriptions: activeSubscriptionsWithCourses,
      courses,
      progress,
    };
  }
}

export const dashboardService = new DashboardService();
