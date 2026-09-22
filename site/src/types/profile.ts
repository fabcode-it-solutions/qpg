import { z } from "zod";

// Profile Data Types
export interface UserProfile {
  id?: string;
  userId?: string;
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  email?: string | null;
  bio?: string | null;
  website?: string | null;
  location?: string | null;
  phone?: string | null;
  countryCode?: string | null;
  timezone?: string | null;
  theme?: "dark" | "light" | "auto" | string | null;
  language?: string | null;
  marketingEmails?: boolean | null;
  notifications?: boolean | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserSettings {
  theme?: "dark" | "light" | "auto" | string | null;
  language?: string | null;
  timezone?: string | null;
  marketingEmails?: boolean | null;
  notifications?: boolean | null;
}

// Subscription Types
export interface UserSubscription {
  id: string;
  courseId?: string | null; // Not in DB schema anymore
  courseName: string; // Derived from name field
  type: string; // Derived field
  status: "active" | "cancelled" | "suspended" | "expired" | "terminated";
  price: string; // Maps to amount field
  currency: string;
  startedAt: string; // Maps to startDate
  expiresAt?: string; // Maps to endDate
  trialEndsAt?: string; // Not in current schema
  canceledAt?: string; // Maps to cancelledAt
  cancelReason?: string | null; // Maps to cancellationReason
  stripeSubscriptionId?: string | null; // Keep for backward compatibility
  authorizeNetSubscriptionId: string; // Required in new schema
  // Additional fields from DB schema
  name?: string;
  description?: string;
  customerProfileId?: string;
  paymentProfileId?: string;
  intervalLength?: number;
  intervalUnit?: string;
  nextPaymentDate?: string;
  lastPaymentDate?: string;
  cancelledBy?: string;
  successfulPayments?: number;
  failedPayments?: number;
  totalPaid?: string;
}

export interface PaymentHistoryItem {
  id: string;
  courseId?: string | null;
  courseName: string;
  type: string;
  status: string;
  amount: string;
  currency?: string;
  description: string;
  paidAt: string;
  receiptUrl?: string | null;
  transactionId?: string;
}

// API Response Types
export interface ProfileResponse {
  success: boolean;
  profile?: UserProfile | null;
  error?: string;
}

export interface SettingsResponse {
  success: boolean;
  settings?: UserSettings;
  error?: string;
}

export interface SubscriptionsResponse {
  success: boolean;
  subscriptions?: UserSubscription[];
  error?: string;
}

export interface PaymentHistoryResponse {
  success: boolean;
  payments?: PaymentHistoryItem[];
  error?: string;
}

export interface ApiResponse {
  success: boolean;
  message?: string;
  error?: string;
  details?: any;
}

// Validation Schemas
export const profileUpdateSchema = z.object({
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  displayName: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  website: z.string().url().nullable().optional().or(z.literal("")),
  location: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  countryCode: z.string().nullable().optional(),
  timezone: z.string().nullable().optional(),
  theme: z.enum(["dark", "light", "auto"]).nullable().optional(),
  language: z.string().nullable().optional(),
  marketingEmails: z.boolean().nullable().optional(),
  notifications: z.boolean().nullable().optional(),
});

export const settingsUpdateSchema = z.object({
  theme: z.enum(["dark", "light", "auto"]).nullable().optional(),
  language: z.string().nullable().optional(),
  timezone: z.string().nullable().optional(),
  marketingEmails: z.boolean().nullable().optional(),
  notifications: z.boolean().nullable().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

// Form Types
export type ProfileUpdateData = z.infer<typeof profileUpdateSchema>;
export type SettingsUpdateData = z.infer<typeof settingsUpdateSchema>;
export type ChangePasswordData = z.infer<typeof changePasswordSchema>;

// Component Props Types
export interface ProfileSectionProps {
  userId: string;
}

export interface MessageState {
  type: "success" | "error";
  text: string;
}

// Status Configuration Types
export interface StatusConfig {
  [key: string]: {
    color: string;
    bg: string;
    label: string;
  };
}

export interface TypeConfig {
  [key: string]: string;
}
