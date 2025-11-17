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

**Beat the Kingz** is a location-based sports competition mobile web app built with Next.js. MVP starts with basketball and soccer, with plans to expand to running tracks, cycling routes, and skiing slopes. Players compete at local venues, complete video challenges, earn XP, and compete for the title of "King" at their venue.

**See DATA_MODEL.md for complete database schema with MVP vs Future phase breakdown.**

## Core Application Flow

1. **Email Verification** (Page 1): Email input → verification code → validation
2. **User Registration** (Page 2): Name, age, gender, location → Face recognition/photo upload
3. **Welcome/Main** (Page 3): Avatar creation required to unlock features (Ranking, Map, Challenge)
4. **Avatar Card** (Page 4): Customizable basketball outfit (hair, jersey, shorts, shoes). Displays crown when player is King of the Court, age group, stats (XP, Rank), and nearby active players with distances
5. **Ranking** (Page 5): Three-level rankings (Court/City/Country), top 10 lists, monthly challenges with prizes, sponsor section
6. **Map** (Page 6): Interactive court locations with active player counts, click for details, King of the Court indicators
7. **Courts & Challenges** (Page 7): List of courts, active/completed challenges, tutorials section
8. **Challenge Flow** (Pages 8-10): Instructions → Camera countdown → Recording → Try again/Upload → Results with XP earned

## Data Model

**For detailed schema, MVP phases, and future enhancements, see DATA_MODEL.md**
**For visual ER diagrams, see ER_DIAGRAM.md**

### MVP Phase 1 Core Tables (Implement First)
- **User** - Authentication and profile
- **Venue** - Sport-agnostic locations (courts, fields, tracks, slopes)
- **Challenge** - Activities at venues
- **ChallengeSubmission** - User attempts with video proof
- **PlayerStats** - XP, rank, and statistics per sport

### MVP Phase 2 (Add After Core Works)
- **Avatar** - User avatar and customization
- **AvatarEquipment** - Sport-specific outfit loadouts
- **ActivePlayer** - Real-time player tracking
- **MonthlyChallenge** - Monthly competitions

### Future Enhancements (Post-MVP)
- **Sport** - Sport as first-class entity
- **EquipmentCatalog** - All available items
- **UserEquipment** - Unlocked items tracking
- **VenueRanking, CityRanking, CountryRanking** - Optimized ranking tables
- **ChallengeTemplate** - Reusable challenge definitions
- **Sponsor** - Sponsor management

## Technology Stack

**Framework:** Next.js (App Router)
**Database:** TBD (PostgreSQL recommended for geospatial queries)
**Authentication:** Email verification flow with codes
**File Storage:** For profile pictures and challenge videos
**Geolocation:** For court mapping and distance calculations
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
- User authentication state (email verification, logged-in status)
- Avatar customization state
- Real-time active player data
- Challenge recording state (countdown, recording, upload progress)

### API Routes Structure
```
/api/auth/verify-email
/api/auth/verify-code
/api/users/profile
/api/users/avatar
/api/venues/nearby?sport=basketball
/api/venues/[venueId]
/api/rankings/venue/[venueId]
/api/rankings/city/[city]?sport=basketball
/api/rankings/country?sport=basketball
/api/challenges/[challengeId]
/api/challenges/submit
/api/challenges/verify
/api/monthly-challenge
```

### Page Routes Structure
```
/ (Page 1 - Email verification)
/verify (Verification code input)
/register (Page 2 - User info)
/photo (Page 2b - Face recognition/photo upload)
/welcome (Page 3 - Main welcome, feature unlock)
/avatar (Page 4 - Avatar customization)
/ranking (Page 5 - Three-tier rankings)
/map (Page 6 - Interactive court map)
/challenges (Page 7 - Courts and challenges list)
/challenge/[id] (Page 8 - Challenge instructions)
/challenge/[id]/record (Page 9/9a - Camera & recording)
/challenge/[id]/results (Page 10 - Results & feedback)
```

### Critical UI/UX Elements
- Smooth page transitions (fade/slide animations)
- Pulsing logo animation
- Progressive unlock visual effects
- Real-time distance calculations
- Camera interface with countdown timer
- Video preview with retry functionality

### Security & Validation
- Email verification with time-limited codes
- Video verification for challenge submissions
- Player identification gestures in videos
- Geolocation validation for venue check-ins
- Rate limiting on challenge submissions
- Sport-specific video validation rules
