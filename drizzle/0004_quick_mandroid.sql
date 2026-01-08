ALTER TABLE "Match" ADD COLUMN "recordingBy" uuid;--> statement-breakpoint
ALTER TABLE "Match" ADD COLUMN "recordingStartedAt" timestamp;--> statement-breakpoint
ALTER TABLE "Match" ADD CONSTRAINT "Match_recordingBy_User_id_fk" FOREIGN KEY ("recordingBy") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;