import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { videos } from "./courses";

export const videoAccessLogs = pgTable(
  "video_access_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    videoId: uuid("video_id")
      .notNull()
      .references(() => videos.id, { onDelete: "cascade" }),
    courseId: uuid("course_id"),
    ip: varchar("ip", { length: 45 }).notNull(),
    userAgent: text("user_agent").notNull(),
    action: varchar("action", { length: 50 }).notNull(), // token_generated, stream_started, stream_ended, segment_requested
    timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_video_access_logs_user_id").on(table.userId),
    index("idx_video_access_logs_video_id").on(table.videoId),
    index("idx_video_access_logs_timestamp").on(table.timestamp),
    index("idx_video_access_logs_ip").on(table.ip),
    index("idx_video_access_logs_action").on(table.action),
  ]
);

export const suspiciousActivities = pgTable(
  "suspicious_activities",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    videoId: uuid("video_id").references(() => videos.id, { onDelete: "cascade" }),
    activityType: varchar("activity_type", { length: 50 }).notNull(), // token_mismatch, rapid_location_change, concurrent_limit_exceeded
    details: text("details"),
    resolved: timestamp("resolved", { withTimezone: true }),
    timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_suspicious_activities_user_id").on(table.userId),
    index("idx_suspicious_activities_timestamp").on(table.timestamp),
    index("idx_suspicious_activities_type").on(table.activityType),
    index("idx_suspicious_activities_resolved").on(table.resolved),
  ]
);