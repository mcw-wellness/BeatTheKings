# PRD: Demo Video Analysis Flow

## Overview
Demo video integration with mock AI analysis for the Tuesday presentation. This is a **demo-only** feature to showcase the video analysis capability without requiring a real LLM connection.

## Scope
- **Challenge**: 3-Point Shot only
- **Venue**: Esterhazy Park only
- **Purpose**: Presentation demo (not production)

---

## User Flow

```
Challenge Instructions Page
    ↓
[Start Challenge & recording video] → Normal flow (existing)
[Start Challenge & use demo video]  → Demo flow (new)
    ↓
Demo Video Preview Page (new)
    ↓
[Play video] → Play/pause demo video
[Upload and analyze video] → Mock analysis
    ↓
Demo Results Page (new)
    ↓
[Claim XP & RP] → Return to challenges
```

---

## Page Specifications

### Page 1: Challenge Instructions (Modified)

**Route**: `/challenges/[challengeId]`

**Changes**:
1. Add camera positioning instructions to the Instructions section:
   - "Position camera at a 45° angle (wing) to avoiding backlighting."
   - "Record in landscape at eye level using tripod or steady hand."
   - "Keep videos short (max. 2 minutes)."

2. Modify buttons (only for 3-Point Shot at Esterhazy Park):
   - Green button: "Start Challenge & recording video" → goes to `/challenges/[id]/play`
   - Yellow button: "Start Challenge & use demo video" → goes to `/challenges/[id]/demo`

**Condition**: Demo button only shows when:
- Challenge type is "3-Point Shot" (slug: `three-point`)
- Venue is "Esterhazy Park"

---

### Page 2: Demo Video Preview (New)

**Route**: `/challenges/[challengeId]/demo`

**UI Elements**:
- Header: "← Back  3-Point Shot"
- Video player (centered, rounded corners)
  - Demo video from `/videos/demo-3point.mp4`
  - "Demo Video" label overlay
  - Native HTML5 video controls (play, progress, volume)
  - Play button overlay when paused
- Two buttons at bottom:
  - Blue: "Play video" (with play icon) - toggles video play/pause
  - Yellow: "Upload and analyze video" (with upload icon) - navigates to results

**Behavior**:
- Video is playable/pausable with audio
- Clicking "Upload and analyze video" → navigate to `/challenges/[id]/demo/result`

---

### Page 3: Demo Results (New)

**Route**: `/challenges/[challengeId]/demo/result`

**UI Elements**:
- Header: "← Back  3-Point Shot"
- White/light card with green border containing:
  - "Result" title
  - Large accuracy text: "Accuracy: 80%" (green)
  - Small play icon
  - "Analyzing video with AI..." text (shown briefly, then hidden)
  - Stats row:
    - Green checkmark + "Made: 4"
    - Red X + "Missed: 1"
  - Green button: "Claim 10 RP & 50 XP"

**Behavior**:
1. On page load, show "Analyzing video with AI..." for 2-3 seconds
2. Then reveal the hardcoded results:
   - Accuracy: 80% (4 out of 5)
   - Made: 4
   - Missed: 1
3. "Claim" button returns to challenges page (no actual XP/RP awarded for demo)

**Hardcoded Values** (no API call):
- Made shots: 4
- Missed shots: 1
- Accuracy: 80%
- XP: 50
- RP: 10

---

## API Endpoints

No new API endpoints required. This is a client-side demo with hardcoded values.

---

## Data Model

No database changes required.

---

## Assets Required

1. **Demo Video**: `/public/videos/demo-3point.mp4`
   - A short basketball 3-point shooting video
   - Should show player making shots
   - Max 2 minutes, ideally 30-60 seconds

---

## File Structure

```
src/app/(app)/challenges/[challengeId]/
├── page.tsx                    # Modified: add demo button
├── demo/
│   ├── page.tsx               # New: demo video preview
│   └── result/
│       └── page.tsx           # New: mock results
public/videos/
└── demo-3point.mp4            # Demo video asset
```

---

## Acceptance Criteria

1. [ ] Demo button only appears for 3-Point Shot challenge at Esterhazy Park
2. [ ] Camera instructions shown in instructions section
3. [ ] Demo video page plays video with controls
4. [ ] Results page shows mock "analyzing" state then reveals results
5. [ ] Claim button returns to challenges (no actual rewards)
6. [ ] All pages match the provided screenshot designs

---

## Out of Scope

- Real LLM/AI video analysis (use existing `/dev/video-analysis` for real demos)
- Recording actual video
- Saving results to database
- Awarding actual XP/RP

---

## Timeline

**Deadline**: Tuesday presentation
