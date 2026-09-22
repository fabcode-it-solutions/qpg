"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils/utils";
import { CheckIcon, XIcon, AlertIcon, InfoIcon } from "@/components/icons";

export type ToastType = "success" | "error" | "warning" | "info";

interface ToastProps {
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onClose: () => void;
  isVisible: boolean;
}

const toastConfig = {
  success: {
    icon: CheckIcon,
    bgColor: "bg-green-500/20",
    borderColor: "border-green-500/30",
    iconColor: "text-green-400",
    titleColor: "text-green-100",
  },
  error: {
    icon: XIcon,
    bgColor: "bg-red-500/20",
    borderColor: "border-red-500/30",
    iconColor: "text-red-400",
    titleColor: "text-red-100",
  },
  warning: {
    icon: AlertIcon,
    bgColor: "bg-amber-500/20",
    borderColor: "border-amber-500/30",
    iconColor: "text-amber-400",
    titleColor: "text-amber-100",
  },
  info: {
    icon: InfoIcon,
    bgColor: "bg-blue-500/20",
    borderColor: "border-blue-500/30",
    iconColor: "text-blue-400",
    titleColor: "text-blue-100",
  },
};

export default function Toast({
  type,
  title,
  message,
  duration = 4000,
  onClose,
  isVisible,
}: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);
  const config = toastConfig[type];
  const IconComponent = config.icon;

  useEffect(() => {
    if (!isVisible) return;

    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onClose, 300); // Wait for exit animation
    }, duration);

    return () => clearTimeout(timer);
  }, [isVisible, duration, onClose]);

  if (!isVisible && !isExiting) return null;

  return (
    <div
      className={cn(
        "fixed top-4 right-4 left-4 sm:left-auto z-[200] max-w-sm w-auto sm:w-full transform transition-all duration-300",
        isVisible && !isExiting
          ? "translate-x-0 opacity-100"
          : "translate-x-full opacity-0"
      )}
    >
      <div
        className={cn(
          "backdrop-blur-sm border rounded-xl p-3 sm:p-4 shadow-lg",
          config.bgColor,
          config.borderColor
        )}
      >
        <div className="flex items-start gap-2 sm:gap-3">
          <div className="flex-shrink-0">
            <IconComponent className={cn("h-5 w-5", config.iconColor)} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className={cn("font-medium text-sm", config.titleColor)}>
              {title}
            </h4>
            {message && (
              <p className="text-white/70 text-sm mt-1 leading-relaxed">
                {message}
              </p>
            )}
          </div>
          <button
            onClick={() => {
              setIsExiting(true);
              setTimeout(onClose, 300);
            }}
            className="flex-shrink-0 text-white/50 hover:text-white transition-colors"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
