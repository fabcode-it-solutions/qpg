"use client";
import { signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils/utils";
import Checkbox from "@/components/ui/Checkbox";
import { CheckIcon, XIcon, SpinnerIcon, EyeIcon, EyeOffIcon } from "@/components/icons";
import { useToastContext } from "@/components/providers/ToastProvider";
import SocialAuth from "./SocialAuth";
import AccountLinkingModal from "@/components/ui/AccountLinkingModal";
import type { AccountConflictInfo } from "@/lib/auth/account-linking";

export default function LoginForm() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [accountConflict, setAccountConflict] = useState<AccountConflictInfo | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { success } = useToastContext();

  useEffect(() => {
    // Check if user just registered successfully or password was reset or email verified
    if (searchParams.get("registered") === "true") {
      setShowSuccess(true);
    } else if (searchParams.get("reset") === "success") {
      setShowSuccess(true);
    } else if (searchParams.get("verified") === "true") {
      setShowSuccess(true);
    }

    // Load remembered email if available
    try {
      const rememberedEmail = localStorage.getItem("rememberedEmail");
      if (rememberedEmail) {
        setForm((prev) => ({ ...prev, email: rememberedEmail }));
        setRememberMe(true);
      }
    } catch (error) {
      // localStorage not available (SSR or restricted environment)
      console.warn("localStorage not available:", error);
    }
  }, [searchParams]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        ...form,
        redirect: false,
      });

      if (res?.ok) {
        // Handle remember me functionality
        try {
          if (rememberMe) {
            localStorage.setItem("rememberedEmail", form.email);
          } else {
            localStorage.removeItem("rememberedEmail");
          }
        } catch (error) {
          // localStorage not available
          console.warn("localStorage not available:", error);
        }

        // Show success toast
        success("Login Successful", "Welcome back! You have been signed in successfully.");
        
        // Redirect after a brief delay to show the toast
        setTimeout(() => {
          router.push("/");
        }, 1000);
      } else {
        // Check if this is an OAuth account trying to login with password
        if (res?.error === "CredentialsSignin") {
          try {
            const checkRes = await fetch('/api/auth/check-account', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: form.email })
            });
            
            if (checkRes.ok) {
              const data = await checkRes.json();
              if (data.conflict) {
                setAccountConflict(data.conflict);
                return;
              }
            }
          } catch (err) {
            // Fallback to generic error
          }
        }
        setError("Invalid email or password");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <div className="mb-6">
        <h2 className="text-center font-bold text-(--color-gold) uppercase text-2xl md:text-3xl lg:text-4xl">
          Sign in to your account
        </h2>
        <p className="mt-3 text-center text-sm md:text-base text-white/70">
          Don't have an account?{" "}
          <Link
            href="/auth/register"
            className="font-medium text-(--color-gold) hover:text-(--color-gold)/80 transition-colors"
          >
            Sign up
          </Link>
        </p>
      </div>
      {showSuccess && (
        <div className="rounded-xl bg-(--color-gold)/20 border border-(--color-gold)/50 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckIcon size={20} className="text-(--color-gold)" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-(--color-gold)">
                {searchParams.get("registered") === "true"
                  ? "Registration successful! You can now sign in with your credentials."
                  : searchParams.get("verified") === "true"
                  ? "Email verified successfully! Thank you for verifying your account."
                  : "Password reset successful! You can now sign in with your new password."}
              </p>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  type="button"
                  onClick={() => setShowSuccess(false)}
                  className="inline-flex rounded-md p-1.5 text-(--color-gold) hover:bg-(--color-gold)/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-(--color-gold)"
                >
                  <span className="sr-only">Dismiss</span>
                  <XIcon size={20} className="text-(--color-gold)" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className={cn(
              "block font-medium text-(--color-gold)",
              "text-sm md:text-base lg:text-lg"
            )}
          >
            Email address
          </label>
          <div className="mt-2">
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={cn(
                "appearance-none block w-full px-3 py-2.5",
                "bg-transparent border border-white/50 rounded-xl",
                "text-white placeholder-white/50",
                "focus:outline-none focus:ring-2 focus:ring-(--color-gold) focus:border-(--color-gold)",
                "transition-all duration-200",
                "text-sm md:text-base"
              )}
              placeholder="you@example.com"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="password"
            className={cn(
              "block font-medium text-(--color-gold)",
              "text-sm md:text-base lg:text-lg"
            )}
          >
            Password
          </label>
          <div className="mt-2 relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className={cn(
                "appearance-none block w-full px-3 py-2.5 pr-12",
                "bg-transparent border border-white/50 rounded-xl",
                "text-white placeholder-white/50",
                "focus:outline-none focus:ring-2 focus:ring-(--color-gold) focus:border-(--color-gold)",
                "transition-all duration-200",
                "text-sm md:text-base"
              )}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showPassword ? (
                <EyeOffIcon size={20} className="text-white/50 hover:text-white/70 transition-colors" />
              ) : (
                <EyeIcon size={20} className="text-white/50 hover:text-white/70 transition-colors" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Checkbox
            id="remember-me"
            name="remember-me"
            checked={rememberMe}
            onChange={setRememberMe}
            label="Remember me"
            size="md"
            variant="gold"
            className="!items-end"
          />

          <div className="text-sm">
            <Link
              href="/auth/forgot-password"
              className="font-medium text-(--color-gold) hover:text-(--color-gold)/80 transition-colors"
            >
              Forgot your password?
            </Link>
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-red-500/20 border border-red-500/50 p-4 mb-4">
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
                Signing in...
              </div>
            ) : (
              "Sign in"
            )}
          </button>
        </div>
      </form>

      <SocialAuth
        mode="login"
        callbackUrl="/"
        onError={(error) => setError(error)}
        className="mt-6"
      />

      <AccountLinkingModal
        isOpen={!!accountConflict}
        onClose={() => setAccountConflict(null)}
        email={accountConflict?.email || ""}
        provider={accountConflict?.existingProvider || ""}
      />
    </>
  );
}
