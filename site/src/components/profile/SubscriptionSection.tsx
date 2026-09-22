"use client";

import { useState, useEffect } from "react";
import { SpinnerIcon } from "@/components/icons";
import { ProfileSectionProps } from "@/types/profile";
import { Subscription, MessageState } from "./subscription/types";
import SubscriptionCard from "./subscription/SubscriptionCard";
import EmptyState from "./subscription/EmptyState";
import MessageAlert from "./subscription/MessageAlert";
import TransactionTable from "./subscription/TransactionTable";

export default function SubscriptionSection({ userId }: ProfileSectionProps) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [reactivatingId, setReactivatingId] = useState<string | null>(null);
  const [message, setMessage] = useState<MessageState | null>(null);

  useEffect(() => {
    fetchSubscriptions();
    fetchTransactions();
  }, [userId]);

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch("/api/authorize-net/subscriptions");
      if (response.ok) {
        const data = await response.json();
        setSubscriptions(data.subscriptions || []);
      }
    } catch (error) {
      console.error("Failed to fetch subscriptions:", error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await fetch("/api/authorize-net/transactions");
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    if (
      !confirm(
        "Your subscription will be cancelled but you'll keep access until the end of your current billing period. Continue?"
      )
    ) {
      return;
    }

    setCancellingId(subscriptionId);
    setMessage(null);

    try {
      const response = await fetch("/api/authorize-net/cancel-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ subscriptionId }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text: "Subscription cancelled. You'll keep access until your current period ends.",
        });
        fetchSubscriptions();
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to cancel subscription",
        });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setCancellingId(null);
    }
  };

  const handleReactivateSubscription = async (subscriptionId: string) => {
    setReactivatingId(subscriptionId);
    setMessage(null);

    try {
      const response = await fetch("/api/authorize-net/reactivate-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ subscriptionId }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text: "Subscription reactivated successfully!",
        });
        fetchSubscriptions();
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to reactivate subscription",
        });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setReactivatingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <SpinnerIcon size={48} className="text-(--color-gold) mx-auto mb-4" />
        <p className="text-white/70">Loading subscriptions...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">
          Subscriptions & Billing
        </h2>
        <p className="text-white/60">
          Manage your course subscriptions and view payment history.
        </p>
      </div>

      {message && <MessageAlert message={message} />}

      <div className="mb-8">
        <h3 className="text-xl font-semibold text-white mb-4">
          Active Subscriptions
        </h3>

        {subscriptions.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-4">
            {subscriptions.map((subscription) => (
              <SubscriptionCard
                key={subscription.id}
                subscription={subscription}
                onCancel={handleCancelSubscription}
                onReactivate={handleReactivateSubscription}
                isCancelling={cancellingId === subscription.authorizeNetSubscriptionId}
                isReactivating={reactivatingId === subscription.id}
              />
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-xl font-semibold text-white mb-4">
          Payment History
        </h3>
        <TransactionTable transactions={transactions} />
      </div>
    </div>
  );
}