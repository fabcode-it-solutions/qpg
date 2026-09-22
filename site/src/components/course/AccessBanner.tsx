"use client";

import { useState, useEffect } from "react";
import { AlertTriangleIcon, CheckIcon, XIcon } from "@/components/icons";
import { CourseAccessResult } from "@/lib/access-control/course-access";

interface AccessBannerProps {
  courseId: string;
}

export default function AccessBanner({ courseId }: AccessBannerProps) {
  const [access, setAccess] = useState<CourseAccessResult | null>(null);
  const [isReactivating, setIsReactivating] = useState(false);

  useEffect(() => {
    checkAccess();
  }, [courseId]);

  const checkAccess = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}/access`);
      if (response.ok) {
        const data = await response.json();
        setAccess(data);
      }
    } catch (error) {
      console.error("Failed to check access:", error);
    }
  };

  const handleReactivate = async () => {
    if (!access?.subscriptionId) return;

    setIsReactivating(true);
    try {
      const response = await fetch(
        "/api/authorize-net/reactivate-subscription",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscriptionId: access.subscriptionId }),
        }
      );

      if (response.ok) {
        checkAccess(); // Refresh access status
      }
    } catch (error) {
      console.error("Reactivation failed:", error);
    } finally {
      setIsReactivating(false);
    }
  };

  if (!access || access.accessType === "active") return null;

  const getBannerStyle = () => {
    switch (access.accessType) {
      case "grace_period":
        return "bg-yellow-500/10 border-yellow-500/30 text-yellow-400";
      case "expired":
        return "bg-red-500/10 border-red-500/30 text-red-400";
      default:
        return "bg-gray-500/10 border-gray-500/30 text-gray-400";
    }
  };

  const getIcon = () => {
    switch (access.accessType) {
      case "grace_period":
        return <AlertTriangleIcon size={20} className="text-yellow-400" />;
      case "expired":
        return <XIcon size={20} className="text-red-400" />;
      default:
        return <AlertTriangleIcon size={20} className="text-gray-400" />;
    }
  };

  return (
    <div
      className={`p-4 rounded-xl border flex items-center justify-between ${getBannerStyle()}`}
    >
      <div className="flex items-center gap-3">
        {getIcon()}
        <div>
          <p className="font-medium">{access.message}</p>
          {access.daysRemaining > 0 && (
            <p className="text-sm opacity-80">
              {access.daysRemaining} days remaining
            </p>
          )}
        </div>
      </div>

      {/* {access.canReactivate && (
        <button
          onClick={handleReactivate}
          disabled={isReactivating}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {isReactivating ? 'Reactivating...' : 'Reactivate'}
        </button>
      )} */}
    </div>
  );
}
