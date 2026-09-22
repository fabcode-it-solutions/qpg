"use client";

import { cn } from "@/lib/utils/utils";
import { CreditCardIcon, CalendarIcon } from "@/components/icons";
import { Subscription } from "./types";
import { statusConfig } from "./config";
import { formatPrice, formatDate, getIntervalLabel } from "./utils";
import { getSubscriptionLifecycle } from "@/lib/subscription/lifecycle";

interface SubscriptionCardProps {
  subscription: Subscription;
  onCancel: (subscriptionId: string) => void;
  onReactivate: (subscriptionId: string) => void;
  isCancelling: boolean;
  isReactivating: boolean;
}

export default function SubscriptionCard({
  subscription,
  onCancel,
  onReactivate,
  isCancelling,
  isReactivating,
}: SubscriptionCardProps) {
  const statusInfo = statusConfig[subscription.status];
  const lifecycle = getSubscriptionLifecycle(
    subscription.status,
    subscription.nextPaymentDate,
    subscription.cancelledAt,
    null
  );

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <h4 className="text-lg font-semibold text-white">
              {subscription.courseTitle}
            </h4>
            <span
              className={cn(
                "px-2 py-1 text-xs font-medium rounded-full",
                statusInfo.bg,
                statusInfo.color
              )}
            >
              {statusInfo.label}
            </span>
            <span className="px-2 py-1 text-xs hidden font-medium rounded-full bg-white/10 text-white/70">
              {getIntervalLabel(
                subscription.intervalLength,
                subscription.intervalUnit
              )}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div className="flex items-center gap-2 text-sm text-white/70">
              <CreditCardIcon size={16} />
              <span>
                {formatPrice(subscription.amount, subscription.currency)}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm text-white/70">
              <CalendarIcon size={16} />
              <span>
                Access Expires: {formatDate(subscription.nextPaymentDate)}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm text-white/70">
              <span>Started: {formatDate(subscription.startDate)}</span>
            </div>
          </div>

          {subscription.description && (
            <p className="text-sm text-white/60 mb-4">
              {subscription.description}
            </p>
          )}
        </div>

        <div className="ml-4 flex flex-col gap-2">
          {lifecycle.canCancel && (
            <button
              onClick={() => onCancel(subscription.authorizeNetSubscriptionId)}
              disabled={isCancelling}
              className="px-4 py-2 text-sm font-medium text-red-400 border border-red-400/30 rounded-lg hover:bg-red-400/10 transition-colors disabled:opacity-50"
            >
              {isCancelling ? "Cancelling..." : "Cancel"}
            </button>
          )}

          {/* {lifecycle.canReactivate && (
            <button
              onClick={() => onReactivate(subscription.id)}
              disabled={isReactivating}
              className="px-4 py-2 text-sm font-medium text-green-400 border border-green-400/30 rounded-lg hover:bg-green-400/10 transition-colors disabled:opacity-50"
            >
              {isReactivating ? "Reactivating..." : "Reactivate"}
            </button>
          )} */}
        </div>
      </div>
    </div>
  );
}
