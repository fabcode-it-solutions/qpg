export type SubscriptionStatus = 
  | 'active' 
  | 'cancelled' 
  | 'expired' 
  | 'suspended' 
  | 'pending_cancellation'
  | 'grace_period';

export interface SubscriptionLifecycle {
  hasAccess: boolean;
  canCancel: boolean;
  canReactivate: boolean;
  daysUntilExpiry: number;
  gracePeriodDays: number;
}

export function getSubscriptionLifecycle(
  status: string,
  nextPaymentDate: string | null,
  cancelledAt: string | null,
  endDate: string | null
): SubscriptionLifecycle {
  const now = new Date();
  const nextPayment = nextPaymentDate ? new Date(nextPaymentDate) : null;
  const cancelled = cancelledAt ? new Date(cancelledAt) : null;
  const end = endDate ? new Date(endDate) : null;

  // For pending_cancellation, use endDate if available, otherwise nextPaymentDate
  const expiryDate = status === 'pending_cancellation' ? (end || nextPayment) : (end || nextPayment);
  const daysUntilExpiry = expiryDate 
    ? Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // Debug logging
  console.log('[LIFECYCLE]', {
    status,
    now: now.toISOString(),
    nextPayment: nextPayment?.toISOString(),
    endDate: end?.toISOString(),
    expiryDate: expiryDate?.toISOString(),
    daysUntilExpiry
  });

  switch (status) {
    case 'active':
      return {
        hasAccess: true,
        canCancel: true,
        canReactivate: false,
        daysUntilExpiry,
        gracePeriodDays: 0,
      };

    case 'cancelled':
    case 'pending_cancellation':
      // Cancelled but still has access until period end
      const hasAccessUntilEnd = expiryDate ? now < expiryDate : false;
      return {
        hasAccess: hasAccessUntilEnd,
        canCancel: false,
        canReactivate: hasAccessUntilEnd, // Can reactivate before expiry
        daysUntilExpiry: hasAccessUntilEnd ? daysUntilExpiry : 0,
        gracePeriodDays: 0,
      };

    case 'expired':
      // Grace period of 7 days after expiry
      const gracePeriodEnd = expiryDate 
        ? new Date(expiryDate.getTime() + 7 * 24 * 60 * 60 * 1000)
        : null;
      const inGracePeriod = gracePeriodEnd ? now < gracePeriodEnd : false;
      const graceDaysLeft = gracePeriodEnd && inGracePeriod
        ? Math.ceil((gracePeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      return {
        hasAccess: inGracePeriod,
        canCancel: false,
        canReactivate: inGracePeriod,
        daysUntilExpiry: 0,
        gracePeriodDays: graceDaysLeft,
      };

    case 'suspended':
      return {
        hasAccess: false,
        canCancel: true,
        canReactivate: true,
        daysUntilExpiry: 0,
        gracePeriodDays: 0,
      };

    default:
      return {
        hasAccess: false,
        canCancel: false,
        canReactivate: false,
        daysUntilExpiry: 0,
        gracePeriodDays: 0,
      };
  }
}