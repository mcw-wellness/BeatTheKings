# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Principles

This project strictly follows these core principles:

**KISS (Keep It Simple, Stupid)**
- Write simple, readable code over clever solutions
- Avoid premature optimization
- Choose straightforward implementations first

**YAGNI (You Aren't Gonna Need It)**
- Only build features that are needed RIGHT NOW
- Don't add functionality for potential future use
- Start with MVP tables/features, expand only when required

**TDD (Test-Driven Development)**
- Write tests before implementing features
- Ensure all new code has corresponding tests
- Run tests before committing changes

**CRITICAL: Database Change Protocol**
⚠️ **ALWAYS get user verification before making ANY data structure or database changes!**
- Present proposed schema changes for user approval
- Show migration plans before execution
- Explain impact of changes on existing data
- Never execute database migrations without explicit user confirmation

## Project Overview

**Beat the Kingz** is a location-based sports competition mobile web app built with Next.js. MVP starts with basketball and soccer, with plans to expand to running tracks, cycling routes, and skiing slopes. Players compete at local venues, complete video challenges, earn XP/RP, and compete for the title of "King" at their venue.

## Documentation Structure

All documentation files (`.md`) should be organized as follows:

```
/                           # Root
├── README.md               # Project overview (standard location)
├── CLAUDE.md               # AI assistant instructions (must stay at root)
├── docs/                   # All other documentation
│   ├── PRD_NEXTJS_MVP.md   # Product requirements
│   ├── DEPLOYMENT.md       # Deployment guide
│   ├── OAUTH_SETUP.md      # OAuth configuration
│   ├── STRUCTURE.md        # Project structure
│   ├── TDD_DEVELOPMENT_PLAN.md
│   ├── CLICKTHROUGH_PLAN.md
│   ├── GITHUB_SECRETS.md
│   ├── MVP_REVIEW_FINDINGS.md
│   └── GEOGRAPHIC_HIERARCHY_OPTIONS.md
└── prisma/                 # Database-specific docs
    ├── SCHEMA_DOCS.md      # ER diagrams & schema documentation
    └── CHANGELOG.md        # Schema evolution history
```

**Rules:**
- New documentation files go in `docs/`
- Database/schema docs go in `prisma/`
- Only `README.md` and `CLAUDE.md` stay at root

## Core Application Flow

1. **OAuth Login** (Page 1): OAuth provider authentication (Google, etc.)
2. **User Onboarding** (Page 2): Name, date of birth, gender, city selection
3. **Welcome/Main** (Page 3): Avatar creation required to unlock features (Ranking, Map, Challenge)
4. **Avatar Card** (Page 4): Customizable basketball outfit (hair, jersey, shorts, shoes). Displays crown when player is King of the Court, age group, stats (XP, Rank), and nearby active players with distances
5. **Ranking** (Page 5): Three-level rankings (Court/City/Country), top 10 lists, monthly challenges with prizes, sponsor section
6. **Map** (Page 6): Interactive court locations with active player counts, click for details, King of the Court indicators
7. **Courts & Challenges** (Page 7): List of courts, active/completed challenges, tutorials section
8. **Challenge Flow** (Pages 8-10): Instructions → Camera countdown → Recording → Try again/Upload → Results with XP earned

## Data Model

**Schema docs:** [prisma/SCHEMA_DOCS.md](prisma/SCHEMA_DOCS.md) | **Changelog:** [prisma/CHANGELOG.md](prisma/CHANGELOG.md)

### Core Tables

**Location System:**
- **Country, State, City, District** - Geographic hierarchy for rankings

**User & Avatar:**
- **User** - OAuth authentication and profile
- **Avatar** - Base appearance (skin tone, hair)
- **AvatarItem** - Catalog of available equipment
- **UserUnlockedItem** - Items unlocked per user
- **AvatarEquipment** - Equipped items per sport

**Sport & Venue:**
- **Sport** - First-class sport entity
- **Venue** - Locations linked to City/District

**Gameplay:**
- **Challenge** - Solo activities at venues
- **ChallengeAttempt** - User challenge completions
- **Match** - 1v1 player competitions
- **PlayerStats** - XP, RP, and detailed statistics per sport
- **ActivePlayer** - Real-time player tracking at venues

## Technology Stack

**Framework:** Next.js (App Router)
**Database:** PostgreSQL with Prisma ORM
**Authentication:** OAuth (Google, etc.)
**File Storage:** For challenge videos
**Geolocation:** For venue mapping and distance calculations
**Real-time:** For active player tracking and ranking updates

## Key Technical Features

### Location Services
- Display venues (courts/fields/tracks) on interactive map with active player counts
- Calculate distance from user to venues
- Filter venues by sport type and proximity
- Show "nearby active players" with live distances

### Video Challenge System
- 10-second countdown before recording
- Video upload with progress tracking
- Verification system (gesture/ID detection)
- Performance tracking (shots made/attempted, time)
- Immediate XP reward calculation

### Ranking System
- Three-tier rankings: Venue-level, City-level, Country-level
- Sport-specific rankings (separate for basketball, soccer, etc.)
- Real-time "King of the Venue" status with crown indicator
- Monthly challenge leaderboards (top 5)
- XP-based progression per sport

### Avatar Customization
- Unlockable equipment based on XP/achievements
- Visual representation of player status
- Display of age group and stats

### Progressive Feature Unlock
- Avatar creation required before accessing:
  - Ranking system
  - Map view
  - Challenge participation
- Visual indicators for locked features

## GitHub

Always use the `kaza` account for git operations:
```bash
gh auth switch --user kaza
```

## Development Setup

This is a greenfield Next.js project. Standard setup commands will be:

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Run tests
npm test

# Lint code
npm run lint
```

## Architecture Considerations

### State Management
- User authentication state (OAuth session)
- Avatar customization state
- Real-time active player data
- Challenge recording state (countdown, recording, upload progress)
- Match state (pending, in_progress, score agreement)

### API Routes Structure
```
/api/auth/[...nextauth]    # OAuth handlers
/api/users/profile
/api/users/avatar
/api/venues/nearby?sport=basketball
/api/venues/[venueId]
/api/rankings/venue/[venueId]
/api/rankings/city/[cityId]?sport=basketball
/api/rankings/country/[countryId]?sport=basketball
/api/challenges/[challengeId]
/api/challenges/[challengeId]/attempt
/api/matches
/api/matches/[matchId]
/api/matches/[matchId]/agree
```

### Page Routes Structure
```
/ (Landing/OAuth login)
/onboarding (User profile setup)
/welcome (Main welcome, feature unlock)
/avatar (Avatar customization)
/ranking (Three-tier rankings)
/map (Interactive venue map)
/challenges (Venues and challenges list)
/challenge/[id] (Challenge instructions)
/challenge/[id]/record (Camera & recording)
/challenge/[id]/results (Results & feedback)
/matches (1v1 match list)
/match/[id] (Match details & scoring)
```

### Critical UI/UX Elements
- Smooth page transitions (fade/slide animations)
- Pulsing logo animation
- Progressive unlock visual effects
- Real-time distance calculations
- Camera interface with countdown timer
- Video preview with retry functionality

### Security & Validation
- OAuth-based authentication (no password storage)
- Video verification for challenge submissions
- Match score mutual agreement system
- Geolocation validation for venue check-ins
- Rate limiting on challenge/match submissions
- Sport-specific video validation rules
