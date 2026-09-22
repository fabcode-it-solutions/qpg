"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils/utils";
import { SaveIcon, SpinnerIcon, CheckIcon, XIcon } from "@/components/icons";
import Checkbox from "@/components/ui/Checkbox";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import CookiePreferencesManager from "@/components/ui/CookiePreferencesManager";
import {
  UserSettings,
  ProfileSectionProps,
  MessageState,
} from "@/types/profile";

const timezones = [
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "Europe/London", label: "British Time (GMT/BST)" },
  { value: "Europe/Paris", label: "Central European Time (CET)" },
  { value: "Asia/Tokyo", label: "Japan Standard Time (JST)" },
  { value: "Asia/Shanghai", label: "China Standard Time (CST)" },
  { value: "Australia/Sydney", label: "Australian Eastern Time (AET)" },
];

const languages = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" },
  { value: "it", label: "Italiano" },
  { value: "pt", label: "Português" },
  { value: "ru", label: "Русский" },
  { value: "ja", label: "日本語" },
  { value: "ko", label: "한국어" },
  { value: "zh", label: "中文" },
];

export default function SettingsSection({ userId }: ProfileSectionProps) {
  const [settings, setSettings] = useState<UserSettings>({
    theme: "dark",
    language: "en",
    timezone: "UTC",
    marketingEmails: false,
    notifications: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<MessageState | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const router = useRouter();

  useEffect(() => {
    fetchSettings();
  }, [userId]);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`/api/profile/${userId}/settings`);
      if (response.ok) {
        const data = await response.json();
        setSettings((prev) => ({ ...prev, ...data.settings }));
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/profile/${userId}/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: "Settings updated successfully!" });
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to update settings",
        });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = (key: keyof UserSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/profile/${userId}/delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok) {
        // Account deleted successfully, sign out and redirect
        await signOut({ redirect: false });
        router.push("/");
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to delete account",
        });
        setShowDeleteModal(false);
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "Network error. Please try again.",
      });
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <SpinnerIcon size={48} className="text-(--color-gold) mx-auto mb-4" />
        <p className="text-white/70">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Account Settings</h2>
        <p className="text-white/60">
          Customize your account preferences and notification settings.
        </p>
      </div>

      {message && (
        <div
          className={cn(
            "mb-6 p-4 rounded-xl border flex items-start gap-3",
            message.type === "success"
              ? "bg-(--color-gold)/10 border-(--color-gold)/30"
              : "bg-red-500/10 border-red-500/30"
          )}
        >
          {message.type === "success" ? (
            <CheckIcon
              size={20}
              className="text-(--color-gold) mt-0.5 flex-shrink-0"
            />
          ) : (
            <XIcon size={20} className="text-red-400 mt-0.5 flex-shrink-0" />
          )}
          <p
            className={cn(
              "text-sm",
              message.type === "success"
                ? "text-(--color-gold)"
                : "text-red-400"
            )}
          >
            {message.text}
          </p>
        </div>
      )}

      <div className="space-y-8">
        {/* Appearance */}
        {/* <div>
          <h3 className="text-lg font-semibold text-white mb-4">Appearance</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Theme
              </label>
              <select
                value={settings.theme || "dark"}
                onChange={(e) => updateSetting("theme", e.target.value)}
                className={cn(
                  "w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl",
                  "text-white focus:outline-none focus:ring-2 focus:ring-(--color-gold)",
                  "focus:border-(--color-gold) transition-all duration-200"
                )}
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="auto">Auto (System)</option>
              </select>
              <p className="text-xs text-white/50 mt-2">
                Choose your preferred color scheme
              </p>
            </div>
          </div>
        </div> */}

        {/* Language & Region */}
        {/* <div>
          <h3 className="text-lg font-semibold text-white mb-4">
            Language & Region
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Language
              </label>
              <select
                value={settings.language || "en"}
                onChange={(e) => updateSetting("language", e.target.value)}
                className={cn(
                  "w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl",
                  "text-white focus:outline-none focus:ring-2 focus:ring-(--color-gold)",
                  "focus:border-(--color-gold) transition-all duration-200"
                )}
              >
                {languages.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Timezone
              </label>
              <select
                value={settings.timezone || "UTC"}
                onChange={(e) => updateSetting("timezone", e.target.value)}
                className={cn(
                  "w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl",
                  "text-white focus:outline-none focus:ring-2 focus:ring-(--color-gold)",
                  "focus:border-(--color-gold) transition-all duration-200"
                )}
              >
                {timezones.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div> */}

        {/* Notifications */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">
            Notifications
          </h3>
          <div className="space-y-4">
            <Checkbox
              id="notifications"
              name="notifications"
              checked={settings.notifications ?? true}
              onChange={(checked) => updateSetting("notifications", checked)}
              size="md"
              variant="gold"
              label="Email notifications"
            />
            <p className="text-xs text-white/50 ml-8">
              Receive important updates about your courses and account
            </p>

            <Checkbox
              id="marketingEmails"
              name="marketingEmails"
              checked={settings.marketingEmails ?? false}
              onChange={(checked) => updateSetting("marketingEmails", checked)}
              size="md"
              variant="gold"
              label="Marketing emails"
            />
            <p className="text-xs text-white/50 ml-8">
              Receive news, updates, and promotional content from QPG
            </p>
          </div>
        </div>

        {/* Cookie Preferences */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Cookie Preferences</h3>
          <CookiePreferencesManager />
        </div>

        {/* Privacy */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Privacy</h3>
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="space-y-4">
              {/* <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-sm font-medium text-white">
                    Data Export
                  </h4>
                  <p className="text-xs text-white/50 mt-1">
                    Download a copy of your data
                  </p>
                </div>
                <button className="px-4 py-2 text-sm font-medium text-(--color-gold) border border-(--color-gold) rounded-lg hover:bg-(--color-gold)/10 transition-all duration-200">
                  Request Export
                </button>
              </div> */}

              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-sm font-medium text-white">
                    Delete Account
                  </h4>
                  <p className="text-xs text-white/50 mt-1">
                    Permanently delete your account and all data
                  </p>
                </div>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="px-4 py-2 text-sm font-medium text-red-400 border border-red-400 rounded-lg hover:bg-red-500/10 transition-all duration-200"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-6 border-t border-white/10">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={cn(
              "flex items-center gap-2 px-6 py-3 bg-(--color-gold) text-black",
              "font-medium rounded-xl transition-all duration-200",
              "hover:bg-(--color-gold)/90 focus:outline-none focus:ring-2",
              "focus:ring-(--color-gold) focus:ring-offset-2 focus:ring-offset-black",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {isSaving ? (
              <>
                <SpinnerIcon size={20} className="text-black" />
                Saving...
              </>
            ) : (
              <>
                <SaveIcon size={20} />
                Save Settings
              </>
            )}
          </button>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Account"
        message={
          <div className="space-y-3">
            <p>
              Are you sure you want to delete your account? This action cannot
              be undone.
            </p>
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <p className="text-sm text-red-400 font-medium mb-2">
                This will:
              </p>
              <ul className="text-sm text-red-400 space-y-1 list-disc list-inside">
                <li>Cancel all active subscriptions</li>
                <li>Delete all your course progress</li>
                <li>Remove all personal data permanently</li>
                <li>Sign you out of all devices</li>
              </ul>
            </div>
          </div>
        }
        confirmText="Delete Account"
        cancelText="Keep Account"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
