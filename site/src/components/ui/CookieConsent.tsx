// Legacy cookie consent component - replaced by modal system
// Keeping utility functions for backward compatibility

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
}

const COOKIE_CONSENT_KEY = "qpg-cookie-consent";
const COOKIE_PREFERENCES_KEY = "qpg-cookie-preferences";

// This component is deprecated - use ConsentProvider instead
export default function CookieConsent() {
  return null;
}

// Utility functions for checking cookie consent
export const getCookieConsent = (): CookiePreferences | null => {
  if (typeof window === "undefined") return null;
  
  const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
  if (!consent) return null;
  
  const preferences = localStorage.getItem(COOKIE_PREFERENCES_KEY);
  if (!preferences) return null;
  
  try {
    return JSON.parse(preferences);
  } catch {
    return null;
  }
};

export const hasAnalyticsConsent = (): boolean => {
  const consent = getCookieConsent();
  return consent?.analytics ?? false;
};

export const hasMarketingConsent = (): boolean => {
  const consent = getCookieConsent();
  return consent?.marketing ?? false;
};

export const hasPersonalizationConsent = (): boolean => {
  const consent = getCookieConsent();
  return consent?.personalization ?? false;
};