# PRD: Challenge Type Pages

## Overview

Individual pages for each challenge type accessed from the Challenges Dashboard.

## Pages

### 1. `/challenges/1v1` - 1v1 Challenge History

Shows user's 1v1 match history with opponents.

**UI Layout:**

```
┌─────────────────────────────────┐
│ [Logo] 1v1 Challenges           │
├─────────────────────────────────┤
│ Matches Played: 5               │
│ Wins: 3 | Losses: 2             │
├─────────────────────────────────┤
│ Recent Matches:                 │
│ ┌─────────────────────────────┐ │
│ │ vs Player Name    W 10-8    │ │
│ │ Jan 20, 2026 • Venue Name   │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ vs Player Name    L 5-10    │ │
│ │ Jan 19, 2026 • Venue Name   │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ [Find Opponent] button          │
└─────────────────────────────────┘
```

**API:** `GET /api/challenges/1v1/history`

```typescript
interface Match1v1History {
  id: string
  opponent: {
    id: string
    name: string
    avatarUrl: string | null
  }
  venueName: string
  myScore: number
  opponentScore: number
  won: boolean
  completedAt: string
}

interface Response {
  stats: {
    totalMatches: number
    wins: number
    losses: number
  }
  matches: Match1v1History[]
}
```

---

### 2. `/challenges/free-throw` - Free Throw Challenges

### 3. `/challenges/three-point` - 3-Point Shot Challenges

### 4. `/challenges/around-the-world` - Around the World Challenges

All three pages share the same structure - list challenges of that type grouped by venue.

**UI Layout:**

```
┌─────────────────────────────────┐
│ [Logo] Free Throw Challenges    │
├─────────────────────────────────┤
│ Progress: 2/3 completed         │
│ [████████░░░░] 67%              │
├─────────────────────────────────┤
│ Venue: Esterhazy Park           │
│ ┌─────────────────────────────┐ │
│ │ Free Throw Basic      ✓    │ │
│ │ Best: 8/10 (80%)           │ │
│ │ [Try Again]                │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ Free Throw Advanced        │ │
│ │ Not attempted              │ │
│ │ [Start]                    │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ Venue: Prater Park              │
│ ┌─────────────────────────────┐ │
│ │ Free Throw Pro        ✓    │ │
│ │ Best: 9/10 (90%)           │ │
│ │ [Try Again]                │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

**API:** `GET /api/challenges/by-type/[type]`

Where `[type]` is `free_throw`, `three_point`, or `around_the_world`.

```typescript
interface ChallengeWithAttempts {
  id: string
  name: string
  description: string
  difficulty: string
  xpReward: number
  venueName: string
  venueId: string
  attempts: number
  bestScore: {
    scoreValue: number
    maxValue: number
    accuracy: number
  } | null
}

interface Response {
  challengeType: string
  displayName: string
  total: number
  completed: number
  challenges: ChallengeWithAttempts[]
}
```

---

### 5. `/challenges/sponsored` - Sponsored Challenges

Placeholder page for future sponsored challenges (e.g., "A1 Super Challenge").

**UI Layout:**

```
┌─────────────────────────────────┐
│ [Logo] Sponsored Challenges     │
├─────────────────────────────────┤
│                                 │
│      🏆 Coming Soon 🏆          │
│                                 │
│  Sponsored challenges will      │
│  appear here.                   │
│                                 │
│  Stay tuned for exciting        │
│  challenges from our partners!  │
│                                 │
└─────────────────────────────────┘
```

---

## Navigation

- From Challenges Dashboard → tap row → navigate to type page
- From type page → tap challenge → navigate to `/challenges/[challengeId]`
- From type page → "Find Opponent" → navigate to venue selection

---

## Routes Summary

| Route                          | Description                    |
| ------------------------------ | ------------------------------ |
| `/challenges/1v1`              | 1v1 match history              |
| `/challenges/free-throw`       | Free throw challenges by venue |
| `/challenges/three-point`      | 3-point challenges by venue    |
| `/challenges/around-the-world` | Around the world by venue      |
| `/challenges/sponsored`        | Coming soon placeholder        |

---

## API Endpoints Summary

| Endpoint                         | Method | Description                  |
| -------------------------------- | ------ | ---------------------------- |
| `/api/challenges/1v1/history`    | GET    | Get user's 1v1 match history |
| `/api/challenges/by-type/[type]` | GET    | Get challenges by type       |
