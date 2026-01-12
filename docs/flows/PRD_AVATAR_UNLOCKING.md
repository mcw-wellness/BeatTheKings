# PRD: Avatar Item Unlocking System

## Overview

Players can unlock avatar customization items by reaching milestones (matches played, challenges completed, users invited) or by purchasing with Reward Points (RP). Locked items are visible but show unlock requirements.

## User Stories

1. As a player, I want to see all available avatar items so I know what I can unlock
2. As a player, I want to see my progress toward unlocking locked items
3. As a player, I want items to automatically unlock when I meet requirements
4. As a player, I want to purchase items with RP as an alternative unlock path

## Unlock Conditions (from requirements)

Items can be unlocked by ANY combination of:

- **Matches played** - e.g., 10, 25, 50 matches
- **Challenges completed** - e.g., 5, 13, 25 challenges
- **Users invited** - e.g., 1, 3, 5 invites
- **XP earned** - e.g., 1000, 5000, 10000 XP
- **RP purchase** - Alternative path (costs RP)

## Database Schema (Already Exists)

### AvatarItem Table

```typescript
{
  id: uuid
  name: string
  itemType: 'hair' | 'jersey' | 'shorts' | 'shoes' | 'accessory'
  sportId: uuid | null // null = universal
  imageUrl: string

  // Unlock conditions (all nullable - any combination)
  requiredMatches: number | null
  requiredChallenges: number | null
  requiredInvites: number | null
  requiredXp: number | null
  rpCost: number | null // Alternative purchase path

  isDefault: boolean // Starter items (auto-unlocked)
  isActive: boolean
}
```

### UserUnlockedItem Table

```typescript
{
  id: uuid
  userId: uuid
  itemId: uuid
  unlockedAt: timestamp
  unlockedVia: 'default' | 'achievement' | 'purchase'
}
```

### PlayerStats (Tracking Metrics)

```typescript
{
  matchesPlayed: number
  matchesWon: number
  challengesCompleted: number
  usersInvited: number
  totalXp: number
  totalRp: number
  availableRp: number // Spendable RP
}
```

## Unlock Logic

### Eligibility Check

An item is unlockable when ALL specified conditions are met:

```typescript
function canUnlockItem(stats: PlayerStats, item: AvatarItem): boolean {
  if (item.requiredMatches && stats.matchesPlayed < item.requiredMatches) return false
  if (item.requiredChallenges && stats.challengesCompleted < item.requiredChallenges) return false
  if (item.requiredInvites && stats.usersInvited < item.requiredInvites) return false
  if (item.requiredXp && stats.totalXp < item.requiredXp) return false
  return true
}
```

### Purchase Check

```typescript
function canPurchaseItem(stats: PlayerStats, item: AvatarItem): boolean {
  return item.rpCost !== null && stats.availableRp >= item.rpCost
}
```

## API Endpoints

### GET /api/items

Get all items with unlock status for current user.

**Response:**

```typescript
interface ItemsResponse {
  items: {
    id: string
    name: string
    itemType: string
    sportId: string | null
    imageUrl: string | null

    // Unlock info
    isUnlocked: boolean
    unlockedVia: 'default' | 'achievement' | 'purchase' | null
    canUnlock: boolean // Meets requirements but not yet unlocked
    canPurchase: boolean

    // Requirements (null if not required)
    requiredMatches: number | null
    requiredChallenges: number | null
    requiredInvites: number | null
    requiredXp: number | null
    rpCost: number | null

    // Progress (for locked items)
    progress: {
      matches: { current: number; required: number } | null
      challenges: { current: number; required: number } | null
      invites: { current: number; required: number } | null
      xp: { current: number; required: number } | null
    }
  }[]

  // User's current stats for reference
  stats: {
    matchesPlayed: number
    challengesCompleted: number
    usersInvited: number
    totalXp: number
    availableRp: number
  }
}
```

### POST /api/items/[itemId]/unlock

Unlock an item (if eligible) or purchase with RP.

**Request Body:**

```typescript
{
  method: 'achievement' | 'purchase'
}
```

**Response:**

```typescript
{
  success: boolean
  message: string
  unlockedItem?: { id, name, itemType }
  remainingRp?: number  // After purchase
}
```

**Error Cases:**

- 400: Item already unlocked
- 400: Requirements not met (for achievement)
- 400: Insufficient RP (for purchase)
- 400: Item not purchasable (no rpCost)
- 404: Item not found

### POST /api/items/check-unlocks

Check and auto-unlock all eligible items for user.
Called after match/challenge completion.

**Response:**

```typescript
{
  newlyUnlocked: {
    id: string
    name: string
    itemType: string
  }
  ;[]
}
```

## Unlock Triggers

Auto-check unlocks after:

1. **Match completion** - When both players agree on result
2. **Challenge completion** - When challenge attempt is successful

Integration points:

- `saveMatchResults()` in matches lib
- `submitChallengeAttempt()` in challenges lib

## UI Requirements

### Avatar Page Updates

1. **Item Grid** - Show all items grouped by type
2. **Lock Overlay** - Locked items show:
   - Lock icon
   - Progress bar (e.g., "5/10 matches")
   - "Unlock" button (if eligible)
   - "Buy for X RP" button (if purchasable)
3. **Unlock Animation** - Celebration when item unlocks
4. **Filter** - "All | Unlocked | Locked"

### Item Card States

```
┌─────────────────┐
│   [Image]       │  UNLOCKED
│   Blue Jersey   │
│   ✓ Equipped    │
└─────────────────┘

┌─────────────────┐
│   🔒 [Image]    │  LOCKED (progress)
│   Red Jersey    │
│   ████░░ 8/10   │
│   matches       │
└─────────────────┘

┌─────────────────┐
│   🔒 [Image]    │  LOCKED (can unlock)
│   Gold Jersey   │
│   ✓ Ready!      │
│   [Unlock Now]  │
└─────────────────┘

┌─────────────────┐
│   🔒 [Image]    │  LOCKED (purchasable)
│   Pro Jersey    │
│   50 RP         │
│   [Buy Now]     │
└─────────────────┘
```

## Data Flow

```
User completes match
    ↓
saveMatchResults() updates PlayerStats
    ↓
Call checkAndUnlockEligibleItems()
    ↓
New items unlocked? → Show notification
    ↓
User visits avatar page
    ↓
Fetch GET /api/items
    ↓
Display items with unlock status
    ↓
User clicks locked item
    ↓
Show unlock options (if eligible/purchasable)
    ↓
POST /api/items/[itemId]/unlock
    ↓
Update UI, show celebration
```

## Acceptance Criteria

1. [ ] GET /api/items returns all items with correct unlock status
2. [ ] Progress shows current/required for each condition
3. [ ] Items auto-unlock when requirements met after match/challenge
4. [ ] Users can purchase items with RP
5. [ ] RP is deducted after purchase
6. [ ] Already unlocked items cannot be unlocked again
7. [ ] Avatar UI shows real items (not mock data)
8. [ ] Locked items show progress
9. [ ] Unlock celebration/notification works

## Test Plan

### Unit Tests

1. `canUnlockItem()` - Various requirement combinations
2. `canPurchaseItem()` - RP checks
3. `getUnlockProgress()` - Progress calculation
4. `formatRequirement()` - User-friendly text

### Integration Tests

1. GET /api/items returns correct data
2. POST /api/items/[itemId]/unlock with achievement method
3. POST /api/items/[itemId]/unlock with purchase method
4. POST /api/items/check-unlocks after stats change
5. RP deduction after purchase
6. Cannot unlock already unlocked item

## Out of Scope (MVP)

- Item trading between players
- Limited edition items
- Seasonal items
- Item gifting
- Invite tracking system (will use placeholder for now)
