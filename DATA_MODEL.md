# Data Model Documentation

**Last Updated:** 2025-11-03
**Status:** Planning Phase
**Principles:** KISS, YAGNI, TDD

---

## MVP Phase 1 - Core Tables (Required Now)

These tables are essential for the basic app functionality: user registration, venue selection, challenge completion, and basic ranking.

### User
**Purpose:** Store user authentication and profile information

```
id                    UUID PRIMARY KEY
email                 VARCHAR(255) UNIQUE NOT NULL
emailVerified         BOOLEAN DEFAULT FALSE
verificationCode      VARCHAR(10) NULLABLE
verificationCodeExpiry TIMESTAMP NULLABLE
name                  VARCHAR(100) NOT NULL
age                   INTEGER NOT NULL
ageGroup              VARCHAR(20) NOT NULL (calculated on signup: Under-13/13-15/16-18/19-21/22-25/26+)
gender                VARCHAR(20) NOT NULL (Male/Female/Other)
location              VARCHAR(255) NOT NULL
profilePictureUrl     VARCHAR(500) NULLABLE
hasCompletedOnboarding BOOLEAN DEFAULT FALSE
createdAt             TIMESTAMP DEFAULT NOW()
updatedAt             TIMESTAMP DEFAULT NOW()
```

**Note:** Face recognition is NOT implemented in MVP - only profile picture upload is required.

### Venue
**Purpose:** Sport-agnostic venue structure (courts, fields, tracks, slopes)

```
id                UUID PRIMARY KEY
name              VARCHAR(255) NOT NULL
venueType         VARCHAR(50) NOT NULL (court/field/track/trail/slope)
sportType         VARCHAR(50) NOT NULL (basketball/soccer/running/cycling/skiing)
address           VARCHAR(500)
latitude          DECIMAL(10, 8) NOT NULL
longitude         DECIMAL(11, 8) NOT NULL
city              VARCHAR(100) NOT NULL
country           VARCHAR(100) NOT NULL
activePlayerCount INTEGER DEFAULT 0
currentKingId     UUID NULLABLE (FK -> User.id)
description       TEXT NULLABLE
createdAt         TIMESTAMP DEFAULT NOW()
updatedAt         TIMESTAMP DEFAULT NOW()

INDEX idx_venue_location (latitude, longitude)
INDEX idx_venue_sport (sportType)
INDEX idx_venue_city (city)
```

### Challenge
**Purpose:** Challenges available at venues

```
id                UUID PRIMARY KEY
venueId           UUID NOT NULL (FK -> Venue.id)
name              VARCHAR(255) NOT NULL
description       TEXT NOT NULL
instructions      TEXT NOT NULL
challengeType     VARCHAR(50) NOT NULL (free_throws/penalty_kicks/sprint/etc)
parameters        JSONB NOT NULL (e.g., {requiredShots: 10, timeLimit: 60})
xpReward          INTEGER NOT NULL
difficulty        VARCHAR(20) NOT NULL (easy/medium/hard)
isActive          BOOLEAN DEFAULT TRUE
createdAt         TIMESTAMP DEFAULT NOW()
updatedAt         TIMESTAMP DEFAULT NOW()

INDEX idx_challenge_venue (venueId)
```

### ChallengeSubmission
**Purpose:** Track user challenge attempts and results

```
id                UUID PRIMARY KEY
challengeId       UUID NOT NULL (FK -> Challenge.id)
userId            UUID NOT NULL (FK -> User.id)
videoUrl          VARCHAR(500) NOT NULL
performanceData   JSONB NOT NULL (e.g., {shotsMade: 8, shotsAttempted: 10, timeTaken: 45})
verificationStatus VARCHAR(20) DEFAULT 'pending' (pending/verified/rejected)
verifiedAt        TIMESTAMP NULLABLE
xpEarned          INTEGER DEFAULT 0
createdAt         TIMESTAMP DEFAULT NOW()

INDEX idx_submission_user (userId)
INDEX idx_submission_challenge (challengeId)
INDEX idx_submission_status (verificationStatus)
```

### PlayerStats
**Purpose:** Basic user statistics and ranking (simplified for MVP)

```
id                UUID PRIMARY KEY
userId            UUID UNIQUE NOT NULL (FK -> User.id)
totalXp           INTEGER DEFAULT 0
currentRank       INTEGER DEFAULT 0
totalChallenges   INTEGER DEFAULT 0
sportType         VARCHAR(50) NOT NULL (basketball/soccer/running/etc)
venueStatsJson    JSONB DEFAULT '{}' (e.g., {venueId1: {rank: 1, xp: 500}})
updatedAt         TIMESTAMP DEFAULT NOW()

INDEX idx_stats_user (userId)
INDEX idx_stats_xp (totalXp DESC)
INDEX idx_stats_sport (sportType)
```

### UserChallengeStatus
**Purpose:** Track user-specific challenge progress and completion

```
id                UUID PRIMARY KEY
userId            UUID NOT NULL (FK -> User.id)
challengeId       UUID NOT NULL (FK -> Challenge.id)
status            VARCHAR(20) NOT NULL DEFAULT 'not_started' (not_started/in_progress/completed)
startedAt         TIMESTAMP NULLABLE
completedAt       TIMESTAMP NULLABLE
attempts          INTEGER DEFAULT 0
bestSubmissionId  UUID NULLABLE (FK -> ChallengeSubmission.id)
createdAt         TIMESTAMP DEFAULT NOW()
updatedAt         TIMESTAMP DEFAULT NOW()

UNIQUE(userId, challengeId)
INDEX idx_user_challenge_status (userId, status)
```

---

## MVP Phase 2 - Enhanced Features (Add After Core Works)

### Avatar
**Purpose:** User avatar customization

```
id                UUID PRIMARY KEY
userId            UUID UNIQUE NOT NULL (FK -> User.id)
hairColor         VARCHAR(50)
hairStyle         VARCHAR(50)
createdAt         TIMESTAMP DEFAULT NOW()
updatedAt         TIMESTAMP DEFAULT NOW()
```

### AvatarEquipment
**Purpose:** Track equipped items per sport

```
id                UUID PRIMARY KEY
avatarId          UUID NOT NULL (FK -> Avatar.id)
sportType         VARCHAR(50) NOT NULL
jerseyNumber      INTEGER NULLABLE
equippedItems     JSONB NOT NULL (e.g., {head: null, torso: "item_123", legs: "item_456"})
updatedAt         TIMESTAMP DEFAULT NOW()

UNIQUE(avatarId, sportType)
```

### ActivePlayer
**Purpose:** Real-time player tracking at venues

```
id                UUID PRIMARY KEY
userId            UUID NOT NULL (FK -> User.id)
venueId           UUID NOT NULL (FK -> Venue.id)
lastSeenAt        TIMESTAMP DEFAULT NOW()
isPlaying         BOOLEAN DEFAULT TRUE

INDEX idx_active_venue (venueId)
INDEX idx_active_user (userId)
INDEX idx_active_lastseen (lastSeenAt)
```

### MonthlyChallenge
**Purpose:** Monthly competition tracking

```
id                UUID PRIMARY KEY
title             VARCHAR(255) NOT NULL
description       TEXT NOT NULL
sportType         VARCHAR(50) NOT NULL
startDate         TIMESTAMP NOT NULL
endDate           TIMESTAMP NOT NULL
prizeDescription  TEXT NOT NULL
topPlayerIds      JSONB DEFAULT '[]' (array of user IDs)
isActive          BOOLEAN DEFAULT TRUE
createdAt         TIMESTAMP DEFAULT NOW()
```

### Tutorial
**Purpose:** Store tutorial content for different challenge types

```
id                UUID PRIMARY KEY
challengeType     VARCHAR(50) NOT NULL
sportType         VARCHAR(50) NOT NULL
title             VARCHAR(255) NOT NULL
videoUrl          VARCHAR(500) NULLABLE
content           TEXT NOT NULL
displayOrder      INTEGER DEFAULT 0
isActive          BOOLEAN DEFAULT TRUE
createdAt         TIMESTAMP DEFAULT NOW()
updatedAt         TIMESTAMP DEFAULT NOW()

INDEX idx_tutorial_sport (sportType, challengeType)
```

### Sponsor
**Purpose:** Manage sponsors and advertisements (shown on ranking page)

```
id                UUID PRIMARY KEY
name              VARCHAR(255) NOT NULL
logoUrl           VARCHAR(500) NOT NULL
websiteUrl        VARCHAR(500) NULLABLE
displayOrder      INTEGER DEFAULT 0
isActive          BOOLEAN DEFAULT TRUE
createdAt         TIMESTAMP DEFAULT NOW()
```

---

## Future Enhancements (Post-MVP)

### Sport
**Purpose:** Make sports a first-class entity for better management

```
id                UUID PRIMARY KEY
name              VARCHAR(100) UNIQUE NOT NULL
slug              VARCHAR(50) UNIQUE NOT NULL
iconUrl           VARCHAR(500)
isActive          BOOLEAN DEFAULT TRUE
displayOrder      INTEGER DEFAULT 0
createdAt         TIMESTAMP DEFAULT NOW()
```

**Migration Note:** When implementing, convert existing `sportType` VARCHAR fields to `sportId` UUID foreign keys.

### EquipmentCatalog
**Purpose:** Define all available equipment items per sport

```
id                UUID PRIMARY KEY
sportId           UUID NOT NULL (FK -> Sport.id)
name              VARCHAR(255) NOT NULL
itemType          VARCHAR(50) NOT NULL (head/torso/legs/feet/accessory)
imageUrl          VARCHAR(500) NOT NULL
rarity            VARCHAR(20) (common/rare/epic/legendary)
unlockRequirement JSONB (e.g., {xp: 1000, challengesCompleted: 10})
price             INTEGER NULLABLE
isActive          BOOLEAN DEFAULT TRUE
createdAt         TIMESTAMP DEFAULT NOW()
```

### UserEquipment
**Purpose:** Track what equipment each user has unlocked

```
id                UUID PRIMARY KEY
userId            UUID NOT NULL (FK -> User.id)
equipmentId       UUID NOT NULL (FK -> EquipmentCatalog.id)
unlockedAt        TIMESTAMP DEFAULT NOW()

UNIQUE(userId, equipmentId)
INDEX idx_user_equipment (userId)
```

### VenueRanking
**Purpose:** Separate ranking table for better query performance

```
id                UUID PRIMARY KEY
userId            UUID NOT NULL (FK -> User.id)
venueId           UUID NOT NULL (FK -> Venue.id)
rank              INTEGER NOT NULL
totalXp           INTEGER NOT NULL
isKing            BOOLEAN DEFAULT FALSE
lastPlayedAt      TIMESTAMP DEFAULT NOW()
updatedAt         TIMESTAMP DEFAULT NOW()

UNIQUE(userId, venueId)
INDEX idx_venue_ranking (venueId, rank)
INDEX idx_venue_king (venueId, isKing)
```

### CityRanking
**Purpose:** City-level rankings per sport

```
id                UUID PRIMARY KEY
userId            UUID NOT NULL (FK -> User.id)
sportId           UUID NOT NULL (FK -> Sport.id)
city              VARCHAR(100) NOT NULL
rank              INTEGER NOT NULL
totalXp           INTEGER NOT NULL
updatedAt         TIMESTAMP DEFAULT NOW()

UNIQUE(userId, sportId, city)
INDEX idx_city_ranking (sportId, city, rank)
```

### CountryRanking
**Purpose:** Country-level rankings per sport

```
id                UUID PRIMARY KEY
userId            UUID NOT NULL (FK -> User.id)
sportId           UUID NOT NULL (FK -> Sport.id)
country           VARCHAR(100) NOT NULL
rank              INTEGER NOT NULL
totalXp           INTEGER NOT NULL
updatedAt         TIMESTAMP DEFAULT NOW()

UNIQUE(userId, sportId, country)
INDEX idx_country_ranking (sportId, country, rank)
```

### ChallengeTemplate
**Purpose:** Reusable challenge definitions across venues

```
id                UUID PRIMARY KEY
sportId           UUID NOT NULL (FK -> Sport.id)
name              VARCHAR(255) NOT NULL
description       TEXT NOT NULL
instructions      TEXT NOT NULL
verificationCriteria JSONB NOT NULL
difficulty        VARCHAR(20) NOT NULL
baseXpReward      INTEGER NOT NULL
isActive          BOOLEAN DEFAULT TRUE
createdAt         TIMESTAMP DEFAULT NOW()
```

**Migration Note:** Existing Challenge table would reference ChallengeTemplate instead of duplicating challenge definitions.

---

## Data Model Decisions & Open Questions

### Decisions Made:
- ✅ Venue is sport-agnostic from the start (supports basketball, soccer, running, etc.)
- ✅ Start with simple JSON for venue-specific stats, normalize later if needed
- ✅ Sport type stored as VARCHAR initially, migrate to Sport entity later
- ✅ One PlayerStats record per user per sport (simple for MVP)

### Open Questions (To Be Decided):

1. **Avatar Equipment Strategy:**
   - Option A: One avatar, multiple sport-specific equipment loadouts
   - Option B: Separate avatars per sport
   - **Recommendation:** Option A (current design) - simpler and more flexible

2. **XP System:**
   - Option A: Separate XP per sport (basketball XP, soccer XP)
   - Option B: Unified XP across all sports
   - Option C: Both (sport XP + global XP)
   - **Recommendation:** Option A for MVP - keeps rankings fair per sport

3. **Ranking Calculation:**
   - Option A: Calculate on-the-fly from submissions
   - Option B: Maintain ranking tables (VenueRanking, CityRanking, CountryRanking)
   - **Recommendation:** Option A for MVP, migrate to Option B when performance requires

4. **Video Storage:**
   - Recommendation: Use cloud storage (S3, Cloudflare R2, etc.), store only URL in database

5. **Face Recognition:**
   - **Decision:** NOT implementing face recognition in MVP
   - Only profile picture upload is required

6. **Age Group Updates:**
   - Age groups calculated on signup
   - **Future Enhancement:** Add scheduled job (cron) to update age groups as users age into new brackets
   - This avoids complex computed fields while maintaining accurate age groupings

---

## Migration Strategy

When promoting features from Future to MVP or MVP Phase 2 to Phase 1:

1. Create migration file with timestamp
2. Add new tables with proper indexes
3. Migrate existing data if needed
4. Update foreign key relationships
5. Run tests to verify data integrity
6. Deploy with rollback plan

**Remember:** Always get user verification before executing database changes!

---

## Notes for Future Development

- All JSON fields are using JSONB for PostgreSQL performance
- Geospatial queries will use PostGIS extension for efficient location searches
- Consider partitioning large tables (ChallengeSubmission) by date when scale requires
- All timestamps use UTC timezone
- Soft deletes not included in MVP (can add `deletedAt` column later if needed)
