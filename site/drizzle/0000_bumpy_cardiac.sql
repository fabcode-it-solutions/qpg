CREATE TYPE "public"."access_level" AS ENUM('free', 'premium', 'vip', 'lifetime');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('succeeded', 'failed', 'pending', 'cancelled', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."payment_type" AS ENUM('subscription_create', 'subscription_renew', 'subscription_upgrade', 'subscription_downgrade', 'refund', 'partial_refund');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'inactive', 'expired', 'cancelled', 'pending', 'trial');--> statement-breakpoint
CREATE TABLE "accounts" (
	"userId" uuid NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	"providerData" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "accounts_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE "authorizeNetPaymentProfiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"customerProfileId" text NOT NULL,
	"paymentProfileId" text NOT NULL,
	"cardType" text,
	"cardLast4" text,
	"cardExpiryMonth" text,
	"cardExpiryYear" text,
	"billingFirstName" text,
	"billingLastName" text,
	"billingAddress" text,
	"billingCity" text,
	"billingState" text,
	"billingZip" text,
	"billingCountry" text DEFAULT 'US',
	"isDefault" boolean DEFAULT false NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "authorizeNetPaymentProfiles_paymentProfileId_unique" UNIQUE("paymentProfileId")
);
--> statement-breakpoint
CREATE TABLE "loginAttempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identifier" text NOT NULL,
	"ipAddress" text NOT NULL,
	"userAgent" text,
	"success" boolean NOT NULL,
	"provider" text,
	"failureReason" text,
	"attemptedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "passwordResetTokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	"used" boolean DEFAULT false NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"usedAt" timestamp with time zone,
	CONSTRAINT "passwordResetTokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "paymentTransactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"transactionId" text NOT NULL,
	"customerProfileId" text,
	"paymentProfileId" text,
	"authorizeNetSubscriptionId" text,
	"type" text NOT NULL,
	"status" text NOT NULL,
	"amount" text NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"paymentMethod" text,
	"cardLast4" text,
	"cardType" text,
	"description" text,
	"invoiceNumber" text,
	"orderNumber" text,
	"responseCode" text,
	"responseMessage" text,
	"authCode" text,
	"avsResultCode" text,
	"cvvResultCode" text,
	"refundedAmount" text DEFAULT '0',
	"refundTransactionId" text,
	"processedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "paymentTransactions_transactionId_unique" UNIQUE("transactionId")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" uuid NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"country" text,
	"city" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "userProfiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"firstName" text,
	"lastName" text,
	"displayName" text,
	"bio" text,
	"website" text,
	"location" text,
	"timezone" text DEFAULT 'UTC',
	"dateOfBirth" timestamp with time zone,
	"phone" text,
	"countryCode" text,
	"theme" text DEFAULT 'dark' NOT NULL,
	"language" text DEFAULT 'en' NOT NULL,
	"marketingEmails" boolean DEFAULT false NOT NULL,
	"notifications" boolean DEFAULT true NOT NULL,
	"socialLinks" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_profiles_user_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "userSecuritySettings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"twoFactorEnabled" boolean DEFAULT false NOT NULL,
	"twoFactorSecret" text,
	"backupCodes" text,
	"passwordChangedAt" timestamp with time zone,
	"lastPasswordReset" timestamp with time zone,
	"suspiciousActivityDetected" boolean DEFAULT false NOT NULL,
	"maxSessions" integer DEFAULT 5 NOT NULL,
	"sessionTimeoutMinutes" integer DEFAULT 60 NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_security_user_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "userSubscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"authorizeNetSubscriptionId" text NOT NULL,
	"customerProfileId" text NOT NULL,
	"paymentProfileId" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" text NOT NULL,
	"amount" text NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"intervalLength" integer NOT NULL,
	"intervalUnit" text NOT NULL,
	"totalOccurrences" integer,
	"trialOccurrences" integer DEFAULT 0,
	"startDate" timestamp with time zone NOT NULL,
	"endDate" timestamp with time zone,
	"nextPaymentDate" timestamp with time zone,
	"lastPaymentDate" timestamp with time zone,
	"cancelledAt" timestamp with time zone,
	"cancellationReason" text,
	"cancelledBy" text,
	"successfulPayments" integer DEFAULT 0,
	"failedPayments" integer DEFAULT 0,
	"totalPaid" text DEFAULT '0',
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "userSubscriptions_authorizeNetSubscriptionId_unique" UNIQUE("authorizeNetSubscriptionId")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"emailVerified" timestamp with time zone,
	"image" text,
	"password" text,
	"role" text DEFAULT 'user' NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"isEmailVerified" boolean DEFAULT false NOT NULL,
	"lastLoginAt" timestamp with time zone,
	"loginAttempts" integer DEFAULT 0 NOT NULL,
	"lockedUntil" timestamp with time zone,
	"authorizeNetCustomerProfileId" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verificationTokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	"type" text DEFAULT 'email_verification' NOT NULL,
	"used" boolean DEFAULT false NOT NULL,
	"userId" uuid,
	"metadata" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "verificationTokens_identifier_token_pk" PRIMARY KEY("identifier","token"),
	CONSTRAINT "verificationTokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "contactSubmissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"subject" text NOT NULL,
	"message" text NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"priority" text DEFAULT 'normal' NOT NULL,
	"userId" uuid,
	"adminResponse" text,
	"respondedBy" uuid,
	"respondedAt" timestamp with time zone,
	"ipAddress" text,
	"userAgent" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "authorizenet_webhook_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" varchar(255) NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"customer_profile_id" varchar(255),
	"subscription_id" varchar(255),
	"transaction_id" varchar(255),
	"event_data" text,
	"processed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "authorizenet_webhook_events_event_id_unique" UNIQUE("event_id")
);
--> statement-breakpoint
CREATE TABLE "course_enrollments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"total_watch_time" integer DEFAULT 0 NOT NULL,
	"videos_completed" integer DEFAULT 0 NOT NULL,
	"overall_progress" integer DEFAULT 0 NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp with time zone,
	"current_video_id" uuid,
	"last_accessed_at" timestamp with time zone DEFAULT now(),
	"enrolled_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "course_enrollments_user_course_unique" UNIQUE("user_id","course_id")
);
--> statement-breakpoint
CREATE TABLE "course_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"subscription_id" uuid NOT NULL,
	"status" "subscription_status" DEFAULT 'active' NOT NULL,
	"access_level" "access_level" DEFAULT 'premium' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now(),
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "course_subscriptions_user_course_unique" UNIQUE("user_id","course_id")
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" uuid PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"is_published" boolean DEFAULT true,
	"access_level" "access_level" DEFAULT 'premium',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "courses_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "learning_milestones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"course_id" uuid,
	"video_id" uuid,
	"type" varchar(50) NOT NULL,
	"percentage" integer NOT NULL,
	"metadata" text,
	"achieved_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "learning_milestones_user_video_type_unique" UNIQUE("user_id","video_id","type")
);
--> statement-breakpoint
CREATE TABLE "payment_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"authorizenet_transaction_id" varchar(255),
	"authorizenet_customer_profile_id" varchar(255),
	"authorizenet_subscription_id" varchar(255),
	"user_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"currency" varchar(3) DEFAULT 'usd' NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"video_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"watched_duration" integer DEFAULT 0 NOT NULL,
	"total_duration" integer,
	"progress_percentage" integer DEFAULT 0 NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp with time zone,
	"watch_count" integer DEFAULT 1 NOT NULL,
	"last_watched_at" timestamp with time zone DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "user_progress_user_video_unique" UNIQUE("user_id","video_id")
);
--> statement-breakpoint
CREATE TABLE "videos" (
	"id" uuid PRIMARY KEY NOT NULL,
	"course_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"order" integer DEFAULT 0,
	"is_published" boolean DEFAULT true,
	"is_free" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "videos_course_slug_unique" UNIQUE("course_id","slug")
);
--> statement-breakpoint
CREATE TABLE "protocols" (
	"id" serial PRIMARY KEY NOT NULL,
	"category" varchar(100) NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"embedding" vector(768),
	"tags" text[],
	"priority" integer DEFAULT 1,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "protocols_title_unique" UNIQUE("title")
);
--> statement-breakpoint
CREATE TABLE "suspicious_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"video_id" uuid,
	"activity_type" varchar(50) NOT NULL,
	"details" text,
	"resolved" timestamp with time zone,
	"timestamp" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "video_access_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"video_id" uuid NOT NULL,
	"course_id" uuid,
	"ip" varchar(45) NOT NULL,
	"user_agent" text NOT NULL,
	"action" varchar(50) NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_sessions" (
	"user_id" varchar(255) PRIMARY KEY NOT NULL,
	"messages" jsonb DEFAULT '[]',
	"conversation_embedding" vector(768),
	"last_active" timestamp with time zone DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "authorizeNetPaymentProfiles" ADD CONSTRAINT "authorizeNetPaymentProfiles_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "passwordResetTokens" ADD CONSTRAINT "passwordResetTokens_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paymentTransactions" ADD CONSTRAINT "paymentTransactions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "userProfiles" ADD CONSTRAINT "userProfiles_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "userSecuritySettings" ADD CONSTRAINT "userSecuritySettings_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "userSubscriptions" ADD CONSTRAINT "userSubscriptions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verificationTokens" ADD CONSTRAINT "verificationTokens_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contactSubmissions" ADD CONSTRAINT "contactSubmissions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contactSubmissions" ADD CONSTRAINT "contactSubmissions_respondedBy_users_id_fk" FOREIGN KEY ("respondedBy") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_current_video_id_videos_id_fk" FOREIGN KEY ("current_video_id") REFERENCES "public"."videos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_subscriptions" ADD CONSTRAINT "course_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_subscriptions" ADD CONSTRAINT "course_subscriptions_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_subscriptions" ADD CONSTRAINT "course_subscriptions_subscription_id_userSubscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."userSubscriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_milestones" ADD CONSTRAINT "learning_milestones_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_milestones" ADD CONSTRAINT "learning_milestones_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_milestones" ADD CONSTRAINT "learning_milestones_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_sessions" ADD CONSTRAINT "payment_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_sessions" ADD CONSTRAINT "payment_sessions_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "videos" ADD CONSTRAINT "videos_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suspicious_activities" ADD CONSTRAINT "suspicious_activities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suspicious_activities" ADD CONSTRAINT "suspicious_activities_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_access_logs" ADD CONSTRAINT "video_access_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_access_logs" ADD CONSTRAINT "video_access_logs_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "accounts_user_idx" ON "accounts" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "accounts_provider_idx" ON "accounts" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "authnet_payment_profiles_user_idx" ON "authorizeNetPaymentProfiles" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "authnet_payment_profiles_customer_idx" ON "authorizeNetPaymentProfiles" USING btree ("customerProfileId");--> statement-breakpoint
CREATE INDEX "authnet_payment_profiles_active_idx" ON "authorizeNetPaymentProfiles" USING btree ("isActive");--> statement-breakpoint
CREATE INDEX "login_attempts_identifier_idx" ON "loginAttempts" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "login_attempts_ip_idx" ON "loginAttempts" USING btree ("ipAddress");--> statement-breakpoint
CREATE INDEX "login_attempts_success_idx" ON "loginAttempts" USING btree ("success");--> statement-breakpoint
CREATE INDEX "login_attempts_attempted_at_idx" ON "loginAttempts" USING btree ("attemptedAt");--> statement-breakpoint
CREATE INDEX "password_reset_user_idx" ON "passwordResetTokens" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "password_reset_token_idx" ON "passwordResetTokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "password_reset_expires_idx" ON "passwordResetTokens" USING btree ("expires");--> statement-breakpoint
CREATE INDEX "password_reset_used_idx" ON "passwordResetTokens" USING btree ("used");--> statement-breakpoint
CREATE INDEX "payment_transactions_user_idx" ON "paymentTransactions" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "payment_transactions_status_idx" ON "paymentTransactions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payment_transactions_type_idx" ON "paymentTransactions" USING btree ("type");--> statement-breakpoint
CREATE INDEX "payment_transactions_authnet_subscription_idx" ON "paymentTransactions" USING btree ("authorizeNetSubscriptionId");--> statement-breakpoint
CREATE INDEX "payment_transactions_processed_at_idx" ON "paymentTransactions" USING btree ("processedAt");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "sessions_expires_idx" ON "sessions" USING btree ("expires");--> statement-breakpoint
CREATE INDEX "user_profiles_user_idx" ON "userProfiles" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "user_profiles_display_name_idx" ON "userProfiles" USING btree ("displayName");--> statement-breakpoint
CREATE INDEX "user_security_user_idx" ON "userSecuritySettings" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "user_security_2fa_idx" ON "userSecuritySettings" USING btree ("twoFactorEnabled");--> statement-breakpoint
CREATE INDEX "user_subscriptions_user_idx" ON "userSubscriptions" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "user_subscriptions_status_idx" ON "userSubscriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "user_subscriptions_next_payment_idx" ON "userSubscriptions" USING btree ("nextPaymentDate");--> statement-breakpoint
CREATE INDEX "user_subscriptions_customer_profile_idx" ON "userSubscriptions" USING btree ("customerProfileId");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_active_idx" ON "users" USING btree ("isActive");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "users_last_login_idx" ON "users" USING btree ("lastLoginAt");--> statement-breakpoint
CREATE INDEX "users_authnet_customer_idx" ON "users" USING btree ("authorizeNetCustomerProfileId");--> statement-breakpoint
CREATE INDEX "verification_tokens_type_idx" ON "verificationTokens" USING btree ("type");--> statement-breakpoint
CREATE INDEX "verification_tokens_user_idx" ON "verificationTokens" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "verification_tokens_expires_idx" ON "verificationTokens" USING btree ("expires");--> statement-breakpoint
CREATE INDEX "contact_submissions_email_idx" ON "contactSubmissions" USING btree ("email");--> statement-breakpoint
CREATE INDEX "contact_submissions_status_idx" ON "contactSubmissions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "contact_submissions_priority_idx" ON "contactSubmissions" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "contact_submissions_user_idx" ON "contactSubmissions" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "contact_submissions_created_at_idx" ON "contactSubmissions" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "idx_authnet_webhook_events_event_id" ON "authorizenet_webhook_events" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "idx_authnet_webhook_events_customer_profile" ON "authorizenet_webhook_events" USING btree ("customer_profile_id");--> statement-breakpoint
CREATE INDEX "idx_authnet_webhook_events_subscription" ON "authorizenet_webhook_events" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX "idx_authnet_webhook_events_transaction" ON "authorizenet_webhook_events" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "idx_authnet_webhook_events_processed" ON "authorizenet_webhook_events" USING btree ("processed");--> statement-breakpoint
CREATE INDEX "idx_authnet_webhook_events_created" ON "authorizenet_webhook_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_course_enrollments_user_id" ON "course_enrollments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_course_enrollments_course_id" ON "course_enrollments" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "idx_course_enrollments_is_completed" ON "course_enrollments" USING btree ("is_completed");--> statement-breakpoint
CREATE INDEX "idx_course_enrollments_overall_progress" ON "course_enrollments" USING btree ("overall_progress");--> statement-breakpoint
CREATE INDEX "idx_course_enrollments_last_accessed" ON "course_enrollments" USING btree ("last_accessed_at");--> statement-breakpoint
CREATE INDEX "idx_course_subscriptions_user_id" ON "course_subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_course_subscriptions_course_id" ON "course_subscriptions" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "idx_course_subscriptions_subscription_id" ON "course_subscriptions" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX "idx_course_subscriptions_status" ON "course_subscriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_courses_is_published" ON "courses" USING btree ("is_published");--> statement-breakpoint
CREATE INDEX "idx_courses_access_level" ON "courses" USING btree ("access_level");--> statement-breakpoint
CREATE INDEX "idx_courses_slug" ON "courses" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_courses_created_at" ON "courses" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_learning_milestones_user_id" ON "learning_milestones" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_learning_milestones_course_id" ON "learning_milestones" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "idx_learning_milestones_video_id" ON "learning_milestones" USING btree ("video_id");--> statement-breakpoint
CREATE INDEX "idx_learning_milestones_type" ON "learning_milestones" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_learning_milestones_achieved_at" ON "learning_milestones" USING btree ("achieved_at");--> statement-breakpoint
CREATE INDEX "idx_payment_sessions_authnet_transaction" ON "payment_sessions" USING btree ("authorizenet_transaction_id");--> statement-breakpoint
CREATE INDEX "idx_payment_sessions_authnet_customer" ON "payment_sessions" USING btree ("authorizenet_customer_profile_id");--> statement-breakpoint
CREATE INDEX "idx_payment_sessions_authnet_subscription" ON "payment_sessions" USING btree ("authorizenet_subscription_id");--> statement-breakpoint
CREATE INDEX "idx_payment_sessions_user_id" ON "payment_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_payment_sessions_course_id" ON "payment_sessions" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "idx_payment_sessions_status" ON "payment_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_user_progress_user_id" ON "user_progress" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_progress_video_id" ON "user_progress" USING btree ("video_id");--> statement-breakpoint
CREATE INDEX "idx_user_progress_course_id" ON "user_progress" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "idx_user_progress_is_completed" ON "user_progress" USING btree ("is_completed");--> statement-breakpoint
CREATE INDEX "idx_user_progress_progress_percentage" ON "user_progress" USING btree ("progress_percentage");--> statement-breakpoint
CREATE INDEX "idx_user_progress_last_watched" ON "user_progress" USING btree ("last_watched_at");--> statement-breakpoint
CREATE INDEX "idx_user_progress_user_course" ON "user_progress" USING btree ("user_id","course_id");--> statement-breakpoint
CREATE INDEX "idx_user_progress_user_completion" ON "user_progress" USING btree ("user_id","is_completed");--> statement-breakpoint
CREATE INDEX "idx_videos_course_id" ON "videos" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "idx_videos_is_published" ON "videos" USING btree ("is_published");--> statement-breakpoint
CREATE INDEX "idx_videos_is_free" ON "videos" USING btree ("is_free");--> statement-breakpoint
CREATE INDEX "idx_videos_order" ON "videos" USING btree ("order");--> statement-breakpoint
CREATE INDEX "idx_suspicious_activities_user_id" ON "suspicious_activities" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_suspicious_activities_timestamp" ON "suspicious_activities" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_suspicious_activities_type" ON "suspicious_activities" USING btree ("activity_type");--> statement-breakpoint
CREATE INDEX "idx_suspicious_activities_resolved" ON "suspicious_activities" USING btree ("resolved");--> statement-breakpoint
CREATE INDEX "idx_video_access_logs_user_id" ON "video_access_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_video_access_logs_video_id" ON "video_access_logs" USING btree ("video_id");--> statement-breakpoint
CREATE INDEX "idx_video_access_logs_timestamp" ON "video_access_logs" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_video_access_logs_ip" ON "video_access_logs" USING btree ("ip");--> statement-breakpoint
CREATE INDEX "idx_video_access_logs_action" ON "video_access_logs" USING btree ("action");