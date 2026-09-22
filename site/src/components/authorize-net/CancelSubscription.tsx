"use client";

import { useState } from "react";

interface CancelSubscriptionProps {
  subscriptionId: string;
  onCancel?: () => void;
  onError?: (error: string) => void;
}

export default function CancelSubscription({
  subscriptionId,
  onCancel,
  onError,
}: CancelSubscriptionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleCancel = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch("/api/authorize-net/cancel-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ subscriptionId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Cancellation failed");
      }

      onCancel?.();
      setShowConfirm(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Cancellation failed";
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (showConfirm) {
    return (
      <div className="p-4 border border-red-200 rounded-lg bg-red-50">
        <h3 className="text-lg font-semibold text-red-800 mb-2">
          Cancel Subscription
        </h3>
        <p className="text-red-700 mb-4">
          Are you sure you want to cancel your subscription? This action cannot be undone.
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
          >
            {isLoading ? "Cancelling..." : "Yes, Cancel"}
          </button>
          <button
            onClick={() => setShowConfirm(false)}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            Keep Subscription
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
    >
      Cancel Subscription
    </button>
  );
}