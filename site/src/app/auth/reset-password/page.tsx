"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils/utils";
import { CheckIcon, XIcon, SpinnerIcon, EyeIcon, EyeOffIcon } from "@/components/icons";

function ResetPasswordContent() {
  const [form, setForm] = useState({
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidatingToken, setIsValidatingToken] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  // Validate token on component mount
  useEffect(() => {
    if (!token) {
      setError("Invalid reset link. Please request a new password reset.");
      setIsValidatingToken(false);
      return;
    }

    validateToken(token);
  }, [token]);

  async function validateToken(token: string) {
    try {
      const response = await fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`, {
        method: "GET",
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        setIsTokenValid(true);
      } else {
        setError("This reset link has expired or is invalid. Please request a new password reset.");
      }
    } catch (err) {
      setError("Unable to validate reset link. Please try again.");
    } finally {
      setIsValidatingToken(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (form.password !== form.confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password: form.password,
          confirmPassword: form.confirmPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push("/auth/login?reset=success");
        }, 3000);
      } else {
        setError(data.error || "An error occurred. Please try again.");
      }
    } catch (err) {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }

  // Loading state while validating token
  if (isValidatingToken) {
    return (
      <div className="h-screen flex flex-col justify-center px-4 sm:px-6 lg:px-8 bg-black overflow-hidden">
        <div className="h-16 sm:h-20 md:h-24 lg:h-28 xl:h-32 2xl:h-36"></div>
        <div className="flex-1 flex flex-col justify-center sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <SpinnerIcon size={48} className="text-(--color-gold) mx-auto mb-4" />
            <p className="text-white/70">Validating reset link...</p>
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
              Password Reset
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
                <CheckIcon size={48} className="text-(--color-gold) mx-auto mb-4" />
                <h3 className="text-lg font-medium text-(--color-gold) mb-2">
                  Password updated!
                </h3>
                <p className="text-sm text-white/70 mb-6">
                  Your password has been successfully updated. You will be redirected to the login page shortly.
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
                  Continue to login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Invalid token or error state
  if (!isTokenValid || error) {
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
              Invalid Link
            </h2>
          </div>

          <div className="mt-4 sm:w-full sm:max-w-md sm:mx-auto">
            <div
              className={cn(
                "bg-white/10 backdrop-blur-sm py-8 px-6 sm:px-8",
                "border border-white/20 rounded-2xl shadow-xl"
              )}
            >
              <div className="rounded-xl bg-red-500/20 border border-red-500/50 p-6 text-center">
                <XIcon size={48} className="text-red-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-red-400 mb-2">
                  Link Expired
                </h3>
                <p className="text-sm text-white/70 mb-6">
                  {error || "This password reset link has expired or is invalid."}
                </p>
                <div className="space-y-3">
                  <Link
                    href="/auth/forgot-password"
                    className={cn(
                      "w-full inline-flex justify-center py-3 px-4",
                      "border border-transparent rounded-xl",
                      "text-black font-medium bg-(--color-gold)",
                      "hover:bg-(--color-gold)/90 transition-all duration-200",
                      "text-sm sm:text-base"
                    )}
                  >
                    Request new reset link
                  </Link>
                  <Link
                    href="/auth/login"
                    className="block text-sm text-(--color-gold) hover:text-(--color-gold)/80 transition-colors"
                  >
                    Back to login
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Reset password form
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
            Reset Password
          </h2>
          <p className="mt-2 text-center text-sm md:text-base text-white/70">
            Enter your new password below
          </p>
        </div>

        <div className="mt-4 sm:w-full sm:max-w-md sm:mx-auto">
          <div
            className={cn(
              "bg-white/10 backdrop-blur-sm py-6 px-6 sm:px-8",
              "border border-white/20 rounded-2xl shadow-xl"
            )}
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-white mb-2"
                >
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={form.password}
                    onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
                    className={cn(
                      "w-full px-4 py-3 pr-12 bg-white/5 border border-white/20",
                      "rounded-xl text-white placeholder-white/50",
                      "focus:outline-none focus:ring-2 focus:ring-(--color-gold)/50",
                      "focus:border-(--color-gold) transition-all duration-200",
                      "text-sm sm:text-base"
                    )}
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOffIcon size={20} className="text-white/50 hover:text-white/70" />
                    ) : (
                      <EyeIcon size={20} className="text-white/50 hover:text-white/70" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-white mb-2"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={form.confirmPassword}
                    onChange={(e) => setForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className={cn(
                      "w-full px-4 py-3 pr-12 bg-white/5 border border-white/20",
                      "rounded-xl text-white placeholder-white/50",
                      "focus:outline-none focus:ring-2 focus:ring-(--color-gold)/50",
                      "focus:border-(--color-gold) transition-all duration-200",
                      "text-sm sm:text-base"
                    )}
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOffIcon size={20} className="text-white/50 hover:text-white/70" />
                    ) : (
                      <EyeIcon size={20} className="text-white/50 hover:text-white/70" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-xl bg-red-500/20 border border-red-500/50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <XIcon size={20} className="text-red-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-400">
                        {error}
                      </h3>
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
                      <SpinnerIcon
                        size={20}
                        className="text-black -ml-1 mr-3"
                      />
                      Updating...
                    </div>
                  ) : (
                    "Update password"
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
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center">
          <SpinnerIcon size={48} className="text-(--color-gold) mx-auto mb-4" />
          <p className="text-white/70">Loading...</p>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}