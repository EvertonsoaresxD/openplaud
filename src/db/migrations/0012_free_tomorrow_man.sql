CREATE EXTENSION IF NOT EXISTS vector;
--> statement-breakpoint
CREATE TABLE "transcription_chunks" (
	"id" text PRIMARY KEY NOT NULL,
	"transcription_id" text NOT NULL,
	"user_id" text NOT NULL,
	"text" text NOT NULL,
	"chunk_index" integer NOT NULL,
	"embedding" vector(1536) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "plaud_connections" ADD COLUMN "api_base" text DEFAULT 'https://api.plaud.ai' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "summary_prompt" jsonb;--> statement-breakpoint
ALTER TABLE "transcription_chunks" ADD CONSTRAINT "transcription_chunks_transcription_id_transcriptions_id_fk" FOREIGN KEY ("transcription_id") REFERENCES "public"."transcriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transcription_chunks" ADD CONSTRAINT "transcription_chunks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "transcription_chunks_transcription_id_idx" ON "transcription_chunks" USING btree ("transcription_id");--> statement-breakpoint
CREATE INDEX "transcription_chunks_embedding_idx" ON "transcription_chunks" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
ALTER TABLE "ai_enhancements" ADD CONSTRAINT "ai_enhancements_recording_id_user_id_unique" UNIQUE("recording_id","user_id");