# PRD: Matches Page

## Overview

The Matches Page (`/matches`) displays a user's match history including pending challenges, active matches, and completed/disputed matches. It serves as a central hub for tracking all 1v1 match activity.

## User Stories

1. As a player, I want to see all my matches in one place so I can track my activity
2. As a player, I want to filter matches by status so I can focus on what matters
3. As a player, I want to quickly navigate to continue an active match
4. As a player, I want to see my win/loss record with scores

## Page Route

**Route:** `/matches`
**Access:** Authenticated users only

## UI Design

### Header

- Back button (navigates to `/welcome`)
- Title: "My Matches"

### Filter Tabs

Four horizontal tabs for filtering:

- **All** - Shows all matches
- **Active** - `pending`, `accepted`, `in_progress`, `uploading`, `analyzing`
- **Done** - `completed`
- **Disputed** - `disputed`

### Match Card Component

Each match displays:

**Header Row:**

- Opponent avatar (48x48, circular)
- Opponent name ("vs [Name]")
- Status badge (colored, e.g., "Waiting", "Ready", "In Progress", "Completed")

**Metadata Row:**

- Venue name with pin icon
- Date (e.g., "Jan 5")

**Score Section (completed matches only):**

- Your score vs opponent score
- WIN/LOSS badge
- Green background for wins, gray for losses

**Status Messages:**

- `pending` + isChallenger: "Waiting for opponent to respond..."
- `pending` + !isChallenger: "You have a challenge request!"
- `accepted`: "Match accepted! Ready to start recording."
- `uploading`/`analyzing`: "AI is analyzing the match video..." (with spinner)
- `disputed`: "This match is under review."

**Action Button:**

- `pending` + isChallenger: "View"
- `pending` + !isChallenger: "Respond"
- `accepted`: "Start Match"
- `in_progress`: "Continue"
- `uploading`/`analyzing`: "View Progress"
- `completed`/`disputed`: "View Results"

### Empty State

When no matches exist for the selected filter:

- Message: "No matches yet" or "No [filter] matches"
- CTA button: "Find a Challenge" (navigates to `/challenges`)

### Loading State

- Centered spinner
- Text: "Loading matches..."

## Navigation Logic

| Status                 | Challenger | Destination                         |
| ---------------------- | ---------- | ----------------------------------- |
| `pending`              | true       | `/challenges/1v1/[matchId]/pending` |
| `pending`              | false      | `/challenges` (to respond)          |
| `accepted`             | any        | `/challenges/1v1/[matchId]/ready`   |
| `in_progress`          | any        | `/challenges/1v1/[matchId]/record`  |
| `uploading`            | any        | `/challenges/1v1/[matchId]/upload`  |
| `analyzing`            | any        | `/challenges/1v1/[matchId]/results` |
| `completed`            | any        | `/challenges/1v1/[matchId]/results` |
| `disputed`             | any        | `/challenges/1v1/[matchId]/results` |
| `cancelled`/`declined` | any        | `/matches/[matchId]`                |

## API Endpoint

### GET /api/matches

**Query Parameters:**

- `status` (optional): Comma-separated status values to filter by

**Response Structure:**

```typescript
interface MatchListResponse {
  matches: {
    id: string
    status: MatchStatus
    venueName: string
    isChallenger: boolean
    opponent: {
      id: string
      name: string | null
      avatar: { imageUrl: string | null }
    }
    player1Score: number | null
    player2Score: number | null
    winnerId: string | null
    createdAt: string
  }[]
}

type MatchStatus =
  | 'pending'
  | 'accepted'
  | 'in_progress'
  | 'uploading'
  | 'analyzing'
  | 'completed'
  | 'disputed'
  | 'cancelled'
  | 'declined'
```

### API Requirements

The existing `/api/matches` endpoint needs updates:

1. Include `player1Score` and `player2Score` in response
2. Include `winnerId` in response
3. Ensure consistent response format with/without status filter

## Data Flow

```
User loads /matches
    ↓
Fetch GET /api/matches
    ↓
Display matches with default filter (All)
    ↓
User clicks filter tab → Re-filter locally (no new API call)
    ↓
User clicks match card → Navigate based on status
```

## Technical Requirements

### Frontend (React/Next.js)

- Use `useState` for matches array and filter state
- Use `useEffect` to fetch matches on mount
- Use Next.js `Image` component for avatars
- Client-side filtering (data already loaded)

### Type Definitions

```typescript
type MatchStatus =
  | 'pending'
  | 'accepted'
  | 'in_progress'
  | 'uploading'
  | 'analyzing'
  | 'completed'
  | 'disputed'
  | 'cancelled'
  | 'declined'

type FilterType = 'all' | 'active' | 'completed' | 'disputed'

interface Match {
  id: string
  status: MatchStatus
  venueName: string
  isChallenger: boolean
  opponent: {
    id: string
    name: string | null
    avatar: { imageUrl: string | null }
  }
  player1Score: number | null
  player2Score: number | null
  winnerId: string | null
  createdAt: string
}
```

## Responsive Design

### Mobile (default)

- Full-width cards
- Stacked layout
- Touch-friendly (44px min touch targets)
- max-width: lg (512px) centered

### Tablet/Desktop

- Same layout (mobile-first app)
- Hover states on cards

## Acceptance Criteria

1. [ ] Page loads and fetches user's matches
2. [ ] Filter tabs work correctly (All, Active, Done, Disputed)
3. [ ] Match cards display correct information based on status
4. [ ] Completed matches show scores and WIN/LOSS indicator
5. [ ] Navigation works correctly for each match status
6. [ ] Empty state displays when no matches for filter
7. [ ] Loading state shows while fetching
8. [ ] All lint and type checks pass
9. [ ] Unit tests cover helper functions
10. [ ] Integration tests cover API endpoint

## Out of Scope

- Pull-to-refresh
- Infinite scroll/pagination (limit to 20 matches for MVP)
- Real-time updates (user must refresh)
- Match deletion/cancellation from this page

## Test Plan

### Unit Tests

1. `getFilteredMatches()` - filters matches by status correctly
2. `getStatusBadge()` - returns correct badge for each status
3. `getMatchAction()` - returns correct action text
4. `getUserScore()` / `getOpponentScore()` - calculates scores correctly
5. `isWinner()` - determines winner correctly

### Integration Tests

1. GET /api/matches returns user's matches
2. GET /api/matches?status=pending,accepted filters correctly
3. Response includes all required fields
4. Unauthorized request returns 401
