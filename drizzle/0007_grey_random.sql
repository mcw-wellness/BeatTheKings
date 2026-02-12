CREATE TABLE "MatchInvitation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"senderId" uuid NOT NULL,
	"receiverId" uuid NOT NULL,
	"venueId" uuid NOT NULL,
	"sportId" uuid NOT NULL,
	"scheduledAt" timestamp NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"message" text,
	"respondedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "Match" ADD COLUMN "invitationId" uuid;--> statement-breakpoint
ALTER TABLE "MatchInvitation" ADD CONSTRAINT "MatchInvitation_senderId_User_id_fk" FOREIGN KEY ("senderId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "MatchInvitation" ADD CONSTRAINT "MatchInvitation_receiverId_User_id_fk" FOREIGN KEY ("receiverId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "MatchInvitation" ADD CONSTRAINT "MatchInvitation_venueId_Venue_id_fk" FOREIGN KEY ("venueId") REFERENCES "public"."Venue"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "MatchInvitation" ADD CONSTRAINT "MatchInvitation_sportId_Sport_id_fk" FOREIGN KEY ("sportId") REFERENCES "public"."Sport"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "MatchInvitation_senderId_idx" ON "MatchInvitation" USING btree ("senderId");--> statement-breakpoint
CREATE INDEX "MatchInvitation_receiverId_idx" ON "MatchInvitation" USING btree ("receiverId");--> statement-breakpoint
CREATE INDEX "MatchInvitation_status_idx" ON "MatchInvitation" USING btree ("status");--> statement-breakpoint
ALTER TABLE "Match" ADD CONSTRAINT "Match_invitationId_MatchInvitation_id_fk" FOREIGN KEY ("invitationId") REFERENCES "public"."MatchInvitation"("id") ON DELETE no action ON UPDATE no action;