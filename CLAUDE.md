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

## Coding Standards

### File & Function Limits

| Rule                    | Limit       | Rationale                            |
| ----------------------- | ----------- | ------------------------------------ |
| **File length**         | ≤ 200 lines | Keeps files focused and maintainable |
| **Function length**     | ≤ 30 lines  | Functions should do one thing well   |
| **Function parameters** | ≤ 4 params  | Use objects for more parameters      |
| **Nesting depth**       | ≤ 3 levels  | Extract nested logic to functions    |

### Single Responsibility Principle

- **One function = One job** - Each function should do exactly one thing
- **Method names must match functionality** - `getUserById` should only get user by ID
- **No side effects** - Functions should be predictable
- **Extract logic** - If a function does multiple things, split it

```typescript
// BAD - Does multiple things
function processUser(user) {
  validateUser(user);
  saveToDatabase(user);
  sendEmail(user);
  logActivity(user);
}

// GOOD - Single responsibility
function validateUser(user) { ... }
function saveUser(user) { ... }
function notifyUser(user) { ... }
function logUserActivity(user) { ... }
```

### Error Handling & Logging

**NEVER swallow exceptions. ALWAYS log errors.**

Use the Pino logger via `src/lib/logger.ts`:

```typescript
import { logger } from '@/lib/logger'

// ALWAYS log errors with context
try {
  await someOperation()
} catch (error) {
  logger.error({ error, userId, context: 'someOperation' }, 'Operation failed')
  throw error // Re-throw or handle appropriately
}

// Log levels
logger.debug({ data }, 'Debug info') // Development only
logger.info({ userId }, 'User signed in') // Normal operations
logger.warn({ attempt }, 'Rate limit approaching') // Warnings
logger.error({ error }, 'Operation failed') // Errors
```

**Error Handling Rules:**

- Never use empty catch blocks
- Always log the error with context
- Include relevant IDs (userId, requestId, etc.)
- Re-throw errors unless explicitly handled
- Use custom error classes for domain errors

### Linting Rules

**NEVER use eslint-disable comments.** Fix the underlying issue instead.

- If a variable is unused, remove it
- If a type is `any`, define a proper type
- If an import is unused, remove it
- Never suppress warnings - they indicate real problems

```typescript
// BAD - Suppressing the problem
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const unusedVar = 'test'

// GOOD - Remove unused code
// (just delete the line)

// BAD - Using any
function process(data: any) { ... }

// GOOD - Define proper types
interface ProcessData {
  id: string
  value: number
}
function process(data: ProcessData) { ... }
```

### Code Organization

**Folder Structure:**

```
src/
├── lib/
│   ├── utils/           # Shared utility functions
│   │   ├── date.ts      # Date utilities
│   │   ├── string.ts    # String utilities
│   │   ├── validation.ts # Validation utilities
│   │   └── index.ts     # Barrel export
│   ├── logger.ts        # Pino logger instance
│   └── hooks/           # React hooks
├── components/
│   ├── ui/              # Reusable UI components
│   └── layout/          # Layout components
└── app/                 # Next.js app router
```

**No Duplicate Functions:**

- Before creating a utility, check `src/lib/utils/`
- If similar functionality exists, extend it
- All shared utilities go in `src/lib/utils/`
- Use barrel exports (`index.ts`) for clean imports

### Naming Conventions

| Type             | Convention             | Example                             |
| ---------------- | ---------------------- | ----------------------------------- |
| Functions        | camelCase, verb prefix | `getUserById`, `validateEmail`      |
| Components       | PascalCase             | `UserProfile`, `LoginButton`        |
| Constants        | UPPER_SNAKE_CASE       | `MAX_RETRY_COUNT`, `API_BASE_URL`   |
| Files            | kebab-case             | `user-service.ts`, `auth-utils.ts`  |
| Types/Interfaces | PascalCase             | `User`, `AuthSession`               |
| Boolean vars     | is/has/can prefix      | `isLoading`, `hasAvatar`, `canEdit` |

### UI/UX Standards

**Responsive Design is MANDATORY:**

- Mobile-first approach (design for 320px+)
- Use Tailwind breakpoints: `sm:`, `md:`, `lg:`, `xl:`
- Test on: Mobile (375px), Tablet (768px), Desktop (1280px)
- Touch targets minimum 44x44px

```typescript
// REQUIRED responsive pattern
<div className="
  px-4 py-2           // Mobile (default)
  sm:px-6 sm:py-3     // Small screens
  md:px-8 md:py-4     // Medium screens
  lg:px-12 lg:py-6    // Large screens
">
```

**Accessibility (a11y):**

- All images must have `alt` text
- Use semantic HTML (`<button>`, `<nav>`, `<main>`)
- Ensure keyboard navigation works
- Maintain color contrast ratios (4.5:1 minimum)

**Loading States:**

- Always show loading indicators for async operations
- Use skeleton loaders for content
- Disable buttons during submission

**Mobile App Design (CRITICAL):**

This is a **mobile web application**. Design decisions must prioritize mobile UX:

- **NO modals/popups** - Use full-screen pages instead of modal overlays
- **NO hover states** - Mobile has no hover; use tap/active states
- **Navigate to new pages** - Instead of opening modals, navigate to dedicated pages (e.g., `/player/[id]` instead of a Trump Card modal)
- **Bottom navigation friendly** - Keep important actions within thumb reach
- **Swipe gestures** - Consider swipe for navigation where appropriate
- **Large touch targets** - Minimum 44x44px for all interactive elements
- **Avoid complex dropdowns** - Use full-screen pickers or dedicated selection pages

```typescript
// BAD - Modal popup
const [isModalOpen, setIsModalOpen] = useState(false)
<Modal isOpen={isModalOpen}>...</Modal>

// GOOD - Navigate to page
router.push(`/player/${playerId}`)
```

### TypeScript Rules

- **Strict mode enabled** - No `any` types unless absolutely necessary
- **Explicit return types** - All functions must have return types
- **Interface over Type** - Use `interface` for object shapes
- **Null checks** - Handle null/undefined explicitly

```typescript
// GOOD - Explicit types
function getUserById(id: string): Promise<User | null> {
  ...
}

// BAD - Implicit any
function getUserById(id) {
  ...
}
```

### Import Order

Maintain consistent import ordering:

```typescript
// 1. React/Next.js
import { useState } from 'react'
import { useRouter } from 'next/navigation'

// 2. Third-party libraries
import { eq } from 'drizzle-orm'

// 3. Internal aliases (@/)
import { logger } from '@/lib/logger'
import { Button } from '@/components/ui'

// 4. Relative imports
import { validateInput } from './utils'

// 5. Types (last)
import type { User } from '@/types'
```

## Feature Development Workflow

For each new feature/flow, follow these 5 steps in order:

### Step 1: Write PRD

- Create a PRD document in `docs/flows/` (e.g., `docs/flows/PRD_OAUTH_LOGIN.md`)
- Define requirements, acceptance criteria, and technical approach
- Include API endpoints, data models, and UI specifications

### Step 2: Implement Routes/API

- Create API routes as per PRD specifications
- Follow the existing route structure in `src/app/api/`
- Use Drizzle ORM for database operations

### Step 3: Write Unit Tests

- Write unit tests for all new functions and utilities
- Test individual components in isolation
- Use Vitest with PGLite for database tests

### Step 4: Write Integration Tests

- Test API endpoints end-to-end
- Test database operations with real queries
- Verify authentication and authorization

### Step 5: Implement UI

- Build UI components as per PRD
- Connect to API routes
- Ensure responsive design and accessibility

### Autonomous Execution

To run Claude Code autonomously through all steps without prompts:

```bash
claude -p "Implement [feature name] following the 5-step workflow" --dangerously-skip-permissions
```

Or for specific steps:

```bash
# Step 1: PRD only
claude -p "Create PRD for [feature]" --dangerously-skip-permissions

# Steps 2-4: Backend + Tests
claude -p "Implement routes and tests for [feature] as per PRD" --dangerously-skip-permissions

# Step 5: UI
claude -p "Implement UI for [feature] as per PRD" --dangerously-skip-permissions
```

## Project Overview

**Beat the Kingz** is a location-based sports competition mobile web app built with Next.js. MVP starts with basketball and soccer, with plans to expand to running tracks, cycling routes, and skiing slopes. Players compete at local venues, complete video challenges, earn XP/RP, and compete for the title of "King" at their venue.

## Documentation Structure

All documentation files (`.md`) should be organized as follows:

```
/                           # Root
├── README.md               # Project overview (standard location)
├── CLAUDE.md               # AI assistant instructions (must stay at root)
├── docs/                   # All documentation
│   ├── PRD_NEXTJS_MVP.md   # Product requirements
│   ├── DEPLOYMENT.md       # Deployment guide
│   ├── OAUTH_SETUP.md      # OAuth configuration
│   ├── STRUCTURE.md        # Project structure
│   ├── TDD_DEVELOPMENT_PLAN.md
│   ├── CLICKTHROUGH_PLAN.md
│   ├── GITHUB_SECRETS.md
│   ├── MVP_REVIEW_FINDINGS.md
│   ├── GEOGRAPHIC_HIERARCHY_OPTIONS.md
│   ├── DATABASE_ORM_DECISION.md  # ORM selection (Drizzle)
│   ├── DATABASE_SCHEMA.md        # ER diagrams & schema documentation
│   └── DATABASE_CHANGELOG.md     # Schema evolution history
└── src/db/                 # Database code (Drizzle)
    ├── schema.ts           # Drizzle schema definitions
    ├── index.ts            # Database client
    └── test-utils.ts       # PGLite test utilities
```

**Rules:**

- New documentation files go in `docs/`
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

**Schema docs:** [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) | **Changelog:** [docs/DATABASE_CHANGELOG.md](docs/DATABASE_CHANGELOG.md) | **Schema code:** [src/db/schema.ts](src/db/schema.ts)

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

**Framework:** Next.js 16 (App Router)
**Database:** PostgreSQL with Drizzle ORM
**Testing:** Vitest + PGLite (in-memory PostgreSQL)
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

## Development Setup

This is a greenfield Next.js project. Standard setup commands:

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

# Database commands (Drizzle)
npm run db:generate   # Generate migrations
npm run db:migrate    # Run migrations
npm run db:push       # Push schema to database
npm run db:studio     # Open Drizzle Studio
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
