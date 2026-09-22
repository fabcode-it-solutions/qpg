import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  jsonb,
  vector,
} from "drizzle-orm/pg-core";

export const userSessions = pgTable("user_sessions", {
  userId: varchar("user_id", { length: 255 }).primaryKey(),
  messages: jsonb("messages").default("[]"),
  conversationEmbedding: vector("conversation_embedding", { dimensions: 768 }),
  lastActive: timestamp("last_active", { withTimezone: true }).defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
