# PRD: Scheduled Match Invitation

## Overview

Allow players to invite any player (from Rankings or Trump Card) to a 1v1 match at a specific venue, date, and time. The invited player can accept or decline. Accepted matches appear at the top of "My Matches" as "open" status until both players meet and play.

## Context

Currently, 1v1 challenges only work when both players are checked in at the same venue. This feature removes that constraint — you can browse Rankings, tap a player's Trump Card, and send them a match invitation for a future date.

## User Flow

```
Rankings Page / Trump Card
    └── Tap player → Trump Card opens
        └── "Invite to Match" button
            └── Invitation Form Page (/player/[id]/invite)
                ├── Select Venue (from venue list)
                ├── Select Date (date picker)
                └── Select Time (time picker)
                    └── "Send Invitation" button
                        └── POST /api/match-invitations
                            └── Invitation sent

Invited Player (in-app notification):
    └── Opens /matches → sees invitation at top
        └── Taps → sees invitation details
            ├── "Accept" → match created as "scheduled", appears in My Matches
            └── "Decline" → invitation dismissed

Match Day:
    └── Both players go to the venue
        └── Either player taps "Start Match" from My Matches
            └── Existing 1v1 recording flow kicks in
```

## Database Changes

### New Table: `MatchInvitation`

```sql
MatchInvitation {
  id:           UUID PRIMARY KEY
  senderId:     UUID NOT NULL → User(id)
  receiverId:   UUID NOT NULL → User(id)
  venueId:      UUID NOT NULL → Venue(id)
  sportId:      UUID NOT NULL → Sport(id)
  scheduledDate: DATE NOT NULL          -- e.g., 2026-02-15
  scheduledTime: VARCHAR(10) NOT NULL   -- e.g., "14:00"
  status:       VARCHAR(20) NOT NULL    -- "pending", "accepted", "declined", "cancelled", "expired"
  message:      TEXT                    -- optional note from sender
  respondedAt:  TIMESTAMP              -- when accepted/declined
  createdAt:    TIMESTAMP DEFAULT NOW()
}
```

**Why a separate table?** Invitations are not matches yet. They become matches only on acceptance. This keeps the existing Match table clean and avoids adding nullable scheduling fields to every match.

### Match Table Update

Add one column to existing `Match` table:

```sql
ALTER TABLE "Match" ADD COLUMN "invitationId" UUID REFERENCES "MatchInvitation"(id);
ALTER TABLE "Match" ADD COLUMN "scheduledDate" DATE;
ALTER TABLE "Match" ADD COLUMN "scheduledTime" VARCHAR(10);
```

When an invitation is accepted, a Match record is created with status `"scheduled"` (new status) and linked to the invitation.

### New Match Status: `scheduled`

Added to the existing status flow:

```
invitation accepted → "scheduled" → both at venue → "in_progress" → ... → "completed"
```

The "scheduled" status appears as **"Open"** in the UI (per client request).

## API Endpoints

### 1. Send Invitation

```
POST /api/match-invitations
Body: {
  receiverId: string,
  venueId: string,
  sportId: string,
  scheduledDate: string,    // "2026-02-15"
  scheduledTime: string,    // "14:00"
  message?: string
}
Response: { id: string, status: "pending" }
```

**Validations:**
- Cannot invite yourself
- Cannot send duplicate pending invitation to same player
- Date must be in the future
- Venue must exist

### 2. Get My Invitations

```
GET /api/match-invitations?type=received|sent
Response: {
  invitations: [{
    id: string,
    sender: { id, name, avatar },
    receiver: { id, name, avatar },
    venue: { id, name, district },
    scheduledDate: string,
    scheduledTime: string,
    status: string,
    createdAt: string
  }]
}
```

### 3. Respond to Invitation

```
POST /api/match-invitations/[id]/respond
Body: { accept: boolean }
Response: {
  status: "accepted" | "declined",
  matchId?: string    // only if accepted
}
```

On accept:
- Update invitation status to "accepted"
- Create a Match record with status "scheduled"
- Link match to invitation via `invitationId`

### 4. Cancel Invitation (sender only)

```
DELETE /api/match-invitations/[id]
Response: { success: true }
```

Only the sender can cancel. Only pending invitations can be cancelled.

## Pages

### 1. Invitation Form Page (NEW)

**Route:** `/player/[id]/invite`

**UI:**
- Opponent's avatar + name at top
- Venue selector (scrollable list of venues)
- Date picker (native date input, min = tomorrow)
- Time picker (native time input)
- Optional message text field
- "Send Invitation" button (full width, green)
- Back button

### 2. Trump Card Page (UPDATE)

**Route:** `/player/[id]`

**Add:** "Invite to Match" button below existing "Challenge" button. Navigates to `/player/[id]/invite`.

### 3. Matches Page (UPDATE)

**Route:** `/matches`

**Changes:**
- Scheduled matches (from accepted invitations) appear at **top of list** with "Open" badge
- New filter tab or include in "Active" filter
- Match card shows: opponent, venue, scheduled date/time, "Open" badge
- Tapping an open/scheduled match navigates to match detail

### 4. Invitation Detail (on Matches page)

Pending invitations (received) show in My Matches with:
- "Invitation" badge (blue)
- Sender name, venue, date, time
- "Accept" / "Decline" buttons inline

## In-app Notifications

Simple approach (no push):
- Add a `notifications` table or a badge count endpoint
- Show a red dot/badge on the "Matches" nav icon when there are pending invitations
- The matches page itself shows received invitations at the top

### Notification Badge Endpoint

```
GET /api/notifications/count
Response: { pendingInvitations: number }
```

## Match Status Lifecycle (Updated)

```
invitation sent     → invitation.status = "pending"
invitation accepted → invitation.status = "accepted"
                    → match.status = "scheduled" (shows as "Open")
match day, start    → match.status = "in_progress"
recording done      → match.status = "uploading"/"analyzing"
AI results          → match.status = "completed"
both agree          → stats updated
```

## Sorting in My Matches

1. **Pending invitations** (received) — at very top
2. **Scheduled/Open matches** — sorted by scheduled date (soonest first)
3. **Active matches** (in_progress, uploading, analyzing)
4. **Completed/Disputed** — most recent first

## Edge Cases

- **Expired invitations:** If scheduled date passes without acceptance, auto-expire (cron or on-read check)
- **No-show:** If scheduled date passes without match starting, mark as "expired" after 24 hours
- **Cancel after accept:** Either player can cancel a scheduled match (returns to cancelled status)
- **Double booking:** Allow it — player can have multiple scheduled matches

## Acceptance Criteria

1. [ ] Player can tap "Invite to Match" from Trump Card
2. [ ] Invitation form collects venue, date, time
3. [ ] Invited player sees invitation in My Matches
4. [ ] Accept creates a scheduled match at top of My Matches with "Open" badge
5. [ ] Decline removes the invitation
6. [ ] Sender can cancel pending invitation
7. [ ] Badge/indicator shows on Matches nav when invitations pending
8. [ ] Scheduled match links to existing 1v1 flow when started
9. [ ] All lint and type checks pass
10. [ ] Unit + integration tests cover invitation CRUD and match creation

## Out of Scope (Later)

- Push notifications (using in-app only for now)
- Recurring scheduled matches
- Group/tournament invitations
- Chat between players
