# PRD: Per-Venue Attempt History

## Overview

Show detailed attempt history for each challenge at each venue, including all attempts with scores/percentages and the best result highlighted.

## Current Behavior

- Shows only best score per challenge
- No attempt history visible
- Cannot see progress over time

## Required Behavior

- Show all attempts at each venue
- Display score/percentage for each attempt
- Highlight best result
- Show attempt date/time
- Track improvement over time

## User Flow

1. User on challenge type page (e.g., Free Throw)
2. Sees venue with challenge
3. Taps to expand/view attempts
4. Sees all attempts with scores
5. Best attempt highlighted with star/badge

## API Changes

### GET `/api/challenges/by-type/[type]`

Update response to include attempt history:

**Response (updated):**

```json
{
  "challenges": [
    {
      "id": "challenge-uuid",
      "name": "Free Throw Basic",
      "venueId": "venue-uuid",
      "venueName": "Donaupark Court",
      "attempts": 5,
      "bestScore": {
        "scoreValue": 8,
        "maxValue": 10,
        "accuracy": 80
      },
      "attemptHistory": [
        {
          "id": "attempt-uuid",
          "scoreValue": 8,
          "maxValue": 10,
          "accuracy": 80,
          "isBest": true,
          "completedAt": "2025-01-20T14:30:00Z"
        },
        {
          "id": "attempt-uuid-2",
          "scoreValue": 6,
          "maxValue": 10,
          "accuracy": 60,
          "isBest": false,
          "completedAt": "2025-01-19T10:15:00Z"
        }
      ]
    }
  ]
}
```

## UI Design

### Challenge Card with Attempt History

```
┌─────────────────────────────────────┐
│ Free Throw Basic           [easy]  │
│ Make 5 of 10 shots                 │
├─────────────────────────────────────┤
│ ⭐ Best: 8/10 (80%)                │
│    5 attempts total                │
├─────────────────────────────────────┤
│ Attempt History            [▼]     │
├─────────────────────────────────────┤
│ ⭐ Jan 20  8/10  80%  ← Best      │
│    Jan 19  6/10  60%              │
│    Jan 18  5/10  50%              │
│    Jan 17  4/10  40%              │
│    Jan 15  3/10  30%              │
└─────────────────────────────────────┘
```

### Collapsed State (default)

```
┌─────────────────────────────────────┐
│ Free Throw Basic           [easy]  │
│ Make 5 of 10 shots                 │
│ ⭐ Best: 8/10 (80%) • 5 attempts  │
│        [📊 View History]          │
└─────────────────────────────────────┘
```

### Progress Indicator

Show improvement trend:

- ↑ Improving (last attempt better than average)
- → Consistent (stable performance)
- ↓ Needs practice (declining)

## Database Schema

No changes needed - `challengeAttempts` table already stores:

- `scoreValue`, `maxValue`
- `accuracy`
- `completedAt`

## Acceptance Criteria

1. Challenge cards show attempt count
2. "View History" expands to show all attempts
3. Best attempt marked with star
4. Attempts sorted by date (newest first)
5. Shows date, score, and percentage for each
6. Collapsed by default, expandable on tap
7. Works for all challenge types
