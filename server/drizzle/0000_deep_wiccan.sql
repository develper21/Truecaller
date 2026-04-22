CREATE TYPE "public"."call_type" AS ENUM('incoming', 'outgoing', 'missed', 'spam');--> statement-breakpoint
CREATE TYPE "public"."report_category" AS ENUM('telemarketer', 'fraud', 'insurance', 'loan', 'political', 'other');--> statement-breakpoint
CREATE TYPE "public"."risk_score" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."trust_level" AS ENUM('verified', 'trusted', 'neutral', 'risky', 'spam');--> statement-breakpoint
CREATE TYPE "public"."verification_tier" AS ENUM('gold', 'silver', 'bronze');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"action" varchar(50) NOT NULL,
	"entity" varchar(50),
	"entity_id" integer,
	"details" jsonb,
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "blocked_numbers" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"phone_number_id" integer,
	"blocked_at" timestamp DEFAULT now(),
	"reason" varchar(50),
	"block_type" varchar(20) DEFAULT 'manual'
);
--> statement-breakpoint
CREATE TABLE "business_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"phone_number_id" integer,
	"company_name" varchar(100) NOT NULL,
	"legal_name" varchar(100),
	"registration_number" varchar(50),
	"tax_id" varchar(50),
	"business_type" varchar(50),
	"category" varchar(50),
	"sub_category" varchar(50),
	"description" text,
	"website" varchar(255),
	"email" varchar(255),
	"logo_url" text,
	"cover_image_url" text,
	"address" text,
	"city" varchar(100),
	"state" varchar(100),
	"country" varchar(2),
	"postal_code" varchar(20),
	"working_hours" jsonb,
	"timezone" varchar(50),
	"call_intent" jsonb,
	"is_verified" boolean DEFAULT false,
	"verification_status" varchar(20) DEFAULT 'pending',
	"verified_at" timestamp,
	"verified_by" integer,
	"verification_documents" jsonb,
	"total_calls" integer DEFAULT 0,
	"customer_rating" integer,
	"review_count" integer DEFAULT 0,
	"status" varchar(20) DEFAULT 'active',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "business_accounts_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "call_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"caller_number_id" integer,
	"callee_number_id" integer,
	"type" "call_type" NOT NULL,
	"status" varchar(20),
	"started_at" timestamp DEFAULT now(),
	"ended_at" timestamp,
	"duration" integer,
	"is_spam" boolean DEFAULT false,
	"notes" text,
	"recording_url" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"phone_number_id" integer,
	"name" varchar(100),
	"is_favorite" boolean DEFAULT false,
	"is_blocked" boolean DEFAULT false,
	"tags" jsonb,
	"sync_status" varchar(20) DEFAULT 'synced',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"thread_id" integer NOT NULL,
	"sender_id" integer,
	"sender_number_id" integer,
	"business_account_id" integer,
	"type" varchar(20) DEFAULT 'text',
	"content" text,
	"media_url" text,
	"media_type" varchar(50),
	"media_size" integer,
	"media_duration" integer,
	"thumbnail_url" text,
	"location" jsonb,
	"contact_card" jsonb,
	"status" varchar(20) DEFAULT 'sent',
	"sent_at" timestamp DEFAULT now(),
	"delivered_at" timestamp,
	"read_at" timestamp,
	"failed_at" timestamp,
	"reply_to_id" integer,
	"reactions" jsonb,
	"is_edited" boolean DEFAULT false,
	"edited_at" timestamp,
	"original_content" text,
	"is_deleted" boolean DEFAULT false,
	"deleted_at" timestamp,
	"deleted_by" integer,
	"is_auto_reply" boolean DEFAULT false,
	"auto_reply_template_id" varchar(50)
);
--> statement-breakpoint
CREATE TABLE "phone_numbers" (
	"id" serial PRIMARY KEY NOT NULL,
	"number" varchar(20) NOT NULL,
	"normalized_number" varchar(20) NOT NULL,
	"country_code" varchar(5),
	"carrier" varchar(50),
	"line_type" varchar(20),
	"trust_level" "trust_level" DEFAULT 'neutral',
	"risk_score" "risk_score" DEFAULT 'low',
	"trust_score" integer DEFAULT 50,
	"is_verified" boolean DEFAULT false,
	"verification_tier" "verification_tier",
	"is_business" boolean DEFAULT false,
	"spam_report_count" integer DEFAULT 0,
	"safe_vote_count" integer DEFAULT 0,
	"spam_vote_count" integer DEFAULT 0,
	"last_searched_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "phone_numbers_number_unique" UNIQUE("number")
);
--> statement-breakpoint
CREATE TABLE "profile_viewers" (
	"id" serial PRIMARY KEY NOT NULL,
	"profile_id" integer,
	"viewer_id" integer,
	"viewer_number_id" integer,
	"viewed_at" timestamp DEFAULT now(),
	"is_revealed" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"display_name" varchar(100),
	"bio" text,
	"avatar_url" text,
	"location" varchar(100),
	"country" varchar(2),
	"trust_level" "trust_level" DEFAULT 'neutral',
	"risk_score" "risk_score" DEFAULT 'low',
	"trust_score" integer DEFAULT 50,
	"is_verified" boolean DEFAULT false,
	"verification_tier" "verification_tier",
	"is_business" boolean DEFAULT false,
	"business_name" varchar(100),
	"business_category" varchar(50),
	"working_hours" jsonb,
	"total_calls" integer DEFAULT 0,
	"profile_views" integer DEFAULT 0,
	"review_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "search_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"query" varchar(50) NOT NULL,
	"result_count" integer DEFAULT 0,
	"clicked_number_id" integer,
	"searched_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "spam_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"reporter_id" integer,
	"phone_number_id" integer,
	"category" "report_category" NOT NULL,
	"reason" text,
	"confidence" integer DEFAULT 100,
	"evidence" jsonb,
	"reporter_trust_score" integer DEFAULT 50,
	"status" varchar(20) DEFAULT 'pending',
	"reviewed_at" timestamp,
	"reviewed_by" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"plan" varchar(20) NOT NULL,
	"status" varchar(20) DEFAULT 'active',
	"started_at" timestamp DEFAULT now(),
	"expires_at" timestamp,
	"payment_method" varchar(50),
	"price" integer,
	"currency" varchar(3) DEFAULT 'INR',
	"features" jsonb,
	CONSTRAINT "subscriptions_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(30) NOT NULL,
	"type" varchar(20) NOT NULL,
	"color" varchar(7) DEFAULT '#6B7280',
	"usage_count" integer DEFAULT 0,
	CONSTRAINT "tags_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "threads" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"participant_id" integer,
	"participant_number_id" integer,
	"business_account_id" integer,
	"type" varchar(20) DEFAULT 'direct',
	"subject" varchar(200),
	"last_message_at" timestamp,
	"last_message_preview" varchar(200),
	"last_message_id" integer,
	"unread_count" integer DEFAULT 0,
	"is_archived" boolean DEFAULT false,
	"is_pinned" boolean DEFAULT false,
	"is_muted" boolean DEFAULT false,
	"mute_until" timestamp,
	"is_deleted" boolean DEFAULT false,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"phone_number" varchar(20) NOT NULL,
	"email" varchar(255),
	"password_hash" varchar(255),
	"is_verified" boolean DEFAULT false,
	"verification_code" varchar(10),
	"verification_code_expiry" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"last_login_at" timestamp,
	"is_active" boolean DEFAULT true,
	"device_tokens" jsonb,
	"settings" jsonb,
	CONSTRAINT "users_phone_number_unique" UNIQUE("phone_number")
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blocked_numbers" ADD CONSTRAINT "blocked_numbers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blocked_numbers" ADD CONSTRAINT "blocked_numbers_phone_number_id_phone_numbers_id_fk" FOREIGN KEY ("phone_number_id") REFERENCES "public"."phone_numbers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_accounts" ADD CONSTRAINT "business_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_accounts" ADD CONSTRAINT "business_accounts_phone_number_id_phone_numbers_id_fk" FOREIGN KEY ("phone_number_id") REFERENCES "public"."phone_numbers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "call_logs" ADD CONSTRAINT "call_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "call_logs" ADD CONSTRAINT "call_logs_caller_number_id_phone_numbers_id_fk" FOREIGN KEY ("caller_number_id") REFERENCES "public"."phone_numbers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "call_logs" ADD CONSTRAINT "call_logs_callee_number_id_phone_numbers_id_fk" FOREIGN KEY ("callee_number_id") REFERENCES "public"."phone_numbers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_phone_number_id_phone_numbers_id_fk" FOREIGN KEY ("phone_number_id") REFERENCES "public"."phone_numbers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_thread_id_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_number_id_phone_numbers_id_fk" FOREIGN KEY ("sender_number_id") REFERENCES "public"."phone_numbers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_business_account_id_business_accounts_id_fk" FOREIGN KEY ("business_account_id") REFERENCES "public"."business_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_reply_to_id_messages_id_fk" FOREIGN KEY ("reply_to_id") REFERENCES "public"."messages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_viewers" ADD CONSTRAINT "profile_viewers_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_viewers" ADD CONSTRAINT "profile_viewers_viewer_id_users_id_fk" FOREIGN KEY ("viewer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_viewers" ADD CONSTRAINT "profile_viewers_viewer_number_id_phone_numbers_id_fk" FOREIGN KEY ("viewer_number_id") REFERENCES "public"."phone_numbers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "search_history" ADD CONSTRAINT "search_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "search_history" ADD CONSTRAINT "search_history_clicked_number_id_phone_numbers_id_fk" FOREIGN KEY ("clicked_number_id") REFERENCES "public"."phone_numbers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spam_reports" ADD CONSTRAINT "spam_reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spam_reports" ADD CONSTRAINT "spam_reports_phone_number_id_phone_numbers_id_fk" FOREIGN KEY ("phone_number_id") REFERENCES "public"."phone_numbers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threads" ADD CONSTRAINT "threads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threads" ADD CONSTRAINT "threads_participant_id_users_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threads" ADD CONSTRAINT "threads_participant_number_id_phone_numbers_id_fk" FOREIGN KEY ("participant_number_id") REFERENCES "public"."phone_numbers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threads" ADD CONSTRAINT "threads_business_account_id_business_accounts_id_fk" FOREIGN KEY ("business_account_id") REFERENCES "public"."business_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_user_idx" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_action_idx" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "audit_time_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "block_user_idx" ON "blocked_numbers" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "block_phone_idx" ON "blocked_numbers" USING btree ("user_id","phone_number_id");--> statement-breakpoint
CREATE UNIQUE INDEX "biz_user_idx" ON "business_accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "biz_phone_idx" ON "business_accounts" USING btree ("phone_number_id");--> statement-breakpoint
CREATE INDEX "biz_category_idx" ON "business_accounts" USING btree ("category");--> statement-breakpoint
CREATE INDEX "biz_verified_idx" ON "business_accounts" USING btree ("is_verified");--> statement-breakpoint
CREATE INDEX "biz_status_idx" ON "business_accounts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "call_user_idx" ON "call_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "call_time_idx" ON "call_logs" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "call_type_idx" ON "call_logs" USING btree ("type");--> statement-breakpoint
CREATE INDEX "call_spam_idx" ON "call_logs" USING btree ("user_id","is_spam");--> statement-breakpoint
CREATE INDEX "contact_user_idx" ON "contacts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "contact_phone_idx" ON "contacts" USING btree ("phone_number_id");--> statement-breakpoint
CREATE INDEX "fav_idx" ON "contacts" USING btree ("user_id","is_favorite");--> statement-breakpoint
CREATE INDEX "block_idx" ON "contacts" USING btree ("user_id","is_blocked");--> statement-breakpoint
CREATE INDEX "msg_thread_idx" ON "messages" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX "msg_sender_idx" ON "messages" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "msg_status_idx" ON "messages" USING btree ("status");--> statement-breakpoint
CREATE INDEX "msg_sent_at_idx" ON "messages" USING btree ("sent_at");--> statement-breakpoint
CREATE UNIQUE INDEX "number_idx" ON "phone_numbers" USING btree ("number");--> statement-breakpoint
CREATE INDEX "normalized_idx" ON "phone_numbers" USING btree ("normalized_number");--> statement-breakpoint
CREATE INDEX "country_idx" ON "phone_numbers" USING btree ("country_code");--> statement-breakpoint
CREATE INDEX "pn_trust_idx" ON "phone_numbers" USING btree ("trust_level");--> statement-breakpoint
CREATE INDEX "pn_risk_idx" ON "phone_numbers" USING btree ("risk_score");--> statement-breakpoint
CREATE INDEX "search_idx" ON "phone_numbers" USING btree ("last_searched_at");--> statement-breakpoint
CREATE INDEX "viewer_profile_idx" ON "profile_viewers" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "viewed_time_idx" ON "profile_viewers" USING btree ("viewed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "profile_user_idx" ON "profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "trust_idx" ON "profiles" USING btree ("trust_level");--> statement-breakpoint
CREATE INDEX "risk_idx" ON "profiles" USING btree ("risk_score");--> statement-breakpoint
CREATE INDEX "search_user_idx" ON "search_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "search_time_idx" ON "search_history" USING btree ("searched_at");--> statement-breakpoint
CREATE INDEX "query_idx" ON "search_history" USING btree ("query");--> statement-breakpoint
CREATE INDEX "reporter_idx" ON "spam_reports" USING btree ("reporter_id");--> statement-breakpoint
CREATE INDEX "report_phone_idx" ON "spam_reports" USING btree ("phone_number_id");--> statement-breakpoint
CREATE INDEX "category_idx" ON "spam_reports" USING btree ("category");--> statement-breakpoint
CREATE INDEX "status_idx" ON "spam_reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "created_idx" ON "spam_reports" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "sub_user_idx" ON "subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sub_status_idx" ON "subscriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "expires_idx" ON "subscriptions" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "tag_name_idx" ON "tags" USING btree ("name");--> statement-breakpoint
CREATE INDEX "tag_type_idx" ON "tags" USING btree ("type");--> statement-breakpoint
CREATE INDEX "thread_user_idx" ON "threads" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "thread_participant_idx" ON "threads" USING btree ("participant_id");--> statement-breakpoint
CREATE INDEX "thread_business_idx" ON "threads" USING btree ("business_account_id");--> statement-breakpoint
CREATE INDEX "thread_last_msg_idx" ON "threads" USING btree ("last_message_at");--> statement-breakpoint
CREATE INDEX "thread_type_idx" ON "threads" USING btree ("type");--> statement-breakpoint
CREATE UNIQUE INDEX "phone_idx" ON "users" USING btree ("phone_number");--> statement-breakpoint
CREATE INDEX "email_idx" ON "users" USING btree ("email");