CREATE TABLE "ActivePlayer" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"venueId" uuid NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"lastSeenAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ActivePlayer_userId_venueId_key" UNIQUE("userId","venueId")
);
--> statement-breakpoint
CREATE TABLE "AvatarEquipment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"avatarId" uuid NOT NULL,
	"sportId" uuid NOT NULL,
	"jerseyItemId" uuid,
	"shortsItemId" uuid,
	"shoesItemId" uuid,
	"accessoryItemId" uuid,
	"jerseyNumber" integer,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "AvatarEquipment_avatarId_sportId_key" UNIQUE("avatarId","sportId")
);
--> statement-breakpoint
CREATE TABLE "AvatarItem" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"itemType" varchar(50) NOT NULL,
	"sportId" uuid,
	"imageUrl" varchar(500) NOT NULL,
	"requiredMatches" integer,
	"requiredChallenges" integer,
	"requiredInvites" integer,
	"requiredXp" integer,
	"rpCost" integer,
	"isDefault" boolean DEFAULT false NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Avatar" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"skinTone" varchar(50),
	"hairStyle" varchar(50),
	"hairColor" varchar(50),
	"imageUrl" varchar(500),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "Avatar_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "ChallengeAttempt" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"challengeId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	"scoreValue" integer NOT NULL,
	"maxValue" integer NOT NULL,
	"videoUrl" varchar(500),
	"xpEarned" integer DEFAULT 0 NOT NULL,
	"rpEarned" integer DEFAULT 0 NOT NULL,
	"completedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Challenge" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"venueId" uuid NOT NULL,
	"sportId" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"instructions" text NOT NULL,
	"challengeType" varchar(50) NOT NULL,
	"xpReward" integer NOT NULL,
	"rpReward" integer DEFAULT 0 NOT NULL,
	"difficulty" varchar(20) NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "City" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"countryId" uuid NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "City_name_countryId_key" UNIQUE("name","countryId")
);
--> statement-breakpoint
CREATE TABLE "Country" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"code" varchar(10) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "Country_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "Match" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"venueId" uuid NOT NULL,
	"sportId" uuid NOT NULL,
	"player1Id" uuid NOT NULL,
	"player2Id" uuid NOT NULL,
	"player1Score" integer,
	"player2Score" integer,
	"winnerId" uuid,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"player1Agreed" boolean DEFAULT false NOT NULL,
	"player2Agreed" boolean DEFAULT false NOT NULL,
	"videoUrl" varchar(500),
	"winnerXp" integer DEFAULT 0 NOT NULL,
	"winnerRp" integer DEFAULT 0 NOT NULL,
	"loserXp" integer DEFAULT 0 NOT NULL,
	"startedAt" timestamp,
	"completedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "PlayerStats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"sportId" uuid NOT NULL,
	"totalXp" integer DEFAULT 0 NOT NULL,
	"totalRp" integer DEFAULT 0 NOT NULL,
	"availableRp" integer DEFAULT 0 NOT NULL,
	"matchesPlayed" integer DEFAULT 0 NOT NULL,
	"matchesWon" integer DEFAULT 0 NOT NULL,
	"matchesLost" integer DEFAULT 0 NOT NULL,
	"challengesCompleted" integer DEFAULT 0 NOT NULL,
	"totalPointsScored" integer DEFAULT 0 NOT NULL,
	"threePointMade" integer DEFAULT 0 NOT NULL,
	"threePointAttempted" integer DEFAULT 0 NOT NULL,
	"freeThrowMade" integer DEFAULT 0 NOT NULL,
	"freeThrowAttempted" integer DEFAULT 0 NOT NULL,
	"usersInvited" integer DEFAULT 0 NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "PlayerStats_userId_sportId_key" UNIQUE("userId","sportId")
);
--> statement-breakpoint
CREATE TABLE "Sport" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "Sport_name_unique" UNIQUE("name"),
	CONSTRAINT "Sport_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "UserUnlockedItem" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"itemId" uuid NOT NULL,
	"unlockedAt" timestamp DEFAULT now() NOT NULL,
	"unlockedVia" varchar(50) NOT NULL,
	CONSTRAINT "UserUnlockedItem_userId_itemId_key" UNIQUE("userId","itemId")
);
--> statement-breakpoint
CREATE TABLE "User" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255),
	"dateOfBirth" date,
	"ageGroup" varchar(50),
	"gender" varchar(50),
	"cityId" uuid,
	"hasCreatedAvatar" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "User_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "Venue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"cityId" uuid NOT NULL,
	"address" varchar(500),
	"district" varchar(255),
	"latitude" double precision,
	"longitude" double precision,
	"description" text,
	"imageUrl" varchar(500),
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ActivePlayer" ADD CONSTRAINT "ActivePlayer_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ActivePlayer" ADD CONSTRAINT "ActivePlayer_venueId_Venue_id_fk" FOREIGN KEY ("venueId") REFERENCES "public"."Venue"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "AvatarEquipment" ADD CONSTRAINT "AvatarEquipment_avatarId_Avatar_id_fk" FOREIGN KEY ("avatarId") REFERENCES "public"."Avatar"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "AvatarEquipment" ADD CONSTRAINT "AvatarEquipment_sportId_Sport_id_fk" FOREIGN KEY ("sportId") REFERENCES "public"."Sport"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "AvatarEquipment" ADD CONSTRAINT "AvatarEquipment_jerseyItemId_AvatarItem_id_fk" FOREIGN KEY ("jerseyItemId") REFERENCES "public"."AvatarItem"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "AvatarEquipment" ADD CONSTRAINT "AvatarEquipment_shortsItemId_AvatarItem_id_fk" FOREIGN KEY ("shortsItemId") REFERENCES "public"."AvatarItem"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "AvatarEquipment" ADD CONSTRAINT "AvatarEquipment_shoesItemId_AvatarItem_id_fk" FOREIGN KEY ("shoesItemId") REFERENCES "public"."AvatarItem"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "AvatarEquipment" ADD CONSTRAINT "AvatarEquipment_accessoryItemId_AvatarItem_id_fk" FOREIGN KEY ("accessoryItemId") REFERENCES "public"."AvatarItem"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "AvatarItem" ADD CONSTRAINT "AvatarItem_sportId_Sport_id_fk" FOREIGN KEY ("sportId") REFERENCES "public"."Sport"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Avatar" ADD CONSTRAINT "Avatar_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ChallengeAttempt" ADD CONSTRAINT "ChallengeAttempt_challengeId_Challenge_id_fk" FOREIGN KEY ("challengeId") REFERENCES "public"."Challenge"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ChallengeAttempt" ADD CONSTRAINT "ChallengeAttempt_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Challenge" ADD CONSTRAINT "Challenge_venueId_Venue_id_fk" FOREIGN KEY ("venueId") REFERENCES "public"."Venue"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Challenge" ADD CONSTRAINT "Challenge_sportId_Sport_id_fk" FOREIGN KEY ("sportId") REFERENCES "public"."Sport"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "City" ADD CONSTRAINT "City_countryId_Country_id_fk" FOREIGN KEY ("countryId") REFERENCES "public"."Country"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Match" ADD CONSTRAINT "Match_venueId_Venue_id_fk" FOREIGN KEY ("venueId") REFERENCES "public"."Venue"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Match" ADD CONSTRAINT "Match_sportId_Sport_id_fk" FOREIGN KEY ("sportId") REFERENCES "public"."Sport"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Match" ADD CONSTRAINT "Match_player1Id_User_id_fk" FOREIGN KEY ("player1Id") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Match" ADD CONSTRAINT "Match_player2Id_User_id_fk" FOREIGN KEY ("player2Id") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Match" ADD CONSTRAINT "Match_winnerId_User_id_fk" FOREIGN KEY ("winnerId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PlayerStats" ADD CONSTRAINT "PlayerStats_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PlayerStats" ADD CONSTRAINT "PlayerStats_sportId_Sport_id_fk" FOREIGN KEY ("sportId") REFERENCES "public"."Sport"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "UserUnlockedItem" ADD CONSTRAINT "UserUnlockedItem_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "UserUnlockedItem" ADD CONSTRAINT "UserUnlockedItem_itemId_AvatarItem_id_fk" FOREIGN KEY ("itemId") REFERENCES "public"."AvatarItem"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "User" ADD CONSTRAINT "User_cityId_City_id_fk" FOREIGN KEY ("cityId") REFERENCES "public"."City"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Venue" ADD CONSTRAINT "Venue_cityId_City_id_fk" FOREIGN KEY ("cityId") REFERENCES "public"."City"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ActivePlayer_venueId_idx" ON "ActivePlayer" USING btree ("venueId");--> statement-breakpoint
CREATE INDEX "ActivePlayer_lastSeenAt_idx" ON "ActivePlayer" USING btree ("lastSeenAt");--> statement-breakpoint
CREATE INDEX "AvatarItem_sportId_idx" ON "AvatarItem" USING btree ("sportId");--> statement-breakpoint
CREATE INDEX "AvatarItem_itemType_idx" ON "AvatarItem" USING btree ("itemType");--> statement-breakpoint
CREATE INDEX "ChallengeAttempt_userId_idx" ON "ChallengeAttempt" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "ChallengeAttempt_challengeId_idx" ON "ChallengeAttempt" USING btree ("challengeId");--> statement-breakpoint
CREATE INDEX "ChallengeAttempt_userId_challengeId_idx" ON "ChallengeAttempt" USING btree ("userId","challengeId");--> statement-breakpoint
CREATE INDEX "Challenge_venueId_idx" ON "Challenge" USING btree ("venueId");--> statement-breakpoint
CREATE INDEX "Challenge_sportId_idx" ON "Challenge" USING btree ("sportId");--> statement-breakpoint
CREATE INDEX "Challenge_venueId_sportId_idx" ON "Challenge" USING btree ("venueId","sportId");--> statement-breakpoint
CREATE INDEX "City_countryId_idx" ON "City" USING btree ("countryId");--> statement-breakpoint
CREATE INDEX "Match_player1Id_idx" ON "Match" USING btree ("player1Id");--> statement-breakpoint
CREATE INDEX "Match_player2Id_idx" ON "Match" USING btree ("player2Id");--> statement-breakpoint
CREATE INDEX "Match_venueId_idx" ON "Match" USING btree ("venueId");--> statement-breakpoint
CREATE INDEX "Match_status_idx" ON "Match" USING btree ("status");--> statement-breakpoint
CREATE INDEX "PlayerStats_userId_idx" ON "PlayerStats" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "PlayerStats_sportId_totalXp_idx" ON "PlayerStats" USING btree ("sportId","totalXp");--> statement-breakpoint
CREATE INDEX "UserUnlockedItem_userId_idx" ON "UserUnlockedItem" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "User_email_idx" ON "User" USING btree ("email");--> statement-breakpoint
CREATE INDEX "User_ageGroup_idx" ON "User" USING btree ("ageGroup");--> statement-breakpoint
CREATE INDEX "User_cityId_idx" ON "User" USING btree ("cityId");--> statement-breakpoint
CREATE INDEX "Venue_latLong_idx" ON "Venue" USING btree ("latitude","longitude");--> statement-breakpoint
CREATE INDEX "Venue_cityId_idx" ON "Venue" USING btree ("cityId");