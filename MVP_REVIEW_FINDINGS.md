# MVP Review Findings

## Comparison of Data Model vs Original MVP Document

### ✅ Successfully Captured Features

1. **User Registration & Authentication**
   - Email verification with codes ✓
   - User profile (name, age, gender, location) ✓
   - Profile picture upload ✓

2. **Venue System**
   - Sport-agnostic design for basketball/soccer/running/cycling/skiing ✓
   - Location tracking (lat/lng) ✓
   - Active player counts ✓
   - King of the venue tracking ✓

3. **Challenge System**
   - Challenges linked to venues ✓
   - Video submission with verification ✓
   - Performance tracking (shots made, time taken, etc.) ✓
   - XP rewards ✓
   - Difficulty levels ✓

4. **Ranking System**
   - Venue/City/Country level rankings ✓ (in future phase)
   - Monthly challenges ✓
   - Top player tracking ✓

5. **Avatar System**
   - Basic avatar with customization ✓
   - Sport-specific equipment ✓

### ⚠️ MISSING or MISALIGNED Features

#### 1. Face Recognition Data
**MVP Document:** Page 2b mentions face recognition OR photo upload
**Current Model:** Has `profilePictureUrl` but no face recognition data storage
**Recommendation:** Add `faceEmbedding` field to User table (can be nullable for MVP)

#### 2. Avatar Equipment Details
**MVP Document:** Specifically mentions:
   - Hair (color AND style) ✓ Included
   - Shirt/Jersey (with jersey number) ❌ Missing jersey number
   - Trousers/Shorts ✓ Included as equipment
   - Basketball shoes ✓ Included as equipment
**Current Model:** Uses generic `equippedItems` JSON
**Recommendation:** Consider adding `jerseyNumber` to AvatarEquipment or as separate field

#### 3. Age Group Display
**MVP Document:** Page 4 shows age group in upper-right corner
**Current Model:** Has age but no age group calculation
**Recommendation:** Add computed field or method for age groups (e.g., "13-15", "16-18", "19-21", etc.)

#### 4. Distance to Other Players/Venues
**MVP Document:** Page 4 shows "active players nearby with live distance"
**Current Model:** Has location data but no distance calculation infrastructure
**Recommendation:** This is a runtime calculation, ensure PostGIS extension for distance queries

#### 5. Tutorial/Instructions Section
**MVP Document:** Page 7 mentions "dedicated area for tutorials"
**Current Model:** No tutorial/instruction storage
**Recommendation:** Add either:
   - `Tutorial` table for reusable tutorials
   - Or `tutorialUrl` field in Challenge table

#### 6. Challenge Recording Details
**MVP Document:** Pages 8-10 specify:
   - 10-second countdown timer
   - Verification gesture at start
   - Try Again / Upload options
   - Player identification verification
**Current Model:** Has basic video submission but missing countdown/gesture tracking
**Recommendation:** These are mostly UI features, but consider adding to `performanceData`:
   - `verificationGestureDetected: boolean`
   - `recordingAttempts: number`

#### 7. Sponsors Section
**MVP Document:** Page 5 shows sponsors at bottom
**Current Model:** Has Sponsor table but only in "Future Enhancements"
**Recommendation:** Move Sponsor table to MVP Phase 2 since it's shown in the MVP screens

#### 8. Crown Icon/Status
**MVP Document:** Crown appears for King of the Court
**Current Model:** Has `isKing` tracking but might need `kingOfVenues: []` array for multiple venues
**Recommendation:** Current structure supports this, just needs UI implementation

#### 9. Challenge Status Types
**MVP Document:** Page 7 mentions "active", "in progress", and "completed" challenges
**Current Model:** Only has `isActive` on Challenge, no user-specific status
**Recommendation:** Add status field to ChallengeSubmission or create UserChallenge junction table

#### 10. Progressive Feature Unlock
**MVP Document:** Page 3 - Features locked until avatar created
**Current Model:** No explicit feature unlock tracking
**Recommendation:** Add `hasCompletedOnboarding` or `unlockedFeatures` to User table

### 📝 Recommended Schema Adjustments

```sql
-- Adjust User table (MVP Phase 1)
ALTER TABLE User ADD COLUMN faceEmbedding TEXT NULLABLE;
ALTER TABLE User ADD COLUMN hasCompletedOnboarding BOOLEAN DEFAULT FALSE;
ALTER TABLE User ADD COLUMN ageGroup VARCHAR(20) GENERATED ALWAYS AS (
    CASE
        WHEN age < 13 THEN 'Under 13'
        WHEN age BETWEEN 13 AND 15 THEN '13-15'
        WHEN age BETWEEN 16 AND 18 THEN '16-18'
        WHEN age BETWEEN 19 AND 21 THEN '19-21'
        WHEN age BETWEEN 22 AND 25 THEN '22-25'
        ELSE '26+'
    END
) STORED;

-- Consider adding to AvatarEquipment (MVP Phase 2)
ALTER TABLE AvatarEquipment ADD COLUMN jerseyNumber INTEGER NULLABLE;

-- Move Sponsor table to MVP Phase 2 (not Future)
-- Already defined, just needs phase adjustment

-- Consider adding Tutorial table (MVP Phase 1 or 2)
CREATE TABLE Tutorial (
    id UUID PRIMARY KEY,
    challengeType VARCHAR(50) NOT NULL,
    sportType VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    videoUrl VARCHAR(500),
    content TEXT,
    displayOrder INTEGER DEFAULT 0,
    isActive BOOLEAN DEFAULT TRUE,
    createdAt TIMESTAMP DEFAULT NOW()
);

-- Add user-specific challenge tracking (MVP Phase 1)
CREATE TABLE UserChallengeStatus (
    id UUID PRIMARY KEY,
    userId UUID NOT NULL REFERENCES User(id),
    challengeId UUID NOT NULL REFERENCES Challenge(id),
    status VARCHAR(20) NOT NULL DEFAULT 'not_started', -- not_started, in_progress, completed
    startedAt TIMESTAMP,
    completedAt TIMESTAMP,
    attempts INTEGER DEFAULT 0,
    bestSubmissionId UUID REFERENCES ChallengeSubmission(id),
    UNIQUE(userId, challengeId)
);
```

### 🎯 Priority Recommendations

**MUST HAVE for MVP:**
1. Age group calculation/display
2. Feature unlock tracking (avatar completion requirement)
3. User-specific challenge status tracking

**NICE TO HAVE for MVP:**
1. Face embedding storage (can use just photo for MVP)
2. Jersey number field
3. Tutorial system
4. Sponsor table (move from Future to MVP Phase 2)

**HANDLE IN UI/RUNTIME:**
1. Distance calculations (use PostGIS)
2. Countdown timer
3. Crown display for Kings
4. Try Again functionality

### ✅ Overall Assessment

The data model captures about **85%** of the MVP requirements. The missing 15% consists mainly of:
- UI/UX features that don't require database changes
- Minor fields that can be added easily
- Some features that were placed in "Future" but appear in MVP screens

The core architecture is solid and supports the multi-sport expansion plan well.