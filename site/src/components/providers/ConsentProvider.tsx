"use client";

import React, { useState, useEffect } from "react";
import AgeVerificationModal from "@/components/ui/AgeVerificationModal";
import CookieConsentModal from "@/components/ui/CookieConsentModal";
import AgeRestrictedPage from "@/components/ui/AgeRestrictedPage";
import { useAgeVerification } from "@/hooks/useAgeVerification";
import { useCookieConsent } from "@/hooks/useCookieConsent";

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
}

interface ConsentProviderProps {
  children: React.ReactNode;
}

export default function ConsentProvider({ children }: ConsentProviderProps) {
  const { isVerified, verifyAge } = useAgeVerification();
  const { hasConsent, showModal, updateConsent, hideModal } = useCookieConsent();
  const [showAgeRestricted, setShowAgeRestricted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Small delay to prevent flash of content
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const handleAgeVerification = () => {
    verifyAge();
  };

  const handleAgeRejection = () => {
    setShowAgeRestricted(true);
  };

  const handleCookieConsent = (preferences: CookiePreferences) => {
    updateConsent(preferences);
    hideModal();

    // Trigger analytics consent update if available
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("consent", "update", {
        analytics_storage: preferences.analytics ? "granted" : "denied",
        ad_storage: preferences.marketing ? "granted" : "denied",
        personalization_storage: preferences.personalization ? "granted" : "denied",
      });
    }
  };

  // Show loading state briefly
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  // Show age restricted page if user rejected age verification
  if (showAgeRestricted) {
    return <AgeRestrictedPage />;
  }

  // Show age verification modal if not verified
  if (isVerified === false || isVerified === null) {
    return (
      <>
        <div className="min-h-screen bg-black">
          {children}
        </div>
        <AgeVerificationModal
          isOpen={true}
          onVerify={handleAgeVerification}
          onReject={handleAgeRejection}
        />
      </>
    );
  }

  // Show cookie consent modal if age is verified but no cookie consent
  if (isVerified && !hasConsent && showModal) {
    return (
      <>
        <div className="min-h-screen bg-black">
          {children}
        </div>
        <CookieConsentModal
          isOpen={showModal}
          onAcceptAll={handleCookieConsent}
          onAcceptSelected={handleCookieConsent}
          onRejectAll={handleCookieConsent}
        />
      </>
    );
  }

  // Both age and cookie consent are handled, show the app
  return <>{children}</>;
}