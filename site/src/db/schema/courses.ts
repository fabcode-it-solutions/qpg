import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  decimal,
  integer,
  index,
  unique,
  pgEnum,
} from "drizzle-orm/pg-core";
import { users, userSubscriptions } from "./auth";

// Professional enums for type safety
export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "inactive",
  "expired",
  "cancelled",
  "pending",
  "pending_cancellation",
  "trial",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "succeeded",
  "failed",
  "pending",
  "cancelled",
  "refunded",
]);

export const paymentTypeEnum = pgEnum("payment_type", [
  "subscription_create",
  "subscription_renew",
  "subscription_upgrade",
  "subscription_downgrade",
  "refund",
  "partial_refund",
]);

export const accessLevelEnum = pgEnum("access_level", [
  "free",
  "premium",
  "vip",
  "lifetime",
]);

// Webhook events table for idempotency
export const authorizeNetWebhookEvents = pgTable(
  "authorizenet_webhook_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventId: varchar("event_id", { length: 255 }).notNull().unique(),
    eventType: varchar("event_type", { length: 100 }).notNull(),
    customerProfileId: varchar("customer_profile_id", { length: 255 }),
    subscriptionId: varchar("subscription_id", { length: 255 }),
    transactionId: varchar("transaction_id", { length: 255 }),
    eventData: text("event_data"),
    processed: boolean("processed").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_authnet_webhook_events_event_id").on(table.eventId),
    index("idx_authnet_webhook_events_customer_profile").on(table.customerProfileId),
    index("idx_authnet_webhook_events_subscription").on(table.subscriptionId),
    index("idx_authnet_webhook_events_transaction").on(table.transactionId),
    index("idx_authnet_webhook_events_processed").on(table.processed),
    index("idx_authnet_webhook_events_created").on(table.createdAt),
  ]
);

// Payment sessions table for transaction tracking
export const paymentSessions = pgTable(
  "payment_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    authorizeNetTransactionId: varchar("authorizenet_transaction_id", { length: 255 }),
    authorizeNetCustomerProfileId: varchar("authorizenet_customer_profile_id", { length: 255 }),
    authorizeNetSubscriptionId: varchar("authorizenet_subscription_id", { length: 255 }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(),
    currency: varchar("currency", { length: 3 }).notNull().default("usd"),
    status: varchar("status", { length: 50 }).notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_payment_sessions_authnet_transaction").on(table.authorizeNetTransactionId),
    index("idx_payment_sessions_authnet_customer").on(table.authorizeNetCustomerProfileId),
    index("idx_payment_sessions_authnet_subscription").on(table.authorizeNetSubscriptionId),
    index("idx_payment_sessions_user_id").on(table.userId),
    index("idx_payment_sessions_course_id").on(table.courseId),
    index("idx_payment_sessions_status").on(table.status),
  ]
);

export const courses = pgTable(
  "courses",
  {
    id: uuid("id").primaryKey(), // UUIDs from Sanity
    title: varchar("title", { length: 255 }).notNull(), // For reference only
    slug: varchar("slug", { length: 255 }).notNull().unique(), // For URL routing
    isPublished: boolean("is_published").default(true), // For access control
    accessLevel: accessLevelEnum("access_level").default("premium"), // Content access tier
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_courses_is_published").on(table.isPublished),
    index("idx_courses_access_level").on(table.accessLevel),
    index("idx_courses_slug").on(table.slug),
    index("idx_courses_created_at").on(table.createdAt),
  ]
);

// Videos table - minimal schema for progress tracking (content managed in Sanity)
export const videos = pgTable(
  "videos",
  {
    id: uuid("id").primaryKey(), // UUIDs from Sanity
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(), // For reference only
    slug: varchar("slug", { length: 255 }).notNull(), // For URL routing
    order: integer("order").default(0), // Video sequence in course
    isPublished: boolean("is_published").default(true), // For access control
    isFree: boolean("is_free").default(false), // Free preview videos
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_videos_course_id").on(table.courseId),
    index("idx_videos_is_published").on(table.isPublished),
    index("idx_videos_is_free").on(table.isFree),
    index("idx_videos_order").on(table.order),
    unique("videos_course_slug_unique").on(table.courseId, table.slug),
  ]
);

// Course subscriptions - links users to courses via subscriptions
export const courseSubscriptions = pgTable(
  "course_subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    subscriptionId: uuid("subscription_id")
      .notNull()
      .references(() => userSubscriptions.id), // References userSubscriptions from auth.ts

    // Access details
    status: subscriptionStatusEnum("status").notNull().default("active"),
    accessLevel: accessLevelEnum("access_level").notNull().default("premium"),

    // Timing
    startedAt: timestamp("started_at", { withTimezone: true }).defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),

    // Audit fields
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_course_subscriptions_user_id").on(table.userId),
    index("idx_course_subscriptions_course_id").on(table.courseId),
    index("idx_course_subscriptions_subscription_id").on(table.subscriptionId),
    index("idx_course_subscriptions_status").on(table.status),
    unique("course_subscriptions_user_course_unique").on(
      table.userId,
      table.courseId
    ),
  ]
);

// User progress - core functionality remains in database
export const userProgress = pgTable(
  "user_progress",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // Relationships
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    videoId: uuid("video_id")
      .notNull()
      .references(() => videos.id, { onDelete: "cascade" }),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),

    // Progress data
    watchedDuration: integer("watched_duration").default(0).notNull(),
    totalDuration: integer("total_duration"),
    progressPercentage: integer("progress_percentage").default(0).notNull(),
    isCompleted: boolean("is_completed").default(false).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),

    // Analytics
    watchCount: integer("watch_count").default(1).notNull(),
    lastWatchedAt: timestamp("last_watched_at", {
      withTimezone: true,
    }).defaultNow(),

    // Audit fields
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    // Performance indexes
    index("idx_user_progress_user_id").on(table.userId),
    index("idx_user_progress_video_id").on(table.videoId),
    index("idx_user_progress_course_id").on(table.courseId),
    index("idx_user_progress_is_completed").on(table.isCompleted),
    index("idx_user_progress_progress_percentage").on(table.progressPercentage),
    index("idx_user_progress_last_watched").on(table.lastWatchedAt),

    // Composite indexes for analytics
    index("idx_user_progress_user_course").on(table.userId, table.courseId),
    index("idx_user_progress_user_completion").on(
      table.userId,
      table.isCompleted
    ),

    // Business constraints
    unique("user_progress_user_video_unique").on(table.userId, table.videoId),
  ]
);



// Course enrollments - Learning journey tracking
export const courseEnrollments = pgTable(
  "course_enrollments",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // Relationships
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),

    // Learning analytics
    totalWatchTime: integer("total_watch_time").default(0).notNull(), // in seconds
    videosCompleted: integer("videos_completed").default(0).notNull(),
    overallProgress: integer("overall_progress").default(0).notNull(), // percentage
    isCompleted: boolean("is_completed").default(false).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),

    // Learning path
    currentVideoId: uuid("current_video_id").references(() => videos.id),
    lastAccessedAt: timestamp("last_accessed_at", {
      withTimezone: true,
    }).defaultNow(),

    // Audit fields
    enrolledAt: timestamp("enrolled_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    // Performance indexes
    index("idx_course_enrollments_user_id").on(table.userId),
    index("idx_course_enrollments_course_id").on(table.courseId),
    index("idx_course_enrollments_is_completed").on(table.isCompleted),
    index("idx_course_enrollments_overall_progress").on(table.overallProgress),
    index("idx_course_enrollments_last_accessed").on(table.lastAccessedAt),

    // Business constraints
    unique("course_enrollments_user_course_unique").on(
      table.userId,
      table.courseId
    ),
  ]
);

// Learning milestones - Gamification & Analytics
export const learningMilestones = pgTable(
  "learning_milestones",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // Relationships
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: uuid("course_id").references(() => courses.id, {
      onDelete: "cascade",
    }),
    videoId: uuid("video_id").references(() => videos.id, {
      onDelete: "cascade",
    }),

    // Milestone data
    type: varchar("type", { length: 50 }).notNull(), // "video_25", "video_50", "video_75", "video_complete", "course_complete"
    percentage: integer("percentage").notNull(),

    // Metadata
    metadata: text("metadata"), // JSON data for additional context

    // Timing
    achievedAt: timestamp("achieved_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    // Performance indexes
    index("idx_learning_milestones_user_id").on(table.userId),
    index("idx_learning_milestones_course_id").on(table.courseId),
    index("idx_learning_milestones_video_id").on(table.videoId),
    index("idx_learning_milestones_type").on(table.type),
    index("idx_learning_milestones_achieved_at").on(table.achievedAt),

    // Business constraints
    unique("learning_milestones_user_video_type_unique").on(
      table.userId,
      table.videoId,
      table.type
    ),
  ]
);

// Type exports for better TypeScript support
export type Course = typeof courses.$inferSelect;
export type NewCourse = typeof courses.$inferInsert;

export type Video = typeof videos.$inferSelect;
export type NewVideo = typeof videos.$inferInsert;

export type CourseSubscription = typeof courseSubscriptions.$inferSelect;
export type NewCourseSubscription = typeof courseSubscriptions.$inferInsert;

export type UserProgress = typeof userProgress.$inferSelect;
export type NewUserProgress = typeof userProgress.$inferInsert;



export type CourseEnrollment = typeof courseEnrollments.$inferSelect;
export type NewCourseEnrollment = typeof courseEnrollments.$inferInsert;

export type LearningMilestone = typeof learningMilestones.$inferSelect;
export type NewLearningMilestone = typeof learningMilestones.$inferInsert;

export type AuthorizeNetWebhookEvent = typeof authorizeNetWebhookEvents.$inferSelect;
export type NewAuthorizeNetWebhookEvent = typeof authorizeNetWebhookEvents.$inferInsert;

export type PaymentSession = typeof paymentSessions.$inferSelect;
export type NewPaymentSession = typeof paymentSessions.$inferInsert;
