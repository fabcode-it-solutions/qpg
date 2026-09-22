"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils/utils";
import { CheckIcon, XIcon, SpinnerIcon, MailIcon } from "@/components/icons";

function VerifyEmailContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    if (token) {
      // If there's a token in the URL, verify it automatically
      verifyEmailToken(token);
    } else {
      // Otherwise, show the general verification page
      const emailParam = searchParams.get("email");
      if (emailParam) {
        setEmail(decodeURIComponent(emailParam));
      }
    }
  }, [token, searchParams]);

  async function verifyEmailToken(token: string) {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/auth/verify-email?token=${encodeURIComponent(token)}`,
        {
          method: "GET",
        }
      );

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push("/auth/login?verified=true");
        }, 3000);
      } else {
        setError(data.error || "Invalid or expired verification link.");
      }
    } catch (err) {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function resendVerification() {
    if (!email) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/resend-verification", {
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
        setError(data.error || "Failed to resend verification email.");
      }
    } catch (err) {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }

  // Loading state while verifying token
  if (isLoading && token) {
    return (
      <div className="h-screen flex flex-col justify-center px-4 sm:px-6 lg:px-8 bg-black overflow-hidden">
        <div className="h-16 sm:h-20 md:h-24 lg:h-28 xl:h-32 2xl:h-36"></div>
        <div className="flex-1 flex flex-col justify-center sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <SpinnerIcon
              size={48}
              className="text-(--color-gold) mx-auto mb-4"
            />
            <p className="text-white/70">Verifying your email...</p>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="h-screen flex flex-col justify-center px-4 sm:px-6 lg:px-8 bg-black overflow-hidden">
        <div className="h-16 sm:h-20 md:h-24 lg:h-28 xl:h-32 2xl:h-36"></div>
        <div className="flex-1 flex flex-col justify-center sm:mx-auto sm:w-full sm:max-w-md">
          <div className="mb-6">
            <h2
              className={cn(
                "text-center font-bold text-(--color-gold) uppercase",
                "text-xl sm:text-2xl md:text-3xl lg:text-4xl"
              )}
            >
              {token ? "Email Verified!" : "Verification Sent!"}
            </h2>
          </div>

          <div className="mt-4 sm:w-full sm:max-w-md sm:mx-auto">
            <div
              className={cn(
                "bg-white/10 backdrop-blur-sm py-8 px-6 sm:px-8",
                "border border-white/20 rounded-2xl shadow-xl"
              )}
            >
              <div className="rounded-xl bg-(--color-gold)/20 border border-(--color-gold)/50 p-6 text-center">
                <CheckIcon
                  size={48}
                  className="text-(--color-gold) mx-auto mb-4"
                />
                <h3 className="text-lg font-medium text-(--color-gold) mb-2">
                  {token ? "Welcome to QPG!" : "Check Your Email"}
                </h3>
                <p className="text-sm text-white/70 mb-6">
                  {token
                    ? "Your email has been successfully verified. You can now sign in to your account."
                    : "A new verification email has been sent to your inbox."}
                </p>
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
                  {token ? "Continue to Login" : "Back to Login"}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state or main verification page
  return (
    <div className="h-screen flex flex-col justify-center px-4 sm:px-6 lg:px-8 bg-black overflow-hidden">
      <div className="h-16 sm:h-20 md:h-24 lg:h-28 xl:h-32 2xl:h-36"></div>

      <div className="flex-1 flex flex-col justify-center sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mb-6">
          <h2
            className={cn(
              "text-center font-bold text-(--color-gold) uppercase",
              "text-xl sm:text-2xl md:text-3xl lg:text-4xl"
            )}
          >
            Verify Your Email
          </h2>
          <p className="mt-2 text-center text-sm md:text-base text-white/70">
            {email
              ? `We'll send a verification link to ${email}`
              : "Enter your email to receive a verification link"}
          </p>
        </div>

        <div className="mt-4 sm:w-full sm:max-w-md sm:mx-auto">
          <div
            className={cn(
              "bg-white/10 backdrop-blur-sm py-6 px-6 sm:px-8",
              "border border-white/20 rounded-2xl shadow-xl"
            )}
          >
            {error ? (
              <div className="rounded-xl bg-red-500/20 border border-red-500/50 p-6 text-center mb-6">
                <XIcon size={48} className="text-red-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-red-400 mb-2">
                  Verification Failed
                </h3>
                <p className="text-sm text-white/70 mb-6">{error}</p>
                <div className="space-y-3">
                  <button
                    onClick={resendVerification}
                    disabled={isLoading || !email}
                    className={cn(
                      "w-full flex justify-center py-3 px-4",
                      "border border-transparent rounded-xl",
                      "text-black font-medium bg-(--color-gold)",
                      "hover:bg-(--color-gold)/90 transition-all duration-200",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      "text-sm sm:text-base"
                    )}
                  >
                    {isLoading ? "Sending..." : "Resend Verification"}
                  </button>
                  <Link
                    href="/auth/login"
                    className="block text-sm text-(--color-gold) hover:text-(--color-gold)/80 transition-colors"
                  >
                    Back to login
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <MailIcon
                  size={48}
                  className="text-(--color-gold) mx-auto mb-4"
                />
                <h3 className="text-lg font-medium text-(--color-gold) mb-2">
                  Check Your Email
                </h3>
                <p className="text-sm text-white/70 mb-6">
                  Click the verification link in your email to activate your
                  account.
                </p>

                <div className="space-y-4">
                  {email && (
                    <div className="space-y-3">
                      <p className="text-xs text-white/50">
                        Didn't receive the email?
                      </p>
                      <button
                        onClick={resendVerification}
                        disabled={isLoading}
                        className={cn(
                          "w-full flex justify-center py-3 px-4",
                          "border border-(--color-gold) text-(--color-gold) rounded-xl",
                          "hover:bg-(--color-gold)/10 transition-all duration-200",
                          "disabled:opacity-50 disabled:cursor-not-allowed",
                          "text-sm sm:text-base"
                        )}
                      >
                        {isLoading ? "Sending..." : "Resend Verification"}
                      </button>
                    </div>
                  )}

                  <div className="text-center pt-2">
                    <Link
                      href="/auth/login"
                      className="text-sm text-(--color-gold) hover:text-(--color-gold)/80 transition-colors"
                    >
                      Back to login
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex flex-col justify-center px-4 sm:px-6 lg:px-8 bg-black overflow-hidden">
          <div className="h-16 sm:h-20 md:h-24 lg:h-28 xl:h-32 2xl:h-36"></div>
          <div className="flex-1 flex flex-col justify-center sm:mx-auto sm:w-full sm:max-w-md">
            <div className="text-center">
              <SpinnerIcon size={48} className="text-(--color-gold) mx-auto mb-4" />
              <p className="text-white/70">Loading...</p>
            </div>
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
