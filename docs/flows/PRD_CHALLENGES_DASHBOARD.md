# PRD: Challenges Dashboard Redesign

## Overview

Redesign the `/challenges` page from a venue listing to a **personal progress dashboard** showing the user's challenge completion status across different challenge types.

## Current State (Problem)

The current Challenges page shows venues with their challenges, essentially duplicating the Map/Venue functionality. This is confusing and doesn't serve its intended purpose.

## Target State (Solution)

The Challenges page becomes a **personal tracking dashboard** with 4 windows showing:

1. How many challenges of each type exist
2. How many the user has completed
3. Quick access to start challenges

## User Stories

1. **As a player**, I want to see my challenge progress at a glance so I know what's available and what I've completed.
2. **As a player**, I want to quickly access 1v1 challenges and see active players I could challenge.
3. **As a player**, I want to track my three-throw and free-throw challenge completions.

---

## UI Design

### Layout: 5 Challenge Rows (List Style)

Based on client's handwritten wireframe:

```
┌─────────────────────────────────────┐
│  🏀 Challenges                      │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐    │
│  │ ⚔️ 1x1 Challenge        0   │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 🏀 Free Throw          3/0  │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 🎯 3-Point Shot        3/0  │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 🌍 Around the World    3/3  │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ ⭐ A1 Super Challenge       │    │
│  │    sponsor                  │    │
│  │    3 challenges available   │    │
│  │                        1/0  │    │
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

### Window Details

#### 1. 1x1 Challenge Row

- Shows single number: total 1v1 matches played/won
- Tapping navigates to `/matches` (My Matches page)
- Format: just "0" or "5" (single number)

#### 2. Free Throw Row

- Shows format: `total/completed` (e.g., "3/0")
- Total = 3 (one per venue in Vienna)
- Completed = how many the user has successfully done
- Tapping navigates to venue selection for free throw challenges

#### 3. 3-Point Shot Row

- Shows format: `total/completed` (e.g., "3/0")
- Total = 3 (one per venue in Vienna)
- Tapping navigates to venue selection for 3-point challenges

#### 4. Around the World Row

- Shows format: `total/completed` (e.g., "3/3" when all completed)
- Total = 3 (one per venue in Vienna)
- Tapping navigates to venue selection for around the world challenges

#### 5. Sponsored Challenge Row (A1 Super Challenge)

- Shows sponsor name and available challenges
- Format: `total/completed` with "X challenges available" subtitle
- This is for monthly/special sponsored challenges

---

## API Design

### GET /api/challenges/summary

Returns user's challenge progress summary.

**Response:**

```json
{
  "oneVsOne": {
    "matchesPlayed": 5
  },
  "freeThrow": {
    "total": 3,
    "completed": 0
  },
  "threePointShot": {
    "total": 3,
    "completed": 0
  },
  "aroundTheWorld": {
    "total": 3,
    "completed": 3
  },
  "sponsoredChallenge": {
    "name": "A1 Super Challenge",
    "sponsor": "A1",
    "total": 1,
    "completed": 0,
    "available": 3
  }
}
```

**Note:** The format displayed is `total/completed` (e.g., "3/0" means 3 available, 0 done)

---

## Database Considerations

### Existing Tables Used

- `Challenge` - challenge definitions (type: 'three_point', 'free_throw', etc.)
- `ChallengeAttempt` - user's challenge completions
- `Match` - 1v1 match history
- `ActivePlayer` - players currently at venues

### Challenge Types (by name in database)

- `3-Point Shot` - Three-point shooting challenges (50 XP)
- `Free Throw` - Free-throw challenges (30 XP)
- `Around the World` - Multi-position challenges (100 XP)

---

## Navigation Flow

```
/challenges (Dashboard)
    ├── Tap "1v1" → /map (to find active players)
    ├── Tap "3-Point Shot" → /challenges/type/3-point-shot (venues with this challenge)
    ├── Tap "Free Throw" → /challenges/type/free-throw (venues with this challenge)
    └── Tap "Around the World" → /challenges/type/around-the-world (venues with this challenge)
```

---

## Implementation Steps

### Step 2: API Route

1. Create `GET /api/challenges/summary` endpoint
2. Query challenge completions from `ChallengeAttempt`
3. Query active players count from `ActivePlayer`
4. Query 1v1 stats from `Match`

### Step 3: Unit Tests

1. Test summary calculation logic
2. Test challenge completion counting
3. Test active player aggregation

### Step 4: Integration Tests

1. Test full API response with test data
2. Test edge cases (no completions, all completed)

### Step 5: UI Implementation

1. Redesign `/challenges` page with 4-window grid
2. Create challenge category pages (`/challenges/three-point`, `/challenges/free-throw`)
3. Add recent activity section
4. Ensure responsive design

---

## Acceptance Criteria

- [ ] Challenges page shows 4 challenge type windows
- [ ] Each window shows completion progress (X/Y format)
- [ ] 1v1 window shows active player count
- [ ] Tapping each window navigates to appropriate page
- [ ] Recent activity shows last 5 challenge/match completions
- [ ] Page loads quickly with loading states
- [ ] Works on mobile (375px+)

---

## Out of Scope (Future)

- Combo challenges implementation
- Challenge rewards/badges
- Challenge streaks
- Leaderboards per challenge type
