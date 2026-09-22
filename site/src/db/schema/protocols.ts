import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  vector,
  integer,
} from "drizzle-orm/pg-core";

export const protocols = pgTable("protocols", {
  id: serial("id").primaryKey(),
  category: varchar("category", { length: 100 }).notNull(),
  title: varchar("title", { length: 255 }).notNull().unique(),
  content: text("content").notNull(),
  embedding: vector("embedding", { dimensions: 768 }),
  tags: text("tags").array(),
  priority: integer("priority").default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
