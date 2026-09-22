"use client";

import { useState, useEffect } from "react";

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
}

const COOKIE_CONSENT_KEY = "qpg-cookie-consent";
const COOKIE_PREFERENCES_KEY = "qpg-cookie-preferences";

export function useCookieConsent() {
  const [hasConsent, setHasConsent] = useState<boolean | null>(null);
  const [preferences, setPreferences] = useState<CookiePreferences | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    const prefs = localStorage.getItem(COOKIE_PREFERENCES_KEY);

    setHasConsent(!!consent);
    setShowModal(!consent);

    if (prefs) {
      try {
        setPreferences(JSON.parse(prefs));
      } catch (error) {
        console.error("Failed to parse cookie preferences:", error);
        setPreferences(null);
      }
    }
  }, []);

  const updateConsent = (newPreferences: CookiePreferences) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "true");
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(newPreferences));
    
    setHasConsent(true);
    setPreferences(newPreferences);

    // Trigger analytics consent update if available
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("consent", "update", {
        analytics_storage: newPreferences.analytics ? "granted" : "denied",
        ad_storage: newPreferences.marketing ? "granted" : "denied",
        personalization_storage: newPreferences.personalization ? "granted" : "denied",
      });
    }
  };

  const revokeConsent = () => {
    localStorage.removeItem(COOKIE_CONSENT_KEY);
    localStorage.removeItem(COOKIE_PREFERENCES_KEY);
    
    setHasConsent(false);
    setPreferences(null);
  };

  const hideModal = () => {
    setShowModal(false);
  };

  return {
    hasConsent,
    preferences,
    showModal,
    updateConsent,
    revokeConsent,
    hideModal,
    canUseAnalytics: preferences?.analytics ?? false,
    canUseMarketing: preferences?.marketing ?? false,
    canUsePersonalization: preferences?.personalization ?? false,
  };
}

export default useCookieConsent;