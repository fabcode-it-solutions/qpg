"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils/utils";
import { GoogleIcon, FacebookIcon, SpinnerIcon } from "@/components/icons";

export type SocialProvider = "google" | "facebook";

interface SocialAuthProps {
  /** Whether this is for login or registration flow */
  mode?: "login" | "register";
  /** Callback URL after successful authentication */
  callbackUrl?: string;
  /** Additional CSS classes */
  className?: string;
  /** Whether to show both providers or only specific ones */
  providers?: SocialProvider[];
  /** Loading state callback */
  onLoadingChange?: (loading: boolean) => void;
  /** Error callback */
  onError?: (error: string) => void;
}

interface SocialButtonProps {
  provider: SocialProvider;
  mode: "login" | "register";
  isLoading: boolean;
  onAuthStart: (provider: SocialProvider) => void;
  className?: string;
}

const PROVIDER_CONFIG = {
  google: {
    name: "Google",
    icon: GoogleIcon,
    bgColor: "bg-white/10",
    hoverColor: "hover:bg-white/20",
    textColor: "text-white",
  },
  facebook: {
    name: "Facebook",
    icon: FacebookIcon,
    bgColor: "bg-[#1877F2]/80",
    hoverColor: "hover:bg-[#1877F2]",
    textColor: "text-white",
  },
} as const;

const SocialButton: React.FC<SocialButtonProps> = ({
  provider,
  mode,
  isLoading,
  onAuthStart,
  className,
}) => {
  const config = PROVIDER_CONFIG[provider];
  const Icon = config.icon;
  const actionText = mode === "login" ? "Sign in" : "Sign up";

  const handleClick = () => {
    onAuthStart(provider);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      className={cn(
        "w-full inline-flex justify-center items-center py-3 px-4",
        "border border-white/50 rounded-xl",
        config.bgColor,
        config.hoverColor,
        "backdrop-blur-sm",
        config.textColor,
        "font-medium",
        "hover:border-(--color-gold)",
        "focus:outline-none focus:ring-2 focus:ring-(--color-gold)",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "transition-all duration-200",
        "text-sm md:text-base",
        className
      )}
      aria-label={`${actionText} with ${config.name}`}
    >
      {isLoading ? (
        <>
          <SpinnerIcon size={20} className="mr-2" />
          <span>Connecting...</span>
        </>
      ) : (
        <>
          <Icon size={20} className="mr-2" />
          <span>
            {actionText} with {config.name}
          </span>
        </>
      )}
    </button>
  );
};

const SocialAuth: React.FC<SocialAuthProps> = ({
  mode = "login",
  callbackUrl = "/",
  className,
  providers = ["google", "facebook"],
  onLoadingChange,
  onError,
}) => {
  const [loadingProvider, setLoadingProvider] = useState<SocialProvider | null>(
    null
  );
  const router = useRouter();

  const getErrorMessage = (provider: SocialProvider, isUnexpected = false) => {
    const providerName = PROVIDER_CONFIG[provider].name;
    const action = mode === "login" ? "sign in" : "sign up";
    return isUnexpected
      ? `An unexpected error occurred with ${providerName} authentication. Please try again.`
      : `Failed to ${action} with ${providerName}. Please try again.`;
  };

  const handleAuthStart = async (provider: SocialProvider) => {
    try {
      setLoadingProvider(provider);
      onLoadingChange?.(true);

      const result = await signIn(provider, {
        callbackUrl,
        redirect: false,
      });

      if (result?.error) {
        onError?.(getErrorMessage(provider));
      } else if (result?.ok) {
        router.push(callbackUrl);
      }
    } catch (error) {
      console.error(`${provider} auth error:`, error);
      onError?.(getErrorMessage(provider, true));
    } finally {
      setLoadingProvider(null);
      onLoadingChange?.(false);
    }
  };

  if (providers.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/20"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-black text-white/70">Or continue with</span>
        </div>
      </div>

      {/* Social Auth Buttons */}
      <div className="grid grid-cols-1 gap-3">
        {providers.map((provider) => (
          <SocialButton
            key={provider}
            provider={provider}
            mode={mode}
            isLoading={loadingProvider === provider}
            onAuthStart={handleAuthStart}
          />
        ))}
      </div>

      {/* Terms Notice for Registration */}
      {mode === "register" && (
        <>
          <p className="text-xs text-center text-white/60 mt-4 mb-1">
            By signing up with social media, you agree to our{" "}
          </p>
          <p className="text-xs text-center text-white/60">
            <a
              href="/terms"
              className="text-(--color-gold) hover:text-(--color-gold)/80 underline"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="/privacy"
              className="text-(--color-gold) hover:text-(--color-gold)/80 underline"
            >
              Privacy Policy
            </a>
          </p>
        </>
      )}
    </div>
  );
};

export default SocialAuth;
