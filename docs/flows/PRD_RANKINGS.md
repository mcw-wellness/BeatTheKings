# PRD: Rankings Flow

**Version:** 1.0
**Date:** December 2025
**Status:** Ready for Development

---

## Overview

The Rankings system displays player leaderboards at three levels: Venue (Court), City, and Country. Players are ranked by XP within their sport. Clicking any player opens their Trump Card.

---

## Requirements (from Beat The Kings.txt)

1. Each player should be clickable to open their Trump Card
2. Below the ranking, only the player's own rank and current King should be displayed
3. No age groups necessary - app automatically assigns correct age group
4. Rankings sorted by XP

---

## Ranking Levels

| Level   | Scope                 | King Title          |
| ------- | --------------------- | ------------------- |
| Venue   | Single court/field    | King of the Court   |
| City    | All venues in city    | King of the City    |
| Country | All venues in country | King of the Country |

---

## UI Design

```
┌─────────────────────────────────────────────────────────┐
│  RANKINGS                              [🏀] [⚽]        │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  [Court]  [City]  [Country]                     │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  👑 KING OF THE COURT                                  │
│  ┌─────────────────────────────────────────────────┐   │
│  │  #1  [Avatar] Tom Tom        XP: 500   👑       │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  TOP PLAYERS                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │  #2  [Avatar] Player Name    XP: 450            │   │
│  │  #3  [Avatar] Player Name    XP: 420            │   │
│  │  #4  [Avatar] Player Name    XP: 380            │   │
│  │  #5  [Avatar] Player Name    XP: 350            │   │
│  │  #6  [Avatar] Player Name    XP: 320            │   │
│  │  #7  [Avatar] Player Name    XP: 290            │   │
│  │  #8  [Avatar] Player Name    XP: 260            │   │
│  │  #9  [Avatar] Player Name    XP: 230            │   │
│  │  #10 [Avatar] Player Name    XP: 200            │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  YOUR RANK                                             │
│  ┌─────────────────────────────────────────────────┐   │
│  │  #23 [Avatar] You            XP: 100            │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Data Requirements

### From Existing Schema

| Data             | Source                                   |
| ---------------- | ---------------------------------------- |
| Player list      | `users` + `playerStats`                  |
| Avatar           | `avatars`                                |
| XP               | `playerStats.totalXp`                    |
| Rank             | Calculated (position by XP)              |
| Venue rankings   | `playerStats` filtered by venue activity |
| City rankings    | `users.cityId` + `playerStats`           |
| Country rankings | `cities.countryId` + `playerStats`       |

---

## API Endpoints

### GET /api/rankings

Get rankings with filters.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `level` | string | `city` | `venue`, `city`, or `country` |
| `sport` | string | `basketball` | Sport slug |
| `venueId` | string | - | Required if level=venue |
| `cityId` | string | - | Optional, defaults to user's city |
| `countryId` | string | - | Optional, defaults to user's country |
| `limit` | number | 10 | Max players to return |

**Response (200):**

```json
{
  "level": "city",
  "sport": "basketball",
  "location": {
    "id": "uuid",
    "name": "Vienna"
  },
  "king": {
    "id": "uuid",
    "rank": 1,
    "name": "Tom Tom",
    "xp": 500,
    "avatar": {
      "imageUrl": "...",
      "skinTone": "medium",
      "hairStyle": "short",
      "hairColor": "black"
    }
  },
  "rankings": [
    {
      "id": "uuid",
      "rank": 1,
      "name": "Tom Tom",
      "xp": 500,
      "avatar": {...},
      "isKing": true
    },
    {
      "id": "uuid",
      "rank": 2,
      "name": "Player 2",
      "xp": 450,
      "avatar": {...},
      "isKing": false
    }
  ],
  "currentUser": {
    "id": "uuid",
    "rank": 23,
    "name": "You",
    "xp": 100,
    "avatar": {...},
    "isKing": false
  },
  "totalPlayers": 150
}
```

---

## Component Structure

```
src/app/(app)/ranking/
└── page.tsx                # Rankings page

src/components/rankings/
├── RankingTabs.tsx         # Court/City/Country tabs
├── RankingList.tsx         # List of ranked players
├── RankingItem.tsx         # Single player row
├── KingCard.tsx            # Highlighted king section
├── CurrentUserRank.tsx     # User's own rank at bottom
└── index.ts                # Barrel export
```

---

## User Flow

```
┌──────────────────────────────────────────────────────────┐
│                     RANKINGS FLOW                         │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  User navigates to Rankings                               │
│           │                                               │
│           ▼                                               │
│  ┌─────────────────────────────────┐                     │
│  │  Load City Rankings (default)   │                     │
│  │  GET /api/rankings?level=city   │                     │
│  └─────────────────────────────────┘                     │
│           │                                               │
│           ▼                                               │
│  ┌─────────────────────────────────┐                     │
│  │  Display:                       │                     │
│  │  • King at top with crown       │                     │
│  │  • Top 10 players               │                     │
│  │  • User's own rank at bottom    │                     │
│  └─────────────────────────────────┘                     │
│           │                                               │
│           ▼                                               │
│  User clicks on player avatar                            │
│           │                                               │
│           ▼                                               │
│  ┌─────────────────────────────────┐                     │
│  │  Open Trump Card modal          │                     │
│  │  (shows full player stats)      │                     │
│  └─────────────────────────────────┘                     │
│                                                           │
│  User can switch tabs:                                    │
│  • Court → venue-level rankings                          │
│  • City → city-level rankings                            │
│  • Country → country-level rankings                      │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

---

## Implementation Order

1. **Create rankings library** - `src/lib/rankings.ts`
2. **Create API route** - `/api/rankings`
3. **Create UI components** - RankingItem, KingCard, etc.
4. **Create Rankings page** - `/ranking`
5. **Integrate Trump Card** - Open on avatar click

---

## Test Scenarios

### Unit Tests

- [ ] Calculate rank correctly from XP list
- [ ] Handle ties (same XP)
- [ ] Filter by venue/city/country
- [ ] Determine King correctly

### Integration Tests

- [ ] GET returns rankings sorted by XP
- [ ] GET includes current user's rank
- [ ] GET identifies King correctly
- [ ] Level filter works (venue/city/country)
- [ ] Sport filter works

### UI Tests

- [ ] Tabs switch ranking levels
- [ ] Clicking avatar opens Trump Card
- [ ] King highlighted with crown
- [ ] Current user shown at bottom
- [ ] Loading state displayed

---

## Edge Cases

1. **New user with no stats** - Show rank as "-" or last
2. **User is the King** - Highlight in both King section and list
3. **No players in venue** - Show empty state
4. **Tie in XP** - Both get same rank, next rank skipped

---

## Future Enhancements

- Weekly/Monthly rankings reset
- Ranking history graph
- Rank change indicators (↑↓)
- Filter by age group (optional)
