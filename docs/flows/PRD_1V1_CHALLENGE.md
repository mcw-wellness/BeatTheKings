# PRD: 1v1 Challenge Flow

## Overview

The 1v1 Challenge flow allows players to challenge other active players at their venue to a basketball match. The match is recorded via video, analyzed by AI (Gemini), and results are verified by both players through an Agree/Dispute mechanism.

## Document Reference

From "Beat The Kings.txt" - Point 6:

> "The app should automatically detect who is on the court. Players verify themselves by briefly touching their smartphones together (Bluetooth/NFC), exchanging Trump Cards. No photo verification is needed. The app then automatically starts and evaluates the match via video + AI. Both players can select Agree or Dispute. If Agree, the result is automatically added to their statistics."

## User Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        1v1 CHALLENGE FLOW                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. VENUE/MAP PAGE                                               │
│     └── User sees active players at their venue                  │
│         └── Taps on active player avatar                         │
│                                                                  │
│  2. TRUMP CARD PAGE (/player/[id])                               │
│     └── Views opponent's Trump Card (stats, rank, etc.)          │
│         └── Taps "Challenge" button                              │
│                                                                  │
│  3. CHALLENGE REQUEST                                            │
│     └── Opponent receives notification                           │
│     └── Opponent can Accept or Decline                           │
│         └── If Accept → Both proceed to match                    │
│                                                                  │
│  4. PRE-MATCH SCREEN (/challenges/1v1/[matchId]/ready)            │
│     └── Shows both Trump Cards side by side                      │
│     └── Instructions for video recording                         │
│     └── "Start Recording" button                                 │
│                                                                  │
│  5. RECORDING SCREEN (/challenges/1v1/[matchId]/record)           │
│     └── Camera viewfinder with timer                             │
│     └── Both players play the match                              │
│     └── "Stop Recording" button                                  │
│                                                                  │
│  6. UPLOAD SCREEN (/challenges/1v1/[matchId]/upload)              │
│     └── Video preview                                            │
│     └── Upload progress to Azure Blob Storage                    │
│     └── "Analyzing..." status                                    │
│                                                                  │
│  7. RESULTS SCREEN (/challenges/1v1/[matchId]/results)            │
│     └── AI-detected results (score, winner)                      │
│     └── Match statistics                                         │
│     └── "Agree" or "Dispute" buttons                             │
│         └── If both Agree → Save to stats                        │
│         └── If Dispute → Manual review queue                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Pages to Implement

### Removed Pages (Not Per Document)

- `/challenges/1v1/opponents` - Not needed, use active players from venue
- `/challenges/1v1/setup` - Merge into challenge request flow
- `/challenges/1v1/verify` - Document says "No photo verification"
- `/challenges/1v1/photo` - Document says "No photo verification"

### New/Updated Pages

#### 1. Player Trump Card Page (UPDATE)

**Route:** `/player/[id]`
**Purpose:** View opponent's Trump Card with Challenge button

**UI Elements:**

- Full Trump Card display (avatar, stats, rank, achievements)
- "Challenge to 1v1" button (only if both at same venue)
- Back button

#### 2. Match Pending Page (NEW)

**Route:** `/challenges/1v1/[matchId]/pending`
**Purpose:** Waiting for opponent to accept challenge

**UI Elements:**

- Opponent's avatar and name
- "Waiting for response..." status
- Cancel button
- Auto-refresh for opponent response

#### 3. Pre-Match Ready Page (UPDATE)

**Route:** `/challenges/1v1/[matchId]/ready`
**Purpose:** Both players confirmed, ready to start

**UI Elements:**

- Side-by-side Trump Cards (You vs Opponent)
- Recording instructions
- "Start Recording" button
- Tips for best video quality

#### 4. Recording Page (UPDATE)

**Route:** `/challenges/1v1/[matchId]/record`
**Purpose:** Active video recording of match

**UI Elements:**

- Camera viewfinder (full screen)
- Recording timer (MM:SS)
- Red "REC" indicator
- "Stop Recording" button (with confirmation)
- Flip camera button

#### 5. Upload Page (UPDATE)

**Route:** `/challenges/1v1/[matchId]/upload`
**Purpose:** Upload video and wait for AI analysis

**UI Elements:**

- Video thumbnail/preview
- Upload progress bar
- "Analyzing with AI..." status
- Estimated time remaining

#### 6. Results Page (UPDATE)

**Route:** `/challenges/1v1/[matchId]/results`
**Purpose:** Show AI results and get player confirmation

**UI Elements:**

- Winner announcement (Victory/Defeat)
- Final score (You: X - Opponent: Y)
- Match statistics:
  - Duration
  - Shots made/attempted
  - Accuracy percentage
- XP/RP earned (preview)
- "Agree" button (green)
- "Dispute" button (red)
- Status of opponent's response

## API Endpoints

### 1. Create Challenge Request

```
POST /api/challenges/1v1/request
Body: {
  opponentId: string,
  venueId: string
}
Response: {
  matchId: string,
  status: "pending"
}
```

### 2. Respond to Challenge

```
POST /api/challenges/1v1/[matchId]/respond
Body: {
  accept: boolean
}
Response: {
  matchId: string,
  status: "accepted" | "declined"
}
```

### 3. Get Match Status

```
GET /api/challenges/1v1/[matchId]
Response: {
  matchId: string,
  status: "pending" | "accepted" | "recording" | "uploading" | "analyzing" | "completed" | "disputed",
  challenger: { id, name, avatar, stats },
  opponent: { id, name, avatar, stats },
  result?: { ... }
}
```

### 4. Upload Match Video

```
POST /api/challenges/1v1/[matchId]/upload
Body: FormData with video file
Response: {
  videoUrl: string,
  status: "analyzing"
}
```

### 5. Get AI Analysis Results

```
GET /api/challenges/1v1/[matchId]/results
Response: {
  matchId: string,
  winner: "challenger" | "opponent",
  score: { challenger: number, opponent: number },
  stats: {
    duration: number,
    challengerShots: { made: number, attempted: number },
    opponentShots: { made: number, attempted: number }
  },
  xpReward: number,
  rpReward: number,
  challengerAgreed: boolean | null,
  opponentAgreed: boolean | null
}
```

### 6. Submit Agreement/Dispute

```
POST /api/challenges/1v1/[matchId]/agree
Body: {
  agree: boolean
}
Response: {
  status: "completed" | "disputed" | "waiting_opponent",
  statsUpdated: boolean
}
```

## Database Schema

### Match Table (Already Exists)

```sql
Match {
  id: uuid
  venueId: uuid
  sportId: uuid
  challengerId: uuid
  opponentId: uuid
  status: enum('pending', 'accepted', 'declined', 'in_progress', 'completed', 'disputed', 'cancelled')
  challengerScore: integer
  opponentScore: integer
  winnerId: uuid
  videoUrl: string
  challengerAgreed: boolean
  opponentAgreed: boolean
  xpAwarded: integer
  rpAwarded: integer
  scheduledTime: timestamp
  startedAt: timestamp
  completedAt: timestamp
  createdAt: timestamp
  updatedAt: timestamp
}
```

### Required Schema Updates

- Add `videoUrl` column if not exists
- Add `challengerAgreed` boolean column
- Add `opponentAgreed` boolean column

## AI Analysis (Gemini)

### Video Analysis Prompt

```
Analyze this basketball 1v1 match video. Detect and count:
1. Total shots attempted by each player
2. Shots made by each player
3. Final score (points)
4. Match duration
5. Any fouls or violations (optional)

Return structured JSON:
{
  "player1": { "shots_made": X, "shots_attempted": Y, "points": Z },
  "player2": { "shots_made": X, "shots_attempted": Y, "points": Z },
  "duration_seconds": N,
  "confidence": 0.0-1.0
}
```

### Azure Blob Storage

- Container: `match-videos`
- Path: `matches/{matchId}/{timestamp}.mp4`
- Generate SAS URL for Gemini access

## Responsive Design Requirements

### Mobile (375px - 767px)

- Full-width cards
- Large touch targets (min 44x44px)
- Bottom-positioned action buttons
- Camera viewfinder fills screen
- Swipe gestures for navigation

### Tablet (768px - 1023px)

- Two-column layout for Trump Cards
- Larger video preview
- Side-by-side stats

### Desktop (1024px+)

- Centered content (max-width: 640px)
- Hover states for buttons
- Keyboard navigation support

## Error Handling

1. **Opponent declines:** Show message, return to venue
2. **Opponent timeout (2 min):** Auto-cancel, notify user
3. **Upload fails:** Retry option, save locally
4. **AI analysis fails:** Manual review queue
5. **Network loss during recording:** Save locally, upload later

## Success Criteria

1. User can challenge active player from venue
2. Video records successfully on mobile browsers
3. Video uploads to Azure Blob Storage
4. Gemini AI returns accurate match results
5. Both players can Agree/Dispute results
6. Stats update only when both Agree
7. UI is responsive across all device sizes

## Out of Scope (Phase 2)

- NFC/Bluetooth player verification
- Real-time match streaming
- Spectator mode
- Tournament brackets
- Voice commentary analysis
