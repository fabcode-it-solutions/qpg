"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils/utils";
import { X, Cookie, Settings, Check, Shield } from "lucide-react";

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
}

interface CookieConsentModalProps {
  isOpen: boolean;
  onAcceptAll: (preferences: CookiePreferences) => void;
  onAcceptSelected: (preferences: CookiePreferences) => void;
  onRejectAll: (preferences: CookiePreferences) => void;
}

export default function CookieConsentModal({
  isOpen,
  onAcceptAll,
  onAcceptSelected,
  onRejectAll,
}: CookieConsentModalProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
    personalization: false,
  });

  if (!isOpen) return null;

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      personalization: true,
    };
    onAcceptAll(allAccepted);
  };

  const handleAcceptSelected = () => {
    onAcceptSelected(preferences);
  };

  const handleRejectAll = () => {
    const onlyNecessary: CookiePreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
      personalization: false,
    };
    onRejectAll(onlyNecessary);
  };

  const handlePreferenceChange = (key: keyof CookiePreferences, value: boolean) => {
    if (key === "necessary") return;
    
    setPreferences(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl bg-black/95 border border-white/20 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-amber-500/20 rounded-full">
              <Cookie className="h-6 w-6 text-amber-400" />
            </div>
            
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-2">
                Cookie Preferences
              </h2>
              <p className="text-white/70 text-sm leading-relaxed">
                We use cookies to enhance your experience, analyze site usage, and personalize content. 
                Choose your preferences below or accept all cookies to continue.
              </p>
            </div>
          </div>

          <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-blue-100 mb-2">
                  <strong>Your Privacy Matters:</strong> We respect your privacy and are committed to protecting your personal data.
                </p>
                <p className="text-xs text-blue-200/80">
                  Learn more in our{" "}
                  <a 
                    href="/privacy-policy" 
                    className="text-amber-400 hover:text-amber-300 underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Privacy Policy
                  </a>
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-white font-medium">Necessary Cookies</h3>
                  <p className="text-xs text-white/60">Required for basic site functionality</p>
                </div>
                <div className="flex items-center">
                  <div className="h-5 w-5 bg-amber-500 rounded border flex items-center justify-center">
                    <Check className="h-3 w-3 text-black" />
                  </div>
                  <span className="ml-2 text-xs text-white/60">Always active</span>
                </div>
              </div>
              <p className="text-xs text-white/50">
                Essential cookies enable core functionality like security, network management, and accessibility.
              </p>
            </div>

            {[
              {
                key: "analytics" as keyof CookiePreferences,
                title: "Analytics Cookies",
                description: "Help us understand how visitors interact with our website",
                details: "These cookies collect information about how you use our website, such as which pages you visit most often."
              },
              {
                key: "marketing" as keyof CookiePreferences,
                title: "Marketing Cookies", 
                description: "Used to track visitors and display relevant ads",
                details: "These cookies are used to make advertising messages more relevant to you and your interests."
              },
              {
                key: "personalization" as keyof CookiePreferences,
                title: "Personalization Cookies",
                description: "Remember your preferences and personalize your experience",
                details: "These cookies remember choices you make to give you better functionality and personal features."
              }
            ].map(({ key, title, description, details }) => (
              <div key={key} className="p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-white font-medium">{title}</h3>
                    <p className="text-xs text-white/60">{description}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences[key]}
                      onChange={(e) => handlePreferenceChange(key, e.target.checked)}
                      className="sr-only"
                    />
                    <div className={cn(
                      "w-11 h-6 rounded-full transition-colors duration-200",
                      preferences[key] ? "bg-amber-500" : "bg-white/20"
                    )}>
                      <div className={cn(
                        "h-5 w-5 bg-white rounded-full shadow-sm transition-transform duration-200 mt-0.5",
                        preferences[key] ? "translate-x-5 ml-0.5" : "translate-x-0 ml-0.5"
                      )} />
                    </div>
                  </label>
                </div>
                <p className="text-xs text-white/50">{details}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleAcceptAll}
              className={cn(
                "flex-1 px-6 py-3 bg-amber-500 text-black font-medium rounded-xl",
                "hover:bg-amber-400 transition-colors duration-200",
                "focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              )}
            >
              Accept All Cookies
            </button>
            
            <button
              onClick={handleAcceptSelected}
              className={cn(
                "flex-1 px-6 py-3 bg-white/10 border border-white/30 text-white font-medium rounded-xl",
                "hover:bg-white/20 transition-colors duration-200",
                "focus:outline-none focus:ring-2 focus:ring-white/50"
              )}
            >
              Save My Preferences
            </button>

            <button
              onClick={handleRejectAll}
              className={cn(
                "flex-1 px-6 py-3 bg-transparent border border-white/50 text-white/70 font-medium rounded-xl",
                "hover:bg-white/5 transition-colors duration-200",
                "focus:outline-none focus:ring-2 focus:ring-white/50"
              )}
            >
              Reject All
            </button>
          </div>

          <p className="text-xs text-white/50 mt-6 text-center">
            You can change your cookie preferences at any time in your account settings.
          </p>
        </div>
      </div>
    </div>
  );
}