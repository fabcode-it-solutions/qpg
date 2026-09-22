import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./auth";

/**
 * Contact Submissions table - Store contact form submissions
 */
export const contactSubmissions = pgTable(
  "contactSubmissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // Form data
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    businessAddress: text("businessAddress"),
    subject: text("subject").notNull(),
    message: text("message").notNull(),

    // Status tracking
    status: text("status").default("new").notNull(), // new, read, replied, closed
    priority: text("priority").default("normal").notNull(), // low, normal, high, urgent

    // Optional user reference (if logged in)
    userId: uuid("userId").references(() => users.id, { onDelete: "set null" }),

    // Admin response
    adminResponse: text("adminResponse"),
    respondedBy: uuid("respondedBy").references(() => users.id, {
      onDelete: "set null",
    }),
    respondedAt: timestamp("respondedAt", { withTimezone: true }),

    // Metadata
    ipAddress: text("ipAddress"),
    userAgent: text("userAgent"),

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
    index("contact_submissions_email_idx").on(table.email),
    index("contact_submissions_status_idx").on(table.status),
    index("contact_submissions_priority_idx").on(table.priority),
    index("contact_submissions_user_idx").on(table.userId),
    index("contact_submissions_created_at_idx").on(table.createdAt),
  ]
);

/**
 * Database Relations
 */
export const contactSubmissionsRelations = relations(
  contactSubmissions,
  ({ one }) => ({
    user: one(users, {
      fields: [contactSubmissions.userId],
      references: [users.id],
    }),
    responder: one(users, {
      fields: [contactSubmissions.respondedBy],
      references: [users.id],
    }),
  })
);

// Export TypeScript types
export type ContactSubmission = typeof contactSubmissions.$inferSelect;
export type NewContactSubmission = typeof contactSubmissions.$inferInsert;
