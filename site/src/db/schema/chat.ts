import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";

// Chat session types
export const sessionTypeEnum = pgEnum("session_type", ["prospect", "customer"]);

// Message types
export const messageTypeEnum = pgEnum("message_type", [
  "user",
  "assistant",
  "system",
]);

// Unified chat messages table for both prospects and customers
export const chatMessages = pgTable(
  "chat_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    
    // User identification (prospect ID or authenticated user ID)
    userId: varchar("user_id", { length: 255 }).notNull(),
    userType: sessionTypeEnum("user_type").notNull(), // 'prospect' or 'customer'
    
    // Message content
    role: varchar("role", { length: 20 }).notNull(), // 'user', 'assistant', 'system'
    content: text("content").notNull(),
    
    // Message metadata
    metadata: text("metadata"), // JSON for follow-up questions, etc.
    
    // Session metadata (for prospects)
    sessionMetadata: text("session_metadata"), // JSON for user agent, IP, etc.
    
    // Audit fields
    timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_chat_messages_user_id").on(table.userId),
    index("idx_chat_messages_user_type").on(table.userType),
    index("idx_chat_messages_role").on(table.role),
    index("idx_chat_messages_timestamp").on(table.timestamp),
    index("idx_chat_messages_created_at").on(table.createdAt),
  ]
);

// Type exports
export type ChatMessage = typeof chatMessages.$inferSelect;
export type NewChatMessage = typeof chatMessages.$inferInsert;
