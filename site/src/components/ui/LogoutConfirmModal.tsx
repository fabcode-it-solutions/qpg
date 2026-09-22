"use client";

import React from "react";
import { cn } from "@/lib/utils/utils";
import { LogOutIcon, XIcon } from "@/components/icons";

interface LogoutConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  userName?: string;
}

export default function LogoutConfirmModal({
  isOpen,
  onConfirm,
  onCancel,
  userName,
}: LogoutConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4 bg-black/95 border border-white/20 rounded-2xl shadow-2xl">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/20 rounded-full">
                <LogOutIcon className="h-5 w-5 text-red-400" />
              </div>
              <h2 className="text-xl font-semibold text-white">
                Confirm Logout
              </h2>
            </div>
            <button
              onClick={onCancel}
              className="p-1 text-white/50 hover:text-white transition-colors"
            >
              <XIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="mb-6">
            <p className="text-white/80 leading-relaxed">
              {userName 
                ? `Are you sure you want to logout, ${userName}?`
                : "Are you sure you want to logout?"
              }
            </p>
            <p className="text-white/60 text-sm mt-2">
              You'll need to sign in again to access your account.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onConfirm}
              className={cn(
                "flex-1 px-4 py-3 bg-red-500 text-white font-medium rounded-xl",
                "hover:bg-red-600 transition-colors duration-200",
                "focus:outline-none focus:ring-2 focus:ring-red-500/50"
              )}
            >
              Yes, Logout
            </button>
            <button
              onClick={onCancel}
              className={cn(
                "flex-1 px-4 py-3 bg-white/10 border border-white/30 text-white font-medium rounded-xl",
                "hover:bg-white/20 transition-colors duration-200",
                "focus:outline-none focus:ring-2 focus:ring-white/50"
              )}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}