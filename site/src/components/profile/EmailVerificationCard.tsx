"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils/utils";
import { CheckIcon, MailIcon, SpinnerIcon } from "@/components/icons";

export default function EmailVerificationCard() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // This would need to be updated to check if user's email is verified
  // For now, assuming unverified for demonstration
  const isEmailVerified = false; // This should come from session/user data

  const handleSendVerification = async () => {
    if (!session?.user?.email) return;

    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/auth/send-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Verification email sent! Please check your inbox.");
      } else {
        setError(data.error || "Failed to send verification email");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!session?.user?.email) {
    return null;
  }

  return (
    <div
      className={cn(
        "bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6",
        "shadow-lg"
      )}
    >
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          {isEmailVerified ? (
            <div className="w-12 h-12 bg-(--color-gold)/20 rounded-full flex items-center justify-center">
              <CheckIcon size={24} className="text-(--color-gold)" />
            </div>
          ) : (
            <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
              <MailIcon size={24} className="text-yellow-400" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-medium text-white mb-2">
            Email Verification
          </h3>

          {isEmailVerified ? (
            <div>
              <p className="text-sm text-gray-300 mb-2">
                Your email address{" "}
                <strong className="text-(--color-gold)">
                  {session.user.email}
                </strong>{" "}
                is verified.
              </p>
              <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-(--color-gold)/20 text-(--color-gold)">
                <CheckIcon size={14} className="mr-1" />
                Verified
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-300 mb-3">
                Your email address{" "}
                <strong className="text-white">{session.user.email}</strong> is
                not yet verified. Verify your email to secure your account and
                enable all features.
              </p>

              {message && (
                <div className="mb-3 p-3 bg-(--color-gold)/20 border border-(--color-gold)/50 rounded-lg">
                  <p className="text-sm text-(--color-gold)">{message}</p>
                </div>
              )}

              {error && (
                <div className="mb-3 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <button
                onClick={handleSendVerification}
                disabled={isLoading}
                className={cn(
                  "inline-flex items-center px-4 py-2 rounded-lg",
                  "text-sm font-medium transition-all duration-200",
                  "bg-(--color-gold) text-black hover:bg-(--color-gold)/90",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {isLoading ? (
                  <>
                    <SpinnerIcon size={16} className="mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <MailIcon size={16} className="mr-2" />
                    Send Verification Email
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
