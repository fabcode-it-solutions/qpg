CREATE TYPE "public"."message_type" AS ENUM('user', 'assistant', 'system');--> statement-breakpoint
CREATE TYPE "public"."session_type" AS ENUM('prospect', 'customer');--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"user_type" "session_type" NOT NULL,
	"role" varchar(20) NOT NULL,
	"content" text NOT NULL,
	"metadata" text,
	"session_metadata" text,
	"timestamp" timestamp with time zone DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX "idx_chat_messages_user_id" ON "chat_messages" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_chat_messages_user_type" ON "chat_messages" USING btree ("user_type");--> statement-breakpoint
CREATE INDEX "idx_chat_messages_role" ON "chat_messages" USING btree ("role");--> statement-breakpoint
CREATE INDEX "idx_chat_messages_timestamp" ON "chat_messages" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_chat_messages_created_at" ON "chat_messages" USING btree ("created_at");