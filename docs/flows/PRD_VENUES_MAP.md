# PRD: Venues/Map Flow

**Version:** 1.0
**Date:** January 2026
**Status:** Ready for Development

---

## Overview

The Venues/Map feature displays all available sports venues (courts, fields, parks) to users. Venues are sorted by distance from the user's current location, with the closest venue at the top. Each venue shows active player count and available challenges.

---

## Requirements (from Beat The Kings.txt)

1. All venues must display distance from the user
2. Sorted by proximity - closest park always at top
3. When entering Challenges section, players should first select the park
4. Show active player count at each venue
5. Click venue to see details and available challenges

---

## User Stories

1. **As a player**, I want to see nearby venues sorted by distance so I can find the closest court to play
2. **As a player**, I want to see how many active players are at each venue so I can find opponents
3. **As a player**, I want to click a venue to see available challenges and active players
4. **As a player**, I want to see the King of the Court for each venue

---

## UI Design

### Venues List View

```
┌─────────────────────────────────────────────────────────┐
│  ← Back            VENUES                    [🏀] [⚽]   │
│                                                         │
│  📍 Showing venues near you                            │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  🏀 Esterhazy Park                    0.3 km    │   │
│  │  👥 5 active players                            │   │
│  │  👑 King: Michael Jordan                        │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  🏀 Schönborn Park                    0.8 km    │   │
│  │  👥 2 active players                            │   │
│  │  👑 King: LeBron James                          │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  🏀 Weghuber Park                     1.2 km    │   │
│  │  👥 0 active players                            │   │
│  │  👑 No King yet                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  [Map View] Show on Map                         │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Venue Detail View

```
┌─────────────────────────────────────────────────────────┐
│  ← Back            ESTERHAZY PARK                       │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  [Venue Image/Map]                              │   │
│  │                                                  │   │
│  │  📍 0.3 km away                                 │   │
│  │  🏠 6. Bezirk, Vienna                           │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  👑 KING OF THE COURT                                  │
│  ┌─────────────────────────────────────────────────┐   │
│  │  [Avatar] Michael Jordan       XP: 5,000        │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  👥 ACTIVE PLAYERS (5)                                 │
│  ┌─────────────────────────────────────────────────┐   │
│  │  [Avatar] #2   [Avatar] #5   [Avatar] #8        │   │
│  │  [Avatar] #12  [Avatar] #23                     │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  🏆 CHALLENGES                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  3-Point Shot      50 XP    [Start]            │   │
│  │  Free Throw        30 XP    [Start]            │   │
│  │  Around the World  100 XP   [Start]            │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  [Check In]  I'm at this venue                  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Data Requirements

### From Existing Schema

| Data | Source |
|------|--------|
| Venue list | `venues` table |
| Venue location | `venues.latitude`, `venues.longitude` |
| City/District | `venues.cityId`, `venues.district` |
| Active players | `activePlayers` table |
| Challenges | `challenges` table |
| King of Court | `playerStats` (highest XP at venue) |

### User Location

- Request browser geolocation permission
- Calculate distance using Haversine formula
- Sort venues by distance ascending

---

## API Endpoints

### GET /api/venues

Get list of venues sorted by distance.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `lat` | number | - | User's latitude |
| `lng` | number | - | User's longitude |
| `sport` | string | `basketball` | Filter by sport |
| `limit` | number | 20 | Max venues to return |
| `cityId` | string | - | Optional city filter |

**Response (200):**
```json
{
  "venues": [
    {
      "id": "uuid",
      "name": "Esterhazy Park",
      "address": "Esterhazypark, 1060 Wien",
      "district": "6. Bezirk",
      "latitude": 48.1962,
      "longitude": 16.3551,
      "distance": 0.3,
      "distanceUnit": "km",
      "activePlayerCount": 5,
      "king": {
        "id": "uuid",
        "name": "Michael Jordan",
        "xp": 5000,
        "avatar": { "imageUrl": "..." }
      },
      "challengeCount": 3
    }
  ],
  "totalVenues": 3
}
```

### GET /api/venues/:id

Get single venue details with active players and challenges.

**Response (200):**
```json
{
  "venue": {
    "id": "uuid",
    "name": "Esterhazy Park",
    "address": "Esterhazypark, 1060 Wien",
    "district": "6. Bezirk",
    "latitude": 48.1962,
    "longitude": 16.3551,
    "distance": 0.3,
    "distanceUnit": "km",
    "imageUrl": "...",
    "description": "Basketball court in Esterhazy Park"
  },
  "king": {
    "id": "uuid",
    "name": "Michael Jordan",
    "xp": 5000,
    "avatar": { "imageUrl": "..." }
  },
  "activePlayers": [
    {
      "id": "uuid",
      "rank": 2,
      "avatar": { "imageUrl": "..." },
      "distance": 5
    }
  ],
  "challenges": [
    {
      "id": "uuid",
      "name": "3-Point Shot",
      "description": "Make 5 three-point shots",
      "xpReward": 50,
      "difficulty": "medium"
    }
  ]
}
```

### POST /api/venues/:id/check-in

Check in to a venue (mark as active player).

**Request Body:**
```json
{
  "latitude": 48.1962,
  "longitude": 16.3551
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Checked in to Esterhazy Park"
}
```

---

## Distance Calculation

### Haversine Formula

```typescript
function calculateDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371 // Earth's radius in km
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c // Distance in km
}
```

### Distance Display

| Distance | Display |
|----------|---------|
| < 1 km | "0.3 km" |
| 1-10 km | "2.5 km" |
| > 10 km | "15 km" |

---

## Component Structure

```
src/app/(app)/venues/
├── page.tsx                # Venues list page
└── [id]/
    └── page.tsx            # Venue detail page

src/lib/
├── venues.ts               # Venue data functions
└── distance.ts             # Distance calculation utils

src/app/api/venues/
├── route.ts                # GET /api/venues
└── [id]/
    ├── route.ts            # GET /api/venues/:id
    └── check-in/
        └── route.ts        # POST /api/venues/:id/check-in
```

---

## User Flow

```
┌──────────────────────────────────────────────────────────┐
│                     VENUES FLOW                           │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  User navigates to Venues                                 │
│           │                                               │
│           ▼                                               │
│  ┌─────────────────────────────────┐                     │
│  │  Request geolocation permission │                     │
│  └─────────────────────────────────┘                     │
│           │                                               │
│     ┌─────┴─────┐                                        │
│     ▼           ▼                                        │
│  Granted     Denied                                      │
│     │           │                                        │
│     │           ▼                                        │
│     │    Show venues by city                             │
│     │    (no distance sorting)                           │
│     ▼                                                    │
│  ┌─────────────────────────────────┐                     │
│  │  GET /api/venues?lat=X&lng=Y   │                     │
│  │  Returns venues sorted by dist  │                     │
│  └─────────────────────────────────┘                     │
│           │                                               │
│           ▼                                               │
│  ┌─────────────────────────────────┐                     │
│  │  Display venue cards:           │                     │
│  │  • Venue name                   │                     │
│  │  • Distance                     │                     │
│  │  • Active player count          │                     │
│  │  • King of the Court            │                     │
│  └─────────────────────────────────┘                     │
│           │                                               │
│           ▼                                               │
│  User taps on venue card                                 │
│           │                                               │
│           ▼                                               │
│  ┌─────────────────────────────────┐                     │
│  │  GET /api/venues/:id            │                     │
│  │  Show venue details:            │                     │
│  │  • King section                 │                     │
│  │  • Active players               │                     │
│  │  • Available challenges         │                     │
│  │  • Check-in button              │                     │
│  └─────────────────────────────────┘                     │
│           │                                               │
│           ▼                                               │
│  User can:                                                │
│  • Click player avatar → Trump Card                      │
│  • Start a challenge                                     │
│  • Check in to venue                                     │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

---

## Implementation Order

1. **Create distance utility** - `src/lib/distance.ts`
2. **Create venues library** - `src/lib/venues.ts`
3. **Create API routes** - `/api/venues`, `/api/venues/:id`
4. **Create Venues list page** - `/venues`
5. **Create Venue detail page** - `/venues/:id`
6. **Add geolocation hook** - `useGeolocation`
7. **Integrate with navigation** - Add to main menu

---

## Test Scenarios

### Unit Tests
- [ ] Calculate distance correctly (Haversine)
- [ ] Format distance display (km)
- [ ] Sort venues by distance
- [ ] Count active players correctly
- [ ] Determine King of Court correctly

### Integration Tests
- [ ] GET /api/venues returns sorted by distance
- [ ] GET /api/venues/:id returns full details
- [ ] POST /api/venues/:id/check-in creates active player
- [ ] Active player expires when moved away

### UI Tests
- [ ] Geolocation permission request works
- [ ] Venues sorted by distance
- [ ] Clicking venue opens detail page
- [ ] Active players displayed
- [ ] Check-in button works

---

## Edge Cases

1. **Geolocation denied** - Show venues by city, no distance
2. **No venues in area** - Show "No venues nearby" message
3. **Venue has no King** - Show "No King yet"
4. **No active players** - Show "Be the first to check in!"
5. **User already checked in** - Show "You're here" badge

---

## Permissions

- Geolocation: Optional but recommended
- If denied, venues shown by user's city without distance

---

## Future Enhancements

- Map view with pins for each venue
- Filter by sport type
- Favorite venues
- Venue ratings/reviews
- Directions integration (Google Maps)
