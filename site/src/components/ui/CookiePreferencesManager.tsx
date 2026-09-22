"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils/utils";
import { Cookie, Save, RotateCcw } from "lucide-react";
import { useCookieConsent } from "@/hooks/useCookieConsent";

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
}

export default function CookiePreferencesManager() {
  const { preferences, updateConsent } = useCookieConsent();
  const [localPreferences, setLocalPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
    personalization: false,
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (preferences) {
      setLocalPreferences(preferences);
    }
  }, [preferences]);

  useEffect(() => {
    if (preferences) {
      const changed = JSON.stringify(localPreferences) !== JSON.stringify(preferences);
      setHasChanges(changed);
    }
  }, [localPreferences, preferences]);

  const handlePreferenceChange = (key: keyof CookiePreferences, value: boolean) => {
    if (key === "necessary") return; // Can't disable necessary cookies
    
    setLocalPreferences(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    // Simulate a brief delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));
    
    updateConsent(localPreferences);
    setIsSaving(false);
  };

  const handleReset = () => {
    if (preferences) {
      setLocalPreferences(preferences);
    }
  };

  const cookieTypes = [
    {
      key: "necessary" as keyof CookiePreferences,
      title: "Necessary Cookies",
      description: "Essential for basic site functionality and security",
      details: "These cookies are required for the website to function properly and cannot be disabled.",
      disabled: true
    },
    {
      key: "analytics" as keyof CookiePreferences,
      title: "Analytics Cookies",
      description: "Help us understand how you use our website",
      details: "These cookies collect anonymous information about your browsing behavior to help us improve our website.",
      disabled: false
    },
    {
      key: "marketing" as keyof CookiePreferences,
      title: "Marketing Cookies",
      description: "Used for advertising and promotional content",
      details: "These cookies track your activity to show you relevant advertisements and promotional content.",
      disabled: false
    },
    {
      key: "personalization" as keyof CookiePreferences,
      title: "Personalization Cookies",
      description: "Remember your preferences and customize your experience",
      details: "These cookies remember your settings and preferences to provide a personalized experience.",
      disabled: false
    }
  ];

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <Cookie className="h-6 w-6 text-amber-400" />
        <div>
          <h3 className="text-lg font-semibold text-white">Cookie Preferences</h3>
          <p className="text-sm text-white/60">Manage your cookie and privacy settings</p>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        {cookieTypes.map(({ key, title, description, details, disabled }) => (
          <div key={key} className="p-4 bg-white/5 rounded-lg border border-white/10">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h4 className="text-white font-medium mb-1">{title}</h4>
                <p className="text-sm text-white/70 mb-2">{description}</p>
                <p className="text-xs text-white/50">{details}</p>
              </div>
              
              <div className="ml-4">
                {disabled ? (
                  <div className="flex items-center">
                    <div className="h-5 w-5 bg-amber-500 rounded border flex items-center justify-center">
                      <div className="h-2 w-2 bg-black rounded-full" />
                    </div>
                    <span className="ml-2 text-xs text-white/60">Always active</span>
                  </div>
                ) : (
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localPreferences[key]}
                      onChange={(e) => handlePreferenceChange(key, e.target.checked)}
                      className="sr-only"
                    />
                    <div className={cn(
                      "w-11 h-6 rounded-full transition-colors duration-200",
                      localPreferences[key] ? "bg-amber-500" : "bg-white/20"
                    )}>
                      <div className={cn(
                        "h-5 w-5 bg-white rounded-full shadow-sm transition-transform duration-200 mt-0.5",
                        localPreferences[key] ? "translate-x-5 ml-0.5" : "translate-x-0 ml-0.5"
                      )} />
                    </div>
                  </label>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {hasChanges && (
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={cn(
              "flex items-center gap-2 px-4 py-2 bg-amber-500 text-black font-medium rounded-lg",
              "hover:bg-amber-400 transition-colors duration-200",
              "focus:outline-none focus:ring-2 focus:ring-amber-500/50",
              isSaving && "opacity-50 cursor-not-allowed"
            )}
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save Changes"}
          </button>

          <button
            onClick={handleReset}
            disabled={isSaving}
            className={cn(
              "flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/30 text-white font-medium rounded-lg",
              "hover:bg-white/20 transition-colors duration-200",
              "focus:outline-none focus:ring-2 focus:ring-white/50",
              isSaving && "opacity-50 cursor-not-allowed"
            )}
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <p className="text-sm text-blue-200">
          <strong>Note:</strong> Changes to cookie preferences will take effect immediately. 
          Some features may require a page refresh to fully apply new settings.
        </p>
      </div>
    </div>
  );
}