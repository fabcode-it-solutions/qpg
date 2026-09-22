import { db } from "@/db";
import { userProfiles } from "@/db/schema/auth";
import { eq } from "drizzle-orm";
import {
  UserProfile,
  UserSettings,
  ProfileUpdateData,
  SettingsUpdateData,
} from "@/types/profile";

export class ProfileService {
  /**
   * Clean profile data by converting null to undefined for database insertion
   */
  private static cleanProfileData(data: any) {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== null && value !== undefined) {
        cleaned[key] = value;
      }
    }
    return cleaned;
  }
  /**
   * Get user profile by user ID
   */
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const profile = await db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.userId, userId))
        .limit(1);

      return profile[0] || null;
    } catch (error) {
      console.error("Profile fetch error:", error);
      throw new Error("Failed to fetch profile");
    }
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(
    userId: string,
    profileData: ProfileUpdateData
  ): Promise<boolean> {
    try {
      // Check if profile exists
      const existingProfile = await db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.userId, userId))
        .limit(1);

      if (existingProfile.length === 0) {
        // Create new profile
        const cleanData = this.cleanProfileData(profileData);
        await db.insert(userProfiles).values({
          userId: userId,
          ...cleanData,
          updatedAt: new Date(),
        });
      } else {
        // Update existing profile
        const cleanData = this.cleanProfileData(profileData);
        await db
          .update(userProfiles)
          .set({
            ...cleanData,
            updatedAt: new Date(),
          })
          .where(eq(userProfiles.userId, userId));
      }

      return true;
    } catch (error) {
      console.error("Profile update error:", error);
      throw new Error("Failed to update profile");
    }
  }

  /**
   * Get user settings
   */
  static async getUserSettings(userId: string): Promise<UserSettings> {
    try {
      const profile = await db
        .select({
          theme: userProfiles.theme,
          language: userProfiles.language,
          timezone: userProfiles.timezone,
          marketingEmails: userProfiles.marketingEmails,
          notifications: userProfiles.notifications,
        })
        .from(userProfiles)
        .where(eq(userProfiles.userId, userId))
        .limit(1);

      return (
        profile[0] || {
          theme: "dark",
          language: "en",
          timezone: "UTC",
          marketingEmails: false,
          notifications: true,
        }
      );
    } catch (error) {
      console.error("Settings fetch error:", error);
      throw new Error("Failed to fetch settings");
    }
  }

  /**
   * Update user settings
   */
  static async updateUserSettings(
    userId: string,
    settingsData: SettingsUpdateData
  ): Promise<boolean> {
    try {
      // Check if profile exists
      const existingProfile = await db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.userId, userId))
        .limit(1);

      if (existingProfile.length === 0) {
        // Create new profile with settings
        const cleanData = this.cleanProfileData(settingsData);
        await db.insert(userProfiles).values({
          userId: userId,
          ...cleanData,
          updatedAt: new Date(),
        });
      } else {
        // Update existing profile settings
        const cleanData = this.cleanProfileData(settingsData);
        await db
          .update(userProfiles)
          .set({
            ...cleanData,
            updatedAt: new Date(),
          })
          .where(eq(userProfiles.userId, userId));
      }

      return true;
    } catch (error) {
      console.error("Settings update error:", error);
      throw new Error("Failed to update settings");
    }
  }

  /**
   * Create initial profile for new user
   */
  static async createInitialProfile(
    userId: string,
    initialData?: Partial<UserProfile>
  ): Promise<UserProfile> {
    try {
      const [newProfile] = await db
        .insert(userProfiles)
        .values({
          userId: userId,
          theme: "dark",
          language: "en",
          timezone: "UTC",
          marketingEmails: false,
          notifications: true,
          firstName: initialData?.firstName || null,
          lastName: initialData?.lastName || null,
          displayName: initialData?.displayName || null,
          bio: initialData?.bio || null,
          website: initialData?.website || null,
          location: initialData?.location || null,
          phone: initialData?.phone || null,
          countryCode: initialData?.countryCode || null,
        })
        .returning();

      return newProfile;
    } catch (error) {
      console.error("Profile creation error:", error);
      throw new Error("Failed to create profile");
    }
  }

  /**
   * Delete user profile
   */
  static async deleteUserProfile(userId: string): Promise<boolean> {
    try {
      await db.delete(userProfiles).where(eq(userProfiles.userId, userId));

      return true;
    } catch (error) {
      console.error("Profile deletion error:", error);
      throw new Error("Failed to delete profile");
    }
  }

  /**
   * Check if user has profile
   */
  static async hasProfile(userId: string): Promise<boolean> {
    try {
      const profile = await db
        .select({ id: userProfiles.id })
        .from(userProfiles)
        .where(eq(userProfiles.userId, userId))
        .limit(1);

      return profile.length > 0;
    } catch (error) {
      console.error("Profile check error:", error);
      return false;
    }
  }
}
