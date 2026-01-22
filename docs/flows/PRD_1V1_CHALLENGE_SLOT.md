# PRD: 1v1 Challenge Slot on Dashboard

## Overview

Update the 1v1 Challenge slot on the Challenges Dashboard to show active players at nearby venues, encouraging users to go challenge them in person.

## Current Behavior

- Shows total matches played count (e.g., "5")
- Clicking navigates to `/challenges/1v1` showing match history

## Required Behavior

- Shows nearby venues with active players
- Each venue displays:
  - Venue name
  - Active player count
  - Distance from user
- Clicking a venue navigates to Map with that venue selected
- If no active players nearby, show "No active players nearby"

## User Flow

1. User opens Challenges Dashboard
2. Sees 1v1 Challenge slot with nearby venues and active player counts
3. Taps a venue
4. Navigates to Map with venue pre-selected and directions available

## API Changes

### GET `/api/challenges/1v1/active-venues`

Returns venues with active players sorted by proximity.

**Query Parameters:**

- `lat` (required): User latitude
- `lng` (required): User longitude
- `limit` (optional): Max venues to return (default: 5)

**Response:**

```json
{
  "venues": [
    {
      "id": "venue-uuid",
      "name": "Donaupark Court",
      "distance": 1.2,
      "distanceFormatted": "1.2 km",
      "activePlayerCount": 3,
      "activePlayers": [
        {
          "id": "user-uuid",
          "avatarUrl": "https://...",
          "rank": 1
        }
      ]
    }
  ],
  "totalActiveVenues": 2
}
```

## UI Design

### Challenges Dashboard - 1v1 Slot

```
┌─────────────────────────────────────┐
│ ⚔️  1v1 Challenge                   │
├─────────────────────────────────────┤
│ 📍 Donaupark Court     👥 3  1.2 km │
│ 📍 Prater Sports       👥 2  2.5 km │
│ 📍 Augarten Field      👥 1  3.1 km │
└─────────────────────────────────────┘
```

If no active players:

```
┌─────────────────────────────────────┐
│ ⚔️  1v1 Challenge                   │
├─────────────────────────────────────┤
│    No active players nearby         │
│    Check back later!                │
└─────────────────────────────────────┘
```

## Acceptance Criteria

1. 1v1 slot shows venues with active players
2. Venues sorted by distance (closest first)
3. Each venue shows name, active count, distance
4. Tapping venue navigates to Map with venue selected
5. Shows empty state when no active players
6. Requires user location permission
