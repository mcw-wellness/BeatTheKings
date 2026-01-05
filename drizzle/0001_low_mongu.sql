ALTER TABLE "AvatarEquipment" ALTER COLUMN "updatedAt" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "AvatarEquipment" ALTER COLUMN "updatedAt" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "Avatar" ALTER COLUMN "updatedAt" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "Avatar" ALTER COLUMN "updatedAt" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "Challenge" ALTER COLUMN "updatedAt" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "Challenge" ALTER COLUMN "updatedAt" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "PlayerStats" ALTER COLUMN "updatedAt" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "PlayerStats" ALTER COLUMN "updatedAt" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "User" ALTER COLUMN "updatedAt" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "User" ALTER COLUMN "updatedAt" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "Venue" ALTER COLUMN "updatedAt" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "Venue" ALTER COLUMN "updatedAt" DROP NOT NULL;