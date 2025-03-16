-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TYPE "public"."action_type_enum" AS ENUM('COMPLETE_SENTENCE_REVIEW', 'COMPLETE_WORD_REVIEW', 'COMPLETE_EXAM', 'FORGOT_WORD_MEANING', 'FORGOT_WORD_PRONUNCIATION', 'UNKNOWN_PHRASE_EXPRESSION', 'UNABLE_TO_UNDERSTAND_AUDIO', 'CREATE_MEMO', 'CREATE_WORD', 'COMPLETE_IMAGE_OCR', 'COMPLETE_TEXT_TRANSLATION_BY_EXTENSION');--> statement-breakpoint
CREATE TYPE "public"."exam_status_enum" AS ENUM('initial', 'in_progress', 'completed');--> statement-breakpoint
CREATE TYPE "public"."membership_plan_enum" AS ENUM('MONTHLY');--> statement-breakpoint
CREATE TYPE "public"."question_type_enum" AS ENUM('kana_from_japanese', 'translation_from_japanese', 'japanese_from_chinese', 'transcription_from_audio');--> statement-breakpoint
CREATE TYPE "public"."related_type_enum" AS ENUM('word_card', 'memo_card', 'exam');--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expiresAt" timestamp(3) NOT NULL,
	"createdAt" timestamp(3),
	"updatedAt" timestamp(3)
);
--> statement-breakpoint
CREATE TABLE "word_card" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"word" text NOT NULL,
	"meaning" text NOT NULL,
	"create_time" timestamp(6) with time zone NOT NULL,
	"user_id" text NOT NULL,
	"review_times" integer DEFAULT 0 NOT NULL,
	"forget_count" integer DEFAULT 0 NOT NULL,
	"memo_card_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text NOT NULL,
	"providerId" text NOT NULL,
	"userId" text NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"idToken" text,
	"accessTokenExpiresAt" timestamp(3),
	"refreshTokenExpiresAt" timestamp(3),
	"scope" text,
	"password" text,
	"createdAt" timestamp(3) NOT NULL,
	"updatedAt" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exam_results" (
	"result_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exam_id" uuid NOT NULL,
	"question" text NOT NULL,
	"question_type" "question_type_enum" NOT NULL,
	"question_ref" uuid NOT NULL,
	"user_answer" text NOT NULL,
	"reference_answer" text DEFAULT '' NOT NULL,
	"is_correct" boolean DEFAULT false NOT NULL,
	"question_score" integer DEFAULT 0 NOT NULL,
	"create_time" timestamp(6) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content" text NOT NULL,
	"create_time" timestamp(6) with time zone NOT NULL,
	"user_id" text,
	"tags" text,
	"title" text
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"emailVerified" boolean NOT NULL,
	"image" text,
	"createdAt" timestamp(3) NOT NULL,
	"updatedAt" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expiresAt" timestamp(3) NOT NULL,
	"token" text NOT NULL,
	"createdAt" timestamp(3) NOT NULL,
	"updatedAt" timestamp(3) NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"userId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memo_card" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"translation" text NOT NULL,
	"create_time" timestamp(6) with time zone NOT NULL,
	"update_time" timestamp(6) with time zone NOT NULL,
	"record_file_path" text,
	"original_text" text,
	"review_times" integer DEFAULT 0,
	"forget_count" integer DEFAULT 0 NOT NULL,
	"user_id" text DEFAULT 'chenbj' NOT NULL,
	"kana_pronunciation" text,
	"context_url" text
);
--> statement-breakpoint
CREATE TABLE "user_subscription" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"start_time" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"end_time" timestamp(6) with time zone NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"openai_api_key" text
);
--> statement-breakpoint
CREATE TABLE "exams" (
	"exam_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"exam_name" varchar(255) NOT NULL,
	"total_score" integer DEFAULT 0 NOT NULL,
	"status" "exam_status_enum" DEFAULT 'initial' NOT NULL,
	"duration_seconds" integer,
	"create_time" timestamp(6) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_action_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"action_type" "action_type_enum" NOT NULL,
	"related_id" uuid NOT NULL,
	"related_type" "related_type_enum" NOT NULL,
	"create_time" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"email" varchar(255) NOT NULL,
	"password" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"email_verified" boolean DEFAULT false,
	"image" text,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "word_card" ADD CONSTRAINT "fk_memo_card" FOREIGN KEY ("memo_card_id") REFERENCES "public"."memo_card"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "user_subscription" ADD CONSTRAINT "user_subscription_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "user_email_key" ON "user" USING btree ("email" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "session_token_key" ON "session" USING btree ("token" text_ops);
*/