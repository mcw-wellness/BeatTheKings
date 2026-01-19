ALTER TABLE "User" ADD COLUMN "nickname" varchar(50);--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "age" integer;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "profilePictureUrl" varchar(500);--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "hasCompletedProfile" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "hasUploadedPhoto" boolean DEFAULT false NOT NULL;