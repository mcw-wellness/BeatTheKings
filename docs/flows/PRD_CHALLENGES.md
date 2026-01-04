# PRD: Challenges Flow

## Overview

The Challenges flow allows players to complete solo challenges at venues and compete in 1v1 matches against other players. Players first select a venue (sorted by proximity), then choose from available challenges or find opponents for 1v1 matches.

## User Requirements (from Beat The Kings.txt)

### Challenges - Location Selection (Point 7)

- When entering Challenges section, first select the park
- Nearest park displayed at top (sorted by distance)
- Show all available challenges at selected park

### Challenges - General (Point 5)

- Solo challenges: 3-Throw, Around the World, 3-Point-Shots, Free-Throws
- Include Start and Stop count buttons
- No View-Avatar button needed
- Unlimited retry attempts per day

### Challenges - 1 vs 1 (Point 6)

- Auto-detect players on the court via active players list
- NFC/Bluetooth phone touch for verification & Trump Card exchange
- Video + AI for match evaluation (future phase)
- Agree/Dispute result buttons
- Auto-update stats on both players agreeing

## User Stories

### US-1: Select Venue for Challenges

**As a** player
**I want to** see venues sorted by distance when entering Challenges
**So that** I can quickly find nearby courts with challenges

**Acceptance Criteria:**

- Venues list sorted by proximity (nearest first)
- Each venue shows: name, district, distance, challenge count, active player count
- Tap venue to see its challenges

### US-2: View Venue Challenges

**As a** player at a selected venue
**I want to** see all available challenges at this venue
**So that** I can choose which challenge to attempt

**Acceptance Criteria:**

- Shows list of solo challenges at venue
- Each challenge shows: name, difficulty, XP/RP reward
- Shows my completion status for each challenge
- "Start" button for each challenge

### US-3: Complete Solo Challenge

**As a** player
**I want to** record my challenge attempt with Start/Stop buttons
**So that** my score is tracked and I earn XP

**Acceptance Criteria:**

- Challenge instruction screen with Start button
- Counter screen with +1/-1 buttons and Stop button
- Score = shots made / shots attempted
- XP earned based on performance and difficulty
- Stats updated (threePointMade, freeThrowMade, etc.)
- Unlimited retries per day

### US-4: View Available 1v1 Opponents

**As a** player at a venue
**I want to** see other active players for 1v1 matches
**So that** I can challenge them

**Acceptance Criteria:**

- Shows active players at same venue
- Each player shows: Avatar, Rank
- Tap player to view Trump Card
- "Challenge" button to initiate match

### US-5: Initiate 1v1 Match

**As a** player
**I want to** challenge another player to a 1v1 match
**So that** we can compete and earn XP

**Acceptance Criteria:**

- Send challenge request to opponent
- Opponent receives notification
- Both confirm via NFC/proximity (MVP: both tap "Ready")
- Match starts when both ready

### US-6: Complete 1v1 Match

**As a** player in a match
**I want to** record the final score with Agree/Dispute buttons
**So that** the result is verified by both players

**Acceptance Criteria:**

- Either player can enter final score
- Both see proposed score
- "Agree" or "Dispute" buttons
- If both agree: stats updated, XP awarded
- If disputed: match marked as disputed (requires manual review)

## Pages & Navigation

```
/challenges                    → Venue selection (sorted by distance)
/challenges/venue/[venueId]    → Challenges at venue + 1v1 option
/challenges/[challengeId]      → Challenge instructions
/challenges/[challengeId]/play → Start/Stop counter UI
/challenges/[challengeId]/result → Result screen with XP earned

/challenges/venue/[venueId]/opponents  → Active players for 1v1
/challenges/1v1/[matchId]              → Match lobby (waiting for both ready)
/challenges/1v1/[matchId]/score        → Enter/confirm score
/challenges/1v1/[matchId]/result       → Match result with XP
```

## API Endpoints

### Solo Challenges

```
GET  /api/challenges/venues
     Query: lat, lng (for distance sorting)
     Returns: venues[] with challengeCount, activePlayerCount, distance

GET  /api/challenges/venues/[venueId]
     Returns: venue details + challenges[] + activePlayers[]

GET  /api/challenges/[challengeId]
     Returns: challenge details with instructions

POST /api/challenges/[challengeId]/attempt
     Body: { scoreValue, maxValue }
     Returns: { xpEarned, rpEarned, newTotalXp, newStats }
```

### 1v1 Matches

```
GET  /api/challenges/venues/[venueId]/opponents
     Returns: active players at venue with rank/avatar

POST /api/matches
     Body: { venueId, opponentId }
     Returns: match object with status "pending"

GET  /api/matches/[matchId]
     Returns: match details with both players

POST /api/matches/[matchId]/ready
     Marks current user as ready

POST /api/matches/[matchId]/score
     Body: { player1Score, player2Score }
     Proposes final score

POST /api/matches/[matchId]/agree
     Current user agrees to proposed score

POST /api/matches/[matchId]/dispute
     Current user disputes the score
```

## Data Models

### Existing Tables (already in schema.ts)

- `challenges` - Challenge definitions per venue
- `challengeAttempts` - User challenge completions
- `matches` - 1v1 match records
- `playerStats` - XP, RP, and detailed stats
- `activePlayers` - Real-time venue presence

### Challenge Types

```typescript
type ChallengeType =
  | 'three_point' // 3-Point Shot
  | 'free_throw' // Free Throw
  | 'around_the_world' // Around the World
  | 'penalty_kick' // Soccer: Penalty Kick
  | 'free_kick' // Soccer: Free Kick
```

## UI Components

### VenueCard (for challenge venue selection)

```
┌─────────────────────────────────────┐
│ Esterhazy Park              📍 0.3km│
│ 6. Bezirk                           │
│ 🏆 3 challenges  👥 5 active        │
└─────────────────────────────────────┘
```

### ChallengeCard

```
┌─────────────────────────────────────┐
│ 3-Point Shot                  MEDIUM│
│ Make 5 three-pointers               │
│ +50 XP  +10 RP                      │
│ ┌───────────────────────────────┐  │
│ │        Start Challenge        │  │
│ └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### ChallengePlayScreen

```
┌─────────────────────────────────────┐
│           3-Point Shot              │
│                                     │
│         ┌─────────────┐             │
│         │     5/8     │             │
│         │ shots made  │             │
│         └─────────────┘             │
│                                     │
│   ┌─────┐           ┌─────┐        │
│   │  -1 │           │  +1 │        │
│   └─────┘           └─────┘        │
│                                     │
│   ┌───────────────────────────┐    │
│   │          STOP             │    │
│   └───────────────────────────┘    │
└─────────────────────────────────────┘
```

### MatchScoreScreen

```
┌─────────────────────────────────────┐
│        1v1 Match Result             │
│                                     │
│  ┌─────────┐     ┌─────────┐       │
│  │  You    │     │  Opp    │       │
│  │   12    │ vs  │   10    │       │
│  └─────────┘     └─────────┘       │
│                                     │
│   ┌─────────────────────────────┐  │
│   │          AGREE              │  │
│   └─────────────────────────────┘  │
│   ┌─────────────────────────────┐  │
│   │         DISPUTE             │  │
│   └─────────────────────────────┘  │
└─────────────────────────────────────┘
```

## XP/RP Calculation

### Solo Challenges

```typescript
function calculateChallengeRewards(
  challenge: Challenge,
  scoreValue: number,
  maxValue: number
): { xpEarned: number; rpEarned: number } {
  const accuracy = scoreValue / maxValue
  const difficultyMultiplier = { easy: 1, medium: 1.5, hard: 2 }[challenge.difficulty]

  // Base XP from challenge + bonus for accuracy
  const xpEarned = Math.round(challenge.xpReward * accuracy * difficultyMultiplier)
  const rpEarned = accuracy >= 0.8 ? challenge.rpReward : 0 // RP only if 80%+ accuracy

  return { xpEarned, rpEarned }
}
```

### 1v1 Matches

```typescript
const MATCH_REWARDS = {
  winnerXp: 100,
  winnerRp: 20,
  loserXp: 25, // Participation XP
}
```

## Stats Updates

### After Solo Challenge

```typescript
// Update playerStats based on challengeType
if (challengeType === 'three_point') {
  stats.threePointMade += scoreValue
  stats.threePointAttempted += maxValue
}
if (challengeType === 'free_throw') {
  stats.freeThrowMade += scoreValue
  stats.freeThrowAttempted += maxValue
}
stats.challengesCompleted += 1
stats.totalXp += xpEarned
stats.totalRp += rpEarned
stats.availableRp += rpEarned
```

### After 1v1 Match

```typescript
// Winner
winnerStats.matchesPlayed += 1
winnerStats.matchesWon += 1
winnerStats.totalXp += winnerXp
winnerStats.totalRp += winnerRp
winnerStats.availableRp += winnerRp

// Loser
loserStats.matchesPlayed += 1
loserStats.matchesLost += 1
loserStats.totalXp += loserXp // Participation XP
```

## Implementation Phases

### Phase 1: Solo Challenges (This PR)

1. Venue selection page (sorted by distance)
2. Venue challenges list
3. Challenge play screen (Start/Stop/Counter)
4. Result screen with XP
5. Stats update on completion

### Phase 2: 1v1 Matches (Future)

1. Opponent selection from active players
2. Match creation and ready state
3. Score entry and Agree/Dispute
4. Match result and stats update
5. NFC/proximity verification

## File Structure

```
src/
├── app/
│   ├── api/
│   │   ├── challenges/
│   │   │   ├── venues/
│   │   │   │   ├── route.ts              # GET venues for challenges
│   │   │   │   └── [venueId]/
│   │   │   │       └── route.ts          # GET venue challenges
│   │   │   └── [challengeId]/
│   │   │       ├── route.ts              # GET challenge details
│   │   │       └── attempt/
│   │   │           └── route.ts          # POST challenge attempt
│   │   └── matches/
│   │       ├── route.ts                  # POST create match
│   │       └── [matchId]/
│   │           ├── route.ts              # GET match details
│   │           ├── ready/route.ts        # POST ready
│   │           ├── score/route.ts        # POST score
│   │           ├── agree/route.ts        # POST agree
│   │           └── dispute/route.ts      # POST dispute
│   └── (app)/
│       └── challenges/
│           ├── page.tsx                  # Venue selection
│           ├── venue/
│           │   └── [venueId]/
│           │       ├── page.tsx          # Venue challenges
│           │       └── opponents/
│           │           └── page.tsx      # 1v1 opponents
│           └── [challengeId]/
│               ├── page.tsx              # Challenge instructions
│               ├── play/
│               │   └── page.tsx          # Start/Stop counter
│               └── result/
│                   └── page.tsx          # Result screen
├── lib/
│   └── challenges.ts                     # Challenge business logic
└── __tests__/
    └── challenges/
        ├── challenges.unit.test.ts
        └── challenges.integration.test.ts
```

## Testing Requirements

### Unit Tests

- XP/RP calculation functions
- Stats update logic
- Challenge validation
- Match state transitions

### Integration Tests

- GET /api/challenges/venues - returns sorted venues
- GET /api/challenges/venues/[id] - returns challenges
- POST /api/challenges/[id]/attempt - creates attempt, updates stats
- POST /api/matches - creates match
- POST /api/matches/[id]/agree - completes match, updates stats
