ALTER TABLE "Match" ADD COLUMN "disputeReason" varchar(50);--> statement-breakpoint
ALTER TABLE "Match" ADD COLUMN "disputeDetails" text;--> statement-breakpoint
ALTER TABLE "Match" ADD COLUMN "disputedBy" uuid;--> statement-breakpoint
ALTER TABLE "Match" ADD COLUMN "disputedAt" timestamp;--> statement-breakpoint
ALTER TABLE "Match" ADD CONSTRAINT "Match_disputedBy_User_id_fk" FOREIGN KEY ("disputedBy") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;