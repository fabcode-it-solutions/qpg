import { db } from "@/db";
import { userSubscriptions } from "@/db/schema/auth";
import { courseSubscriptions } from "@/db/schema/courses";
import { eq, and } from "drizzle-orm";
import { getSubscriptionLifecycle } from "@/lib/subscription/lifecycle";

export interface CourseAccessResult {
  hasAccess: boolean;
  accessType: 'active' | 'grace_period' | 'expired' | 'none';
  daysRemaining: number;
  subscriptionStatus: string;
  message: string;
  canReactivate: boolean;
  subscriptionId?: string;
}

export async function checkCourseAccess(
  userId: string, 
  courseId: string
): Promise<CourseAccessResult> {
  try {
    // Get all user subscriptions for this course
    const subscriptions = await db
      .select({
        id: userSubscriptions.id,
        status: userSubscriptions.status,
        nextPaymentDate: userSubscriptions.nextPaymentDate,
        endDate: userSubscriptions.endDate,
        cancelledAt: userSubscriptions.cancelledAt,
        courseSubscriptionStatus: courseSubscriptions.status,
      })
      .from(userSubscriptions)
      .innerJoin(
        courseSubscriptions,
        eq(courseSubscriptions.subscriptionId, userSubscriptions.id)
      )
      .where(
        and(
          eq(userSubscriptions.userId, userId),
          eq(courseSubscriptions.courseId, courseId)
        )
      );

    if (!subscriptions.length) {
      return {
        hasAccess: false,
        accessType: 'none',
        daysRemaining: 0,
        subscriptionStatus: 'none',
        message: 'No subscription found for this course',
        canReactivate: false,
      };
    }

    // Debug logging
    console.log('[COURSE_ACCESS] Subscriptions found:', subscriptions);
    
    // Find the best subscription (active > pending_cancellation > grace_period)
    const activeSubscription = subscriptions.find(s => s.status === 'active');
    const pendingSubscription = subscriptions.find(s => s.status === 'pending_cancellation');
    const expiredSubscription = subscriptions.find(s => s.status === 'expired');
    
    const bestSubscription = activeSubscription || pendingSubscription || expiredSubscription || subscriptions[0];
    console.log('[COURSE_ACCESS] Best subscription:', bestSubscription);
    
    // Get lifecycle information
    const lifecycle = getSubscriptionLifecycle(
      bestSubscription.status,
      bestSubscription.nextPaymentDate?.toISOString() || null,
      bestSubscription.cancelledAt?.toISOString() || null,
      bestSubscription.endDate?.toISOString() || null
    );

    // Determine access type and message
    let accessType: CourseAccessResult['accessType'] = 'none';
    let message = '';

    if (lifecycle.hasAccess) {
      if (bestSubscription.status === 'active') {
        accessType = 'active';
        message = lifecycle.daysUntilExpiry > 0 
          ? `Access until ${new Date(bestSubscription.nextPaymentDate!).toLocaleDateString()}`
          : 'Active subscription';
      } else if (bestSubscription.status === 'pending_cancellation') {
        accessType = 'active';
        message = `Access ends in ${lifecycle.daysUntilExpiry} days`;
      } else if (lifecycle.gracePeriodDays > 0) {
        accessType = 'grace_period';
        message = `Grace period: ${lifecycle.gracePeriodDays} days remaining`;
      }
    } else {
      accessType = 'expired';
      message = 'Subscription expired. Please renew to continue access.';
    }

    return {
      hasAccess: lifecycle.hasAccess,
      accessType,
      daysRemaining: lifecycle.daysUntilExpiry,
      subscriptionStatus: bestSubscription.status,
      message,
      canReactivate: lifecycle.canReactivate,
      subscriptionId: bestSubscription.id,
    };

  } catch (error) {
    console.error('Course access check failed:', error);
    return {
      hasAccess: false,
      accessType: 'none',
      daysRemaining: 0,
      subscriptionStatus: 'error',
      message: 'Unable to verify access',
      canReactivate: false,
    };
  }
}