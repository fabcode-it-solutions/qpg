"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils/utils";
import { XIcon, AlertTriangleIcon } from "@/components/icons";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  isLoading = false,
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: "text-red-400",
      confirmButton: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
      border: "border-red-500/30",
    },
    warning: {
      icon: "text-yellow-400",
      confirmButton: "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500",
      border: "border-yellow-500/30",
    },
    info: {
      icon: "text-blue-400",
      confirmButton: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
      border: "border-blue-500/30",
    },
  };

  const styles = variantStyles[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={cn(
          "relative w-full max-w-md bg-gray-900 border rounded-2xl shadow-2xl",
          styles.border
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <AlertTriangleIcon size={24} className={styles.icon} />
            <h3 className="text-lg font-semibold text-white">{title}</h3>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1 text-white/60 hover:text-white transition-colors disabled:opacity-50"
          >
            <XIcon size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-white/80 text-sm leading-relaxed">
            {message}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={onClose}
            disabled={isLoading}
            className={cn(
              "flex-1 px-4 py-2 text-sm font-medium text-white",
              "bg-white/10 border border-white/20 rounded-lg",
              "hover:bg-white/20 transition-all duration-200",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              "flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg",
              "transition-all duration-200 focus:outline-none focus:ring-2",
              "focus:ring-offset-2 focus:ring-offset-gray-900",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              styles.confirmButton
            )}
          >
            {isLoading ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}