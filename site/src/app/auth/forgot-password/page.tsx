"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils/utils";
import { CheckIcon, XIcon, SpinnerIcon } from "@/components/icons";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
      } else {
        setError(data.error || "An error occurred. Please try again.");
      }
    } catch (err) {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }

  if (isSuccess) {
    return (
      <>
        <div className="mb-8">
          <h2 className="text-center font-bold text-(--color-gold) uppercase text-2xl md:text-3xl lg:text-4xl">
            Check your email
          </h2>
        </div>

        <div
          className={cn(
            "bg-white/10 backdrop-blur-sm py-8 px-6 sm:px-8",
            "border border-white/20 rounded-2xl shadow-xl"
          )}
        >
          <div className="rounded-xl bg-(--color-gold)/20 border border-(--color-gold)/50 p-6 text-center">
            <CheckIcon size={48} className="text-(--color-gold) mx-auto mb-4" />
            <h3 className="text-lg font-medium text-(--color-gold) mb-2">
              Reset link sent!
            </h3>
            <p className="text-sm text-white/70 mb-6">
              If an account with <strong className="text-white">{email}</strong>{" "}
              exists, we've sent a password reset link to your email address.
            </p>
            <div className="space-y-3">
              <Link
                href="/auth/login"
                className={cn(
                  "w-full inline-flex justify-center py-3 px-4",
                  "border border-transparent rounded-xl",
                  "text-black font-medium bg-(--color-gold)",
                  "hover:bg-(--color-gold)/90 transition-all duration-200",
                  "text-sm sm:text-base"
                )}
              >
                Back to login
              </Link>
              <button
                onClick={() => {
                  setIsSuccess(false);
                  setEmail("");
                }}
                className="w-full text-sm text-(--color-gold) hover:text-(--color-gold)/80 transition-colors"
              >
                Send to a different email
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="mb-8">
        <h2 className="text-center font-bold text-(--color-gold) uppercase text-2xl md:text-3xl lg:text-4xl">
          Forgot Password
        </h2>
        <p className="mt-3 text-center text-sm md:text-base text-white/70">
          Enter your email address and we'll send you a reset link
        </p>
      </div>

      <div
        className={cn(
          "bg-white/10 backdrop-blur-sm py-6 px-6 sm:px-8",
          "border border-white/20 rounded-2xl shadow-xl"
        )}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-white mb-2"
            >
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={cn(
                "w-full px-4 py-3 bg-white/5 border border-white/20",
                "rounded-xl text-white placeholder-white/50",
                "focus:outline-none focus:ring-2 focus:ring-(--color-gold)/50",
                "focus:border-(--color-gold) transition-all duration-200",
                "text-sm sm:text-base"
              )}
              placeholder="Enter your email"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-500/20 border border-red-500/50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <XIcon size={20} className="text-red-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-400">{error}</h3>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                "w-full flex justify-center py-3 px-4",
                "border border-transparent rounded-xl",
                "text-black font-medium bg-(--color-gold)",
                "hover:bg-(--color-gold)/90 focus:outline-none",
                "focus:ring-4 focus:ring-(--color-gold)/30",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "transition-all duration-200",
                "text-sm sm:text-base md:text-lg lg:text-xl"
              )}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <SpinnerIcon size={20} className="text-black -ml-1 mr-3" />
                  Sending...
                </div>
              ) : (
                "Send reset link"
              )}
            </button>
          </div>

          <div className="text-center">
            <Link
              href="/auth/login"
              className="text-sm text-(--color-gold) hover:text-(--color-gold)/80 transition-colors"
            >
              Back to login
            </Link>
          </div>
        </form>
      </div>
    </>
  );
}
