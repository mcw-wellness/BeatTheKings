# PRD: Trump Card Flow

**Version:** 1.0
**Date:** December 2025
**Status:** Ready for Development

---

## Overview

The Trump Card is the **central element** of Beat The Kingz. It displays a player's identity, stats, achievements, and serves as the verification tool. It appears when clicking on any player's avatar throughout the app (rankings, active players, profile).

---

## UI Reference

Based on the provided design mockup:

```
┌─────────────────────────────────────────────────────────┐
│  Tom Tom                    👑 I'm the King    🏆 #1   │
│                                                         │
│         ┌─────────────────┐    ┌──────────────────┐    │
│         │                 │    │ XP   XP  227/192 │    │
│         │                 │    │ 🪙  RP     250   │    │
│         │    [AVATAR]     │    │ Total Points 1420│    │
│         │                 │    │ WinRate     23%  │    │
│         │                 │    └──────────────────┘    │
│         └─────────────────┘                            │
│                                                         │
│  ⭐ 23%                     ┌──────────────────────┐   │
│                             │ 🏀 Marks      1/3    │   │
│                             │ 🏀 Challenges 7/13   │   │
│                             │ 🏀 Total Pts  1420   │   │
│                             │ 🏀 WinRate    23%    │   │
│                             └──────────────────────┘   │
│                                                         │
│ ┌─────────────────────┐  ┌─────────────────────────┐   │
│ │ December            │  │ COMING SOON             │   │
│ │ BB Championship     │  │ 3P Shooting Championship│   │
│ │ sponsored by AVIS   │  │ sponsored by K1         │   │
│ └─────────────────────┘  └─────────────────────────┘   │
│                                                         │
│                        ❌                               │
└─────────────────────────────────────────────────────────┘
```

---

## Data Requirements

### From Existing Schema

| UI Element      | Source Table  | Field                                   |
| --------------- | ------------- | --------------------------------------- |
| Player Name     | `users`       | `name` (optional, may not display)      |
| Avatar Image    | `avatars`     | `imageUrl` or SVG fallback              |
| Rank            | Calculated    | Position in `playerStats` by XP         |
| XP              | `playerStats` | `totalXp`                               |
| RP              | `playerStats` | `availableRp`                           |
| Total Points    | `playerStats` | `totalPointsScored`                     |
| Win Rate        | `playerStats` | `matchesWon / matchesPlayed * 100`      |
| Matches (Marks) | `playerStats` | `matchesWon / matchesPlayed`            |
| Challenges      | `playerStats` | `challengesCompleted` / total available |
| Is King         | Calculated    | Highest XP at venue/city/country        |

### Crown System

| Crown Type          | Criteria                |
| ------------------- | ----------------------- |
| King of the Court   | #1 XP at specific venue |
| King of the City    | #1 XP in city           |
| King of the Country | #1 XP in country        |

---

## API Endpoints

### GET /api/players/[userId]/trump-card

Get a player's Trump Card data.

**Response (200):**

```json
{
  "player": {
    "id": "uuid",
    "name": "Tom Tom",
    "avatar": {
      "imageUrl": "https://...",
      "skinTone": "medium",
      "hairStyle": "short",
      "hairColor": "black"
    }
  },
  "stats": {
    "rank": 1,
    "xp": 227,
    "xpToNextLevel": 192,
    "rp": 250,
    "totalPoints": 1420,
    "winRate": 23,
    "matchesPlayed": 10,
    "matchesWon": 3,
    "matchesLost": 7,
    "challengesCompleted": 7,
    "totalChallenges": 13
  },
  "crowns": {
    "isKingOfCourt": true,
    "isKingOfCity": false,
    "isKingOfCountry": false,
    "courtName": "Esterhazy Park",
    "cityName": null,
    "countryName": null
  },
  "detailedStats": {
    "threePointAccuracy": 45,
    "freeThrowAccuracy": 67,
    "totalPointsScored": 1420
  },
  "events": [
    {
      "id": "uuid",
      "name": "December BB Championship",
      "sponsor": "AVIS",
      "status": "active"
    },
    {
      "id": "uuid",
      "name": "3P Shooting Championship",
      "sponsor": "K1",
      "status": "coming_soon"
    }
  ]
}
```

### GET /api/players/me/trump-card

Get current user's own Trump Card (shorthand).

---

## Component Structure

```
src/components/trump-card/
├── TrumpCard.tsx           # Main modal component
├── TrumpCardHeader.tsx     # Name, crown, rank
├── TrumpCardAvatar.tsx     # Avatar display
├── TrumpCardStats.tsx      # XP, RP, Points, WinRate
├── TrumpCardDetails.tsx    # Marks, Challenges breakdown
├── TrumpCardEvents.tsx     # Championships section
└── index.ts                # Barrel export
```

---

## UI Specifications

### Colors (from mockup)

| Element        | Color                             |
| -------------- | --------------------------------- |
| Background     | Dark gradient (#1a1a2e → #16213e) |
| Card border    | Gold gradient                     |
| Crown          | Gold (#FFD700)                    |
| Stats panel    | Dark semi-transparent             |
| Text primary   | White                             |
| Text secondary | Gold/Yellow                       |
| XP badge       | Purple                            |
| RP badge       | Gold coin                         |

### Responsive Design

| Screen  | Behavior                   |
| ------- | -------------------------- |
| Mobile  | Full-screen modal          |
| Tablet  | Centered modal (80% width) |
| Desktop | Centered modal (500px max) |

### Animations

- Slide up on open
- Fade out on close
- Crown sparkle effect for Kings
- XP bar fill animation

---

## User Flow

```
┌──────────────────────────────────────────────────────────┐
│                     TRUMP CARD FLOW                       │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  User clicks on:                                          │
│  • Avatar in Rankings                                     │
│  • Avatar in Active Players                               │
│  • Own profile                                            │
│           │                                               │
│           ▼                                               │
│  ┌─────────────────────────────────┐                     │
│  │  Fetch Trump Card Data          │                     │
│  │  GET /api/players/[id]/trump-card│                    │
│  └─────────────────────────────────┘                     │
│           │                                               │
│           ▼                                               │
│  ┌─────────────────────────────────┐                     │
│  │  Display Trump Card Modal       │                     │
│  │  • Avatar with crown if King    │                     │
│  │  • All stats                    │                     │
│  │  • Events section               │                     │
│  └─────────────────────────────────┘                     │
│           │                                               │
│           ▼                                               │
│  User clicks X or outside modal                          │
│           │                                               │
│           ▼                                               │
│  Modal closes                                             │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

---

## Implementation Order

1. **Create API route** `/api/players/[userId]/trump-card`
2. **Create TrumpCard component** with all subcomponents
3. **Add modal/overlay system** if not exists
4. **Integrate with Rankings** (Phase 2)
5. **Integrate with Active Players** (Phase 3)

---

## Test Scenarios

### Unit Tests

- [ ] Calculate rank correctly from XP
- [ ] Calculate win rate (handle 0 matches)
- [ ] Determine King status correctly
- [ ] Format XP progress (current/next level)

### Integration Tests

- [ ] GET returns correct player data
- [ ] GET returns 404 for non-existent player
- [ ] Crown status reflects actual rankings
- [ ] Stats match database values

### UI Tests

- [ ] Modal opens on avatar click
- [ ] Modal closes on X click
- [ ] Modal closes on outside click
- [ ] Crown displays for Kings only
- [ ] Stats display correctly

---

## Future Enhancements

- Share Trump Card as image
- Compare two Trump Cards
- Historical stats view
- Achievement badges display
