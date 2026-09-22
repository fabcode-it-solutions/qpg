"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils/utils";
import { SaveIcon, SpinnerIcon, CheckIcon, XIcon } from "@/components/icons";
import {
  UserProfile,
  ProfileSectionProps,
  MessageState,
} from "@/types/profile";
import {
  getCountryByCode,
  getCountryById,
  formatPhoneDisplay,
  type Country,
} from "@/lib/utils/countries";
import {
  profileValidationSchema,
  type ProfileFormData,
} from "@/lib/utils/validation";
import CountrySelect from "@/components/ui/CountrySelect";

export default function PersonalInfoSection({ userId }: ProfileSectionProps) {
  const { data: session, update } = useSession();
  const [profile, setProfile] = useState<UserProfile>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<MessageState | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [selectedCountry, setSelectedCountry] = useState<Country>(
    getCountryById("US")
  );

  const fetchProfile = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/profile/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile || {});
        // Set country from profile if available
        if (data.profile?.countryCode) {
          setSelectedCountry(getCountryById(data.profile.countryCode));
        }
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      setMessage({ type: "error", text: "Failed to load profile data" });
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSave = useCallback(async () => {
    if (!userId) return;

    setIsSaving(true);
    setMessage(null);
    setErrors({});

    try {
      // Validate with Zod
      const result = profileValidationSchema.safeParse(profile);
      if (!result.success) {
        const fieldErrors: { [key: string]: string } = {};
        result.error.issues.forEach((issue) => {
          if (issue.path[0]) {
            fieldErrors[issue.path[0] as string] = issue.message;
          }
        });
        setErrors(fieldErrors);
        setMessage({
          type: "error",
          text: "Please fix the validation errors below.",
        });
        return;
      }

      const response = await fetch(`/api/profile/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(result.data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update profile");
      }

      setMessage({ type: "success", text: "Profile updated successfully!" });

      // Update session if name changed
      if (profile.displayName || profile.firstName) {
        await update({
          name:
            profile.displayName ||
            `${profile.firstName || ""} ${profile.lastName || ""}`.trim(),
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Network error. Please try again.";
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setIsSaving(false);
    }
  }, [userId, profile, update]);

  const updateProfile = useCallback(
    (field: keyof UserProfile, value: any) => {
      setProfile((prev) => ({ ...prev, [field]: value }));
      // Clear error when user starts typing
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: "" }));
      }
    },
    [errors]
  );

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <SpinnerIcon size={48} className="text-(--color-gold) mx-auto mb-4" />
        <p className="text-white/70">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">
          Personal Information
        </h2>
        <p className="text-white/60">
          Update your personal details and profile information.
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

      <div className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              First Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={profile.firstName || ""}
              onChange={(e) => updateProfile("firstName", e.target.value)}
              className={cn(
                "w-full px-4 py-3 bg-white/5 border rounded-xl",
                "text-white placeholder-white/50 focus:outline-none",
                "transition-all duration-200",
                errors.firstName
                  ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                  : "border-white/20 focus:ring-2 focus:ring-[var(--color-gold)] focus:border-[var(--color-gold)]"
              )}
              placeholder="Enter your first name"
            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-400">{errors.firstName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Last Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={profile.lastName || ""}
              onChange={(e) => updateProfile("lastName", e.target.value)}
              className={cn(
                "w-full px-4 py-3 bg-white/5 border rounded-xl",
                "text-white placeholder-white/50 focus:outline-none",
                "transition-all duration-200",
                errors.lastName
                  ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                  : "border-white/20 focus:ring-2 focus:ring-[var(--color-gold)] focus:border-[var(--color-gold)]"
              )}
              placeholder="Enter your last name"
            />
            {errors.lastName && (
              <p className="mt-1 text-sm text-red-400">{errors.lastName}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Display Name
          </label>
          <input
            type="text"
            value={profile.displayName || ""}
            onChange={(e) => updateProfile("displayName", e.target.value)}
            className={cn(
              "w-full px-4 py-3 bg-white/5 border rounded-xl",
              "text-white placeholder-white/50 focus:outline-none",
              "transition-all duration-200",
              errors.displayName
                ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                : "border-white/20 focus:ring-2 focus:ring-[var(--color-gold)] focus:border-[var(--color-gold)]"
            )}
            placeholder="How would you like to be displayed?"
          />
          {errors.displayName && (
            <p className="mt-1 text-sm text-red-400">{errors.displayName}</p>
          )}
          <p className="text-xs text-white/50 mt-2">
            This name will be shown throughout the platform. If empty, we'll use
            your first and last name.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Email Address
          </label>
          <input
            type="email"
            value={session?.user?.email || ""}
            disabled
            className={cn(
              "w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl",
              "text-white/50 cursor-not-allowed"
            )}
          />
          <p className="text-xs text-white/50 mt-2">
            Email address cannot be changed. Contact support if you need to
            update this.
          </p>
        </div>

        {/* Additional Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Phone Number
            </label>
            <div className="flex gap-2">
              <CountrySelect
                value={selectedCountry.id}
                onChange={(country) => {
                  setSelectedCountry(country);
                  updateProfile("countryCode", country.id);
                }}
              />
              <input
                type="tel"
                value={profile.phone || ""}
                onChange={(e) => updateProfile("phone", e.target.value)}
                className={cn(
                  "flex-1 px-4 py-3 bg-white/5 border rounded-xl",
                  "text-white placeholder-white/50 focus:outline-none",
                  "transition-all duration-200",
                  errors.phone
                    ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                    : "border-white/20 focus:ring-2 focus:ring-[var(--color-gold)] focus:border-[var(--color-gold)]"
                )}
                placeholder="123 456 7890"
              />
            </div>
            {errors.phone && (
              <p className="mt-1 text-sm text-red-400">{errors.phone}</p>
            )}
            <p className="text-xs text-white/50 mt-1">
              Full number:{" "}
              {formatPhoneDisplay(selectedCountry, profile.phone || undefined)}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Location
            </label>
            <input
              type="text"
              value={profile.location || ""}
              onChange={(e) => updateProfile("location", e.target.value)}
              className={cn(
                "w-full px-4 py-3 bg-white/5 border rounded-xl",
                "text-white placeholder-white/50 focus:outline-none",
                "transition-all duration-200",
                errors.location
                  ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                  : "border-white/20 focus:ring-2 focus:ring-[var(--color-gold)] focus:border-[var(--color-gold)]"
              )}
              placeholder="City, Country"
            />
            {errors.location && (
              <p className="mt-1 text-sm text-red-400">{errors.location}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Website
          </label>
          <input
            type="url"
            value={profile.website || ""}
            onChange={(e) => updateProfile("website", e.target.value)}
            className={cn(
              "w-full px-4 py-3 bg-white/5 border rounded-xl",
              "text-white placeholder-white/50 focus:outline-none",
              "transition-all duration-200",
              errors.website
                ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                : "border-white/20 focus:ring-2 focus:ring-[var(--color-gold)] focus:border-[var(--color-gold)]"
            )}
            placeholder="https://your-website.com"
          />
          {errors.website && (
            <p className="mt-1 text-sm text-red-400">{errors.website}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Bio
          </label>
          <textarea
            value={profile.bio || ""}
            onChange={(e) => updateProfile("bio", e.target.value)}
            rows={4}
            className={cn(
              "w-full px-4 py-3 bg-white/5 border rounded-xl",
              "text-white placeholder-white/50 focus:outline-none",
              "transition-all duration-200 resize-none",
              errors.bio
                ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                : "border-white/20 focus:ring-2 focus:ring-[var(--color-gold)] focus:border-[var(--color-gold)]"
            )}
            placeholder="Tell us a bit about yourself..."
          />
          {errors.bio && (
            <p className="mt-1 text-sm text-red-400">{errors.bio}</p>
          )}
          <p className="text-xs text-white/50 mt-2">
            {profile.bio?.length || 0}/500 characters
          </p>
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
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
