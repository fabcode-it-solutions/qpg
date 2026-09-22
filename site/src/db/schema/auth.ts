import {
  pgTable,
  text,
  integer,
  timestamp,
  uuid,
  boolean,
  unique,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/**
 * Main Users table - Core user information
 * Updated existing 'users' table to be NextAuth compatible
 */
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name"),
    email: text("email").notNull().unique(),
    emailVerified: timestamp("emailVerified", {
      mode: "date",
      withTimezone: true,
    }),
    image: text("image"),
    phone: text("phone"), // Nullable for OAuth-only users

    // Credentials authentication
    password: text("password"), // Nullable for OAuth-only users

    // User status and security
    role: text("role").default("user").notNull(), // user, admin, moderator
    isActive: boolean("isActive").default(true).notNull(),
    isEmailVerified: boolean("isEmailVerified").default(false).notNull(),

    // Security tracking
    lastLoginAt: timestamp("lastLoginAt", { withTimezone: true }),
    loginAttempts: integer("loginAttempts").default(0).notNull(),
    lockedUntil: timestamp("lockedUntil", { withTimezone: true }),

    // Business fields
    authorizeNetCustomerProfileId: text("authorizeNetCustomerProfileId"),

    // Timestamps
    createdAt: timestamp("createdAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    // Indexes for performance
    index("users_email_idx").on(table.email),
    index("users_active_idx").on(table.isActive),
    index("users_role_idx").on(table.role),
    index("users_last_login_idx").on(table.lastLoginAt),
    index("users_authnet_customer_idx").on(table.authorizeNetCustomerProfileId),
  ]
);

/**
 * OAuth Accounts table - Social authentication providers
 * Updated existing 'accounts' table for NextAuth compatibility
 */
export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // oauth, email, credentials
    provider: text("provider").notNull(), // google, facebook, credentials
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),

    // Enhanced OAuth data
    providerData: text("providerData"), // JSON string for additional provider info

    // Timestamps
    createdAt: timestamp("createdAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    // Composite primary key as required by NextAuth
    primaryKey({
      columns: [table.provider, table.providerAccountId],
    }),
    // Indexes
    index("accounts_user_idx").on(table.userId),
    index("accounts_provider_idx").on(table.provider),
  ]
);

/**
 * User Sessions table - Active authentication sessions
 * Updated existing 'sessions' table for NextAuth compatibility
 */
export const sessions = pgTable(
  "sessions",
  {
    sessionToken: text("sessionToken").primaryKey(),
    userId: uuid("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp("expires", { withTimezone: true }).notNull(),

    // Enhanced session tracking
    ipAddress: text("ipAddress"),
    userAgent: text("userAgent"),
    country: text("country"),
    city: text("city"),

    // Timestamps
    createdAt: timestamp("createdAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    // Indexes
    index("sessions_user_idx").on(table.userId),
    index("sessions_expires_idx").on(table.expires),
  ]
);

/**
 * Verification Tokens - Email verification and password reset
 * Enhanced for comprehensive token management
 */
export const verificationTokens = pgTable(
  "verificationTokens",
  {
    identifier: text("identifier").notNull(), // email or user ID
    token: text("token").notNull().unique(),
    expires: timestamp("expires", { withTimezone: true }).notNull(),

    // Token types and management
    type: text("type").default("email_verification").notNull(), // email_verification, password_reset, magic_link
    used: boolean("used").default(false).notNull(),
    userId: uuid("userId").references(() => users.id, { onDelete: "cascade" }), // Optional user reference

    // Additional data
    metadata: text("metadata"), // JSON string for extra token data

    // Timestamps
    createdAt: timestamp("createdAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    // Composite primary key
    primaryKey({ columns: [table.identifier, table.token] }),
    // Indexes
    index("verification_tokens_type_idx").on(table.type),
    index("verification_tokens_user_idx").on(table.userId),
    index("verification_tokens_expires_idx").on(table.expires),
  ]
);

/**
 * Password Reset Tokens - Dedicated password reset management
 */
export const passwordResetTokens = pgTable(
  "passwordResetTokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expires: timestamp("expires", { withTimezone: true }).notNull(),
    used: boolean("used").default(false).notNull(),

    // Security tracking
    ipAddress: text("ipAddress"),
    userAgent: text("userAgent"),

    // Timestamps
    createdAt: timestamp("createdAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
    usedAt: timestamp("usedAt", { withTimezone: true }),
  },
  (table) => [
    // Indexes
    index("password_reset_user_idx").on(table.userId),
    index("password_reset_token_idx").on(table.token),
    index("password_reset_expires_idx").on(table.expires),
    index("password_reset_used_idx").on(table.used),
  ]
);

/**
 * User Profiles - Extended user information
 */
export const userProfiles = pgTable(
  "userProfiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // Personal information
    firstName: text("firstName"),
    lastName: text("lastName"),
    displayName: text("displayName"),
    bio: text("bio"),
    website: text("website"),
    location: text("location"),
    timezone: text("timezone").default("UTC"),
    dateOfBirth: timestamp("dateOfBirth", { withTimezone: true }),
    phone: text("phone"),
    countryCode: text("countryCode"),

    // Preferences
    theme: text("theme").default("dark").notNull(), // dark, light, auto
    language: text("language").default("en").notNull(),
    marketingEmails: boolean("marketingEmails").default(false).notNull(),
    notifications: boolean("notifications").default(true).notNull(),

    // Social links (JSON)
    socialLinks: text("socialLinks"), // {"twitter": "@username", "linkedin": "profile-url"}

    // Timestamps
    createdAt: timestamp("createdAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    // Unique constraint - one profile per user
    unique("user_profiles_user_unique").on(table.userId),
    // Indexes
    index("user_profiles_user_idx").on(table.userId),
    index("user_profiles_display_name_idx").on(table.displayName),
  ]
);

/**
 * User Security Settings - Security-related configurations
 */
export const userSecuritySettings = pgTable(
  "userSecuritySettings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // Two-factor authentication
    twoFactorEnabled: boolean("twoFactorEnabled").default(false).notNull(),
    twoFactorSecret: text("twoFactorSecret"), // TOTP secret
    backupCodes: text("backupCodes"), // JSON array of backup codes

    // Security events tracking
    passwordChangedAt: timestamp("passwordChangedAt", { withTimezone: true }),
    lastPasswordReset: timestamp("lastPasswordReset", { withTimezone: true }),
    suspiciousActivityDetected: boolean("suspiciousActivityDetected")
      .default(false)
      .notNull(),

    // Session management
    maxSessions: integer("maxSessions").default(5).notNull(),
    sessionTimeoutMinutes: integer("sessionTimeoutMinutes")
      .default(60)
      .notNull(),

    // Timestamps
    createdAt: timestamp("createdAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    // Unique constraint - one security record per user
    unique("user_security_user_unique").on(table.userId),
    // Indexes
    index("user_security_user_idx").on(table.userId),
    index("user_security_2fa_idx").on(table.twoFactorEnabled),
  ]
);

/**
 * Login Attempts - Track failed login attempts for security
 */
export const loginAttempts = pgTable(
  "loginAttempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    identifier: text("identifier").notNull(), // email or username
    ipAddress: text("ipAddress").notNull(),
    userAgent: text("userAgent"),
    success: boolean("success").notNull(),

    // Attempt details
    provider: text("provider"), // credentials, google, facebook
    failureReason: text("failureReason"), // invalid_password, user_not_found, account_locked

    // Timestamps
    attemptedAt: timestamp("attemptedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    // Indexes for security monitoring
    index("login_attempts_identifier_idx").on(table.identifier),
    index("login_attempts_ip_idx").on(table.ipAddress),
    index("login_attempts_success_idx").on(table.success),
    index("login_attempts_attempted_at_idx").on(table.attemptedAt),
  ]
);

/**
 * Authorize.net Customer Payment Profiles - Store payment methods
 */
export const authorizeNetPaymentProfiles = pgTable(
  "authorizeNetPaymentProfiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // Authorize.net identifiers
    customerProfileId: text("customerProfileId").notNull(),
    paymentProfileId: text("paymentProfileId").notNull().unique(),

    // Payment method details (masked/tokenized)
    cardType: text("cardType"), // visa, mastercard, amex, discover
    cardLast4: text("cardLast4"),
    cardExpiryMonth: text("cardExpiryMonth"),
    cardExpiryYear: text("cardExpiryYear"),

    // Billing information
    billingFirstName: text("billingFirstName"),
    billingLastName: text("billingLastName"),
    billingAddress: text("billingAddress"),
    billingCity: text("billingCity"),
    billingState: text("billingState"),
    billingZip: text("billingZip"),
    billingCountry: text("billingCountry").default("US"),

    // Status and metadata
    isDefault: boolean("isDefault").default(false).notNull(),
    isActive: boolean("isActive").default(true).notNull(),

    // Timestamps
    createdAt: timestamp("createdAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("authnet_payment_profiles_user_idx").on(table.userId),
    index("authnet_payment_profiles_customer_idx").on(table.customerProfileId),
    index("authnet_payment_profiles_active_idx").on(table.isActive),
  ]
);

/**
 * Payment Transactions - Complete transaction history (replaces paymentHistory)
 */
export const paymentTransactions = pgTable(
  "paymentTransactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // Authorize.net transaction details
    transactionId: text("transactionId").notNull().unique(),
    customerProfileId: text("customerProfileId"),
    paymentProfileId: text("paymentProfileId"),
    authorizeNetSubscriptionId: text("authorizeNetSubscriptionId"),

    // Transaction details
    type: text("type").notNull(), // subscription_create, subscription_renew, refund, void
    status: text("status").notNull(), // pending, completed, failed, cancelled, refunded
    amount: text("amount").notNull(), // Store as string to avoid floating point issues
    currency: text("currency").default("USD").notNull(),

    // Payment method used
    paymentMethod: text("paymentMethod"), // credit_card, bank_account
    cardLast4: text("cardLast4"),
    cardType: text("cardType"),

    // Transaction metadata
    description: text("description"),
    invoiceNumber: text("invoiceNumber"),
    orderNumber: text("orderNumber"),

    // Response details
    responseCode: text("responseCode"),
    responseMessage: text("responseMessage"),
    authCode: text("authCode"),
    avsResultCode: text("avsResultCode"),
    cvvResultCode: text("cvvResultCode"),

    // Refund information
    refundedAmount: text("refundedAmount").default("0"),
    refundTransactionId: text("refundTransactionId"),

    // Timestamps
    processedAt: timestamp("processedAt", { withTimezone: true }),
    createdAt: timestamp("createdAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("payment_transactions_user_idx").on(table.userId),
    index("payment_transactions_status_idx").on(table.status),
    index("payment_transactions_type_idx").on(table.type),
    index("payment_transactions_authnet_subscription_idx").on(
      table.authorizeNetSubscriptionId
    ),
    index("payment_transactions_processed_at_idx").on(table.processedAt),
  ]
);

/**
 * User Subscriptions - Track all user subscriptions with full history
 */
export const userSubscriptions = pgTable(
  "userSubscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // Authorize.net subscription details
    authorizeNetSubscriptionId: text("authorizeNetSubscriptionId")
      .notNull()
      .unique(),
    customerProfileId: text("customerProfileId").notNull(),
    paymentProfileId: text("paymentProfileId").notNull(),

    // Subscription details
    name: text("name").notNull(),
    description: text("description"),
    status: text("status").notNull(), // active, cancelled, suspended, expired, terminated

    // Pricing
    amount: text("amount").notNull(),
    currency: text("currency").default("USD").notNull(),

    // Schedule
    intervalLength: integer("intervalLength").notNull(), // 1, 2, 3, etc.
    intervalUnit: text("intervalUnit").notNull(), // days, months, years
    totalOccurrences: integer("totalOccurrences"), // null for unlimited
    trialOccurrences: integer("trialOccurrences").default(0),

    // Dates
    startDate: timestamp("startDate", { withTimezone: true }).notNull(),
    endDate: timestamp("endDate", { withTimezone: true }),
    nextPaymentDate: timestamp("nextPaymentDate", { withTimezone: true }),
    lastPaymentDate: timestamp("lastPaymentDate", { withTimezone: true }),

    // Cancellation details
    cancelledAt: timestamp("cancelledAt", { withTimezone: true }),
    cancellationReason: text("cancellationReason"),
    cancelledBy: text("cancelledBy"), // user, admin, system, payment_failure

    // Payment tracking
    successfulPayments: integer("successfulPayments").default(0),
    failedPayments: integer("failedPayments").default(0),
    totalPaid: text("totalPaid").default("0"),

    // Timestamps
    createdAt: timestamp("createdAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("user_subscriptions_user_idx").on(table.userId),
    index("user_subscriptions_status_idx").on(table.status),
    index("user_subscriptions_next_payment_idx").on(table.nextPaymentDate),
    index("user_subscriptions_customer_profile_idx").on(
      table.customerProfileId
    ),
  ]
);

/**
 * Database Relations
 */
export const usersRelations = relations(users, ({ many, one }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  profile: one(userProfiles, {
    fields: [users.id],
    references: [userProfiles.userId],
  }),
  security: one(userSecuritySettings, {
    fields: [users.id],
    references: [userSecuritySettings.userId],
  }),
  passwordResetTokens: many(passwordResetTokens),
  paymentProfiles: many(authorizeNetPaymentProfiles),
  transactions: many(paymentTransactions),
  subscriptions: many(userSubscriptions),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(users, {
    fields: [userProfiles.userId],
    references: [users.id],
  }),
}));

export const userSecuritySettingsRelations = relations(
  userSecuritySettings,
  ({ one }) => ({
    user: one(users, {
      fields: [userSecuritySettings.userId],
      references: [users.id],
    }),
  })
);

export const passwordResetTokensRelations = relations(
  passwordResetTokens,
  ({ one }) => ({
    user: one(users, {
      fields: [passwordResetTokens.userId],
      references: [users.id],
    }),
  })
);

export const authorizeNetPaymentProfilesRelations = relations(
  authorizeNetPaymentProfiles,
  ({ one }) => ({
    user: one(users, {
      fields: [authorizeNetPaymentProfiles.userId],
      references: [users.id],
    }),
  })
);

export const paymentTransactionsRelations = relations(
  paymentTransactions,
  ({ one }) => ({
    user: one(users, {
      fields: [paymentTransactions.userId],
      references: [users.id],
    }),
  })
);

export const userSubscriptionsRelations = relations(
  userSubscriptions,
  ({ one }) => ({
    user: one(users, {
      fields: [userSubscriptions.userId],
      references: [users.id],
    }),
  })
);

// Export TypeScript types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type VerificationToken = typeof verificationTokens.$inferSelect;
export type NewVerificationToken = typeof verificationTokens.$inferInsert;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type NewPasswordResetToken = typeof passwordResetTokens.$inferInsert;
export type UserProfile = typeof userProfiles.$inferSelect;
export type NewUserProfile = typeof userProfiles.$inferInsert;
export type UserSecuritySettings = typeof userSecuritySettings.$inferSelect;
export type NewUserSecuritySettings = typeof userSecuritySettings.$inferInsert;
export type LoginAttempt = typeof loginAttempts.$inferSelect;
export type NewLoginAttempt = typeof loginAttempts.$inferInsert;
export type AuthorizeNetPaymentProfile =
  typeof authorizeNetPaymentProfiles.$inferSelect;
export type NewAuthorizeNetPaymentProfile =
  typeof authorizeNetPaymentProfiles.$inferInsert;
export type PaymentTransaction = typeof paymentTransactions.$inferSelect;
export type NewPaymentTransaction = typeof paymentTransactions.$inferInsert;
export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type NewUserSubscription = typeof userSubscriptions.$inferInsert;
