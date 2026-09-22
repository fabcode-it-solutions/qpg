/**
 * Utility functions for managing user consent data
 */

const AGE_VERIFICATION_KEY = "qpg-age-verified";
const COOKIE_CONSENT_KEY = "qpg-cookie-consent";
const COOKIE_PREFERENCES_KEY = "qpg-cookie-preferences";

export interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
}

/**
 * Clear all consent data (age verification and cookie preferences)
 * Useful for testing or when user wants to reset all preferences
 */
export const clearAllConsentData = (): void => {
  if (typeof window === "undefined") return;

  localStorage.removeItem(AGE_VERIFICATION_KEY);
  localStorage.removeItem(COOKIE_CONSENT_KEY);
  localStorage.removeItem(COOKIE_PREFERENCES_KEY);
};

/**
 * Get current age verification status
 */
export const getAgeVerificationStatus = (): boolean => {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem(AGE_VERIFICATION_KEY);
};

/**
 * Get current cookie consent status
 */
export const getCookieConsentStatus = (): boolean => {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem(COOKIE_CONSENT_KEY);
};

/**
 * Get current cookie preferences
 */
export const getCookiePreferences = (): CookiePreferences | null => {
  if (typeof window === "undefined") return null;
  
  const preferences = localStorage.getItem(COOKIE_PREFERENCES_KEY);
  if (!preferences) return null;
  
  try {
    return JSON.parse(preferences);
  } catch {
    return null;
  }
};

/**
 * Check if analytics cookies are allowed
 */
export const canUseAnalytics = (): boolean => {
  const preferences = getCookiePreferences();
  return preferences?.analytics ?? false;
};

/**
 * Check if marketing cookies are allowed
 */
export const canUseMarketing = (): boolean => {
  const preferences = getCookiePreferences();
  return preferences?.marketing ?? false;
};

/**
 * Check if personalization cookies are allowed
 */
export const canUsePersonalization = (): boolean => {
  const preferences = getCookiePreferences();
  return preferences?.personalization ?? false;
};

/**
 * Export consent data for user download (GDPR compliance)
 */
export const exportConsentData = (): string => {
  const data = {
    ageVerified: getAgeVerificationStatus(),
    cookieConsent: getCookieConsentStatus(),
    cookiePreferences: getCookiePreferences(),
    exportDate: new Date().toISOString(),
  };
  
  return JSON.stringify(data, null, 2);
};

/**
 * Constants for external use
 */
export const CONSENT_KEYS = {
  AGE_VERIFICATION: AGE_VERIFICATION_KEY,
  COOKIE_CONSENT: COOKIE_CONSENT_KEY,
  COOKIE_PREFERENCES: COOKIE_PREFERENCES_KEY,
} as const;