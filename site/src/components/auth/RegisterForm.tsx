"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils/utils";
import Checkbox from "@/components/ui/Checkbox";
import { XIcon, SpinnerIcon, EyeIcon, EyeOffIcon } from "@/components/icons";
import SocialAuth from "./SocialAuth";
import AccountLinkingModal from "@/components/ui/AccountLinkingModal";
import type { AccountConflictInfo } from "@/lib/auth/account-linking";

export default function RegisterForm() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [accountConflict, setAccountConflict] = useState<AccountConflictInfo | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Validate terms acceptance
    if (!acceptTerms) {
      setError("Please accept the Terms and Conditions to continue");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        router.push("/auth/login?registered=true");
      } else {
        const data = await res.json();
        
        // Handle account conflict
        if (data.conflict) {
          setAccountConflict(data.conflict);
        } else {
          setError(data.error || "Registration failed");
        }
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <div className="mb-8">
        <h2 className="text-center font-bold text-(--color-gold) uppercase text-2xl md:text-3xl lg:text-4xl">
          Create your account
        </h2>
        <p className="mt-3 text-center text-sm md:text-base text-white/70">
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="font-medium text-(--color-gold) hover:text-(--color-gold)/80 transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className={cn(
              "block font-medium text-(--color-gold)",
              "text-sm md:text-base lg:text-lg"
            )}
          >
            Full Name
          </label>
          <div className="mt-2">
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={cn(
                "appearance-none block w-full px-3 py-2.5",
                "bg-transparent border border-white/50 rounded-xl",
                "text-white placeholder-white/50",
                "focus:outline-none focus:ring-2 focus:ring-(--color-gold) focus:border-(--color-gold)",
                "transition-all duration-200",
                "text-sm md:text-base"
              )}
              placeholder="John Doe"
            />
          </div>
        </div>

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
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
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
                  <EyeOffIcon
                    size={20}
                    className="text-white/50 hover:text-white/70 transition-colors"
                  />
                ) : (
                  <EyeIcon
                    size={20}
                    className="text-white/50 hover:text-white/70 transition-colors"
                  />
                )}
              </button>
            </div>
            <p className="mt-1 text-xs text-white/50">
              Must be at least 8 characters long
            </p>
          </div>
        </div>

        <div>
          <Checkbox
            id="terms"
            name="terms"
            checked={acceptTerms}
            onChange={setAcceptTerms}
            required={true}
            size="md"
            variant="gold"
            className="!items-end"
            label={
              <span>
                I agree to{" "}
                <Link
                  href="/terms"
                  className="text-(--color-gold) hover:text-(--color-gold)/80 underline"
                >
                  T&C
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  className="text-(--color-gold) hover:text-(--color-gold)/80 underline"
                >
                  Privacy Policy
                </Link>
              </span>
            }
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
                Creating account...
              </div>
            ) : (
              "Create account"
            )}
          </button>
        </div>
      </form>

      <SocialAuth
        mode="register"
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
