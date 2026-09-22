"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/utils";
import {
  SaveIcon,
  SpinnerIcon,
  CheckIcon,
  XIcon,
  EyeIcon,
  EyeOffIcon,
} from "@/components/icons";
import { ProfileSectionProps, MessageState } from "@/types/profile";

export default function PasswordSection({ userId }: ProfileSectionProps) {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<MessageState | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation checks
    if (form.newPassword.length < 8) {
      setMessage({
        type: "error",
        text: "New password must be at least 8 characters long",
      });
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match" });
      return;
    }

    if (form.currentPassword === form.newPassword) {
      setMessage({
        type: "error",
        text: "New password must be different from your current password",
      });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: "Password updated successfully!" });
        setForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to update password",
        });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">
          Security Settings
        </h2>
        <p className="text-white/60">
          Change your password to keep your account secure.
        </p>
      </div>

      {message && (
        <div
          className={cn(
            "mb-6 p-4 rounded-xl border flex items-start gap-3",
            message.type === "success"
              ? "bg-(--color-gold)/10 border-(--color-gold)/30"
              : "bg-red-500/10 border-red-500/30"
          )}
        >
          {message.type === "success" ? (
            <CheckIcon
              size={20}
              className="text-(--color-gold) mt-0.5 flex-shrink-0"
            />
          ) : (
            <XIcon size={20} className="text-red-400 mt-0.5 flex-shrink-0" />
          )}
          <p
            className={cn(
              "text-sm",
              message.type === "success"
                ? "text-(--color-gold)"
                : "text-red-400"
            )}
          >
            {message.text}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Current Password */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Current Password <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <input
              type={showPasswords.current ? "text" : "password"}
              value={form.currentPassword}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  currentPassword: e.target.value,
                }))
              }
              required
              autoComplete="current-password"
              className={cn(
                "w-full px-4 py-3 pr-12 bg-white/5 border border-white/20 rounded-xl",
                "text-white placeholder-white/50 focus:outline-none",
                "focus:ring-2 focus:ring-(--color-gold) focus:border-(--color-gold)",
                "transition-all duration-200",
                "[-webkit-autofill&]:[-webkit-box-shadow:0_0_0_1000px_rgba(255,255,255,0.05)_inset]",
                "[-webkit-autofill&]:[-webkit-text-fill-color:white]"
              )}
              placeholder="Enter your current password"
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility("current")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center z-10 bg-transparent"
            >
              {showPasswords.current ? (
                <EyeOffIcon
                  size={20}
                  className="text-white/70 hover:text-white transition-colors drop-shadow-sm"
                />
              ) : (
                <EyeIcon
                  size={20}
                  className="text-white/70 hover:text-white transition-colors drop-shadow-sm"
                />
              )}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            New Password <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <input
              type={showPasswords.new ? "text" : "password"}
              value={form.newPassword}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, newPassword: e.target.value }))
              }
              required
              minLength={8}
              autoComplete="new-password"
              className={cn(
                "w-full px-4 py-3 pr-12 bg-white/5 border border-white/20 rounded-xl",
                "text-white placeholder-white/50 focus:outline-none",
                "focus:ring-2 focus:ring-(--color-gold) focus:border-(--color-gold)",
                "transition-all duration-200",
                "[-webkit-autofill&]:[-webkit-box-shadow:0_0_0_1000px_rgba(255,255,255,0.05)_inset]",
                "[-webkit-autofill&]:[-webkit-text-fill-color:white]"
              )}
              placeholder="Enter your new password"
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility("new")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center z-10 bg-transparent"
            >
              {showPasswords.new ? (
                <EyeOffIcon
                  size={20}
                  className="text-white/70 hover:text-white transition-colors drop-shadow-sm"
                />
              ) : (
                <EyeIcon
                  size={20}
                  className="text-white/70 hover:text-white transition-colors drop-shadow-sm"
                />
              )}
            </button>
          </div>
          <p className="text-xs text-white/50 mt-2">
            Password must be at least 8 characters long
          </p>
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Confirm New Password <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <input
              type={showPasswords.confirm ? "text" : "password"}
              value={form.confirmPassword}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  confirmPassword: e.target.value,
                }))
              }
              required
              autoComplete="new-password"
              className={cn(
                "w-full px-4 py-3 pr-12 bg-white/5 border border-white/20 rounded-xl",
                "text-white placeholder-white/50 focus:outline-none",
                "focus:ring-2 focus:ring-(--color-gold) focus:border-(--color-gold)",
                "transition-all duration-200",
                "[-webkit-autofill&]:[-webkit-box-shadow:0_0_0_1000px_rgba(255,255,255,0.05)_inset]",
                "[-webkit-autofill&]:[-webkit-text-fill-color:black]"
              )}
              placeholder="Confirm your new password"
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility("confirm")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center z-10 bg-transparent"
            >
              {showPasswords.confirm ? (
                <EyeOffIcon
                  size={20}
                  className="text-white/70 hover:text-white transition-colors drop-shadow-sm"
                />
              ) : (
                <EyeIcon
                  size={20}
                  className="text-white/70 hover:text-white transition-colors drop-shadow-sm"
                />
              )}
            </button>
          </div>
        </div>

        {/* Password Requirements */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
          <h4 className="text-sm font-medium text-blue-400 mb-2">
            Password Requirements:
          </h4>
          <ul className="text-xs text-blue-300 space-y-1">
            <li>• At least 8 characters long</li>
            <li>• Must be different from your current password</li>
            <li>• Mix of uppercase and lowercase letters (recommended)</li>
            <li>• Include numbers and special characters (recommended)</li>
            <li>• Avoid common passwords or personal information</li>
          </ul>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-6 border-t border-white/10">
          <button
            type="submit"
            disabled={isLoading}
            className={cn(
              "flex items-center gap-2 px-6 py-3 bg-(--color-gold) text-black",
              "font-medium rounded-xl transition-all duration-200",
              "hover:bg-(--color-gold)/90 focus:outline-none focus:ring-2",
              "focus:ring-(--color-gold) focus:ring-offset-2 focus:ring-offset-black",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {isLoading ? (
              <>
                <SpinnerIcon size={20} className="text-black" />
                Updating...
              </>
            ) : (
              <>
                <SaveIcon size={20} />
                Update Password
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
