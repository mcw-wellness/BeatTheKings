# Clickthrough Prototype Plan

**Goal:** Build a fully functional UI prototype with all 10 pages, using mock data aligned with MVP database model.

**Approach:**
- No backend/API
- No database
- No tests
- Client-side state management (React Context)
- Mock data matching Prisma schema exactly
- Full navigation flow

---

## Pages to Implement

### 1. **Page 1: Email Verification** (`/`)
- Email input field
- "GO" button
- Mock: Store email in state, navigate to /verify
- **Data Model:** User.email

### 2. **Page 2: Verification Code** (`/verify`)
- 6-digit code input
- "Verify" button
- Mock: Accept any 6-digit code
- **Data Model:** User.verificationCode

### 3. **Page 3: User Registration** (`/register`)
- Form fields: name, age, gender, location
- Calculate ageGroup from age
- "Start" button
- **Data Model:** User (name, age, ageGroup, gender, location)

### 4. **Page 4: Profile Photo** (`/photo`)
- File upload or camera capture (mock)
- Preview with Retake/Confirm
- Sets hasCompletedOnboarding = true
- **Data Model:** User.profilePictureUrl, User.hasCompletedOnboarding

### 5. **Page 5: Main Hub** (`/welcome`)
- Welcome message with user name
- Avatar button (active)
- Ranking/Map/Challenge buttons (locked initially)
- Progressive unlock after avatar created
- **Data Model:** User.hasCompletedOnboarding, Avatar existence

### 6. **Page 6: Avatar Creation** (`/avatar`)
- Hair color/style selection
- Jersey number input
- Sport-specific equipment selection
- Crown if user is "King"
- Unlocks other features
- **Data Model:** Avatar, AvatarEquipment (future), User age group display

### 7. **Page 7: Rankings** (`/ranking`)
- Three tabs: Venue / City / Country
- Top 10 lists
- Click player → show avatar popup
- Monthly challenge section
- Sponsors at bottom
- **Data Model:** PlayerStats, Venue.currentKing

### 8. **Page 8: Interactive Map** (`/map`)
- Mock map with venue markers
- Sport filter dropdown
- Show active player count
- Click venue → details
- King indicators (crown)
- **Data Model:** Venue (all fields), sportType filter

### 9. **Page 9: Challenges List** (`/challenges`)
- List of challenges at venues
- Status badges (not started/in progress/completed)
- Tutorials section
- Click challenge → go to challenge flow
- **Data Model:** Challenge, UserChallengeStatus

### 10. **Page 10: Challenge Flow** (`/challenge/[id]`)
**Sub-pages:**
- `/challenge/[id]` - Instructions
- `/challenge/[id]/record` - Camera countdown (10s), recording, try again/upload
- `/challenge/[id]/results` - Results with XP earned
- **Data Model:** Challenge, ChallengeSubmission, performanceData

---

## Mock Data Structure

Create `src/lib/mockData.ts` with:

```typescript
// Aligned with Prisma schema
const mockUser = {
  id: "user-1",
  email: "demo@beatthekingz.com",
  name: "Alex Jordan",
  age: 24,
  ageGroup: "22-25",
  gender: "Male",
  location: "New York, NY",
  profilePictureUrl: "/mock-avatar.jpg",
  hasCompletedOnboarding: false,
}

const mockVenues = [
  {
    id: "venue-1",
    name: "Rucker Park",
    venueType: "court",
    sportType: "basketball",
    city: "New York",
    country: "USA",
    activePlayerCount: 8,
    currentKingId: "user-1",
    latitude: 40.8299,
    longitude: -73.9384,
  },
  // ... more venues
]

const mockChallenges = [
  {
    id: "challenge-1",
    venueId: "venue-1",
    name: "Free Throw Challenge",
    challengeType: "free_throws",
    parameters: { requiredShots: 10, timeLimit: 60 },
    xpReward: 100,
    difficulty: "easy",
  },
  // ... more challenges
]

const mockPlayerStats = {
  totalXp: 2500,
  currentRank: 3,
  totalChallenges: 12,
  sportType: "basketball",
  venueStatsJson: {
    "venue-1": { rank: 1, xp: 1500 }
  }
}
```

---

## State Management

Create `src/context/AppContext.tsx`:
- Store user data
- Store avatar data
- Store onboarding progress
- Navigation helpers

---

## Component Structure

```
src/
├── app/
│   ├── page.tsx                    # Page 1: Email
│   ├── verify/page.tsx             # Page 2: Code
│   ├── register/page.tsx           # Page 3: Registration
│   ├── photo/page.tsx              # Page 4: Photo
│   ├── welcome/page.tsx            # Page 5: Hub
│   ├── avatar/page.tsx             # Page 6: Avatar
│   ├── ranking/page.tsx            # Page 7: Rankings
│   ├── map/page.tsx                # Page 8: Map
│   ├── challenges/page.tsx         # Page 9: Challenges
│   ├── challenge/
│   │   └── [id]/
│   │       ├── page.tsx            # Instructions
│   │       ├── record/page.tsx     # Recording
│   │       └── results/page.tsx    # Results
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   └── Badge.tsx
│   ├── Logo.tsx                    # Pulsing logo
│   ├── LockedFeature.tsx           # Locked feature overlay
│   ├── VenueCard.tsx               # Venue display
│   ├── ChallengeCard.tsx           # Challenge card
│   └── PlayerAvatar.tsx            # Player avatar display
├── context/
│   └── AppContext.tsx              # Global state
├── lib/
│   ├── mockData.ts                 # All mock data
│   └── utils.ts                    # Helper functions
└── types/
    └── index.ts                    # TypeScript types from schema
```

---

## Implementation Order

1. **Setup basics** (types, mock data, context)
2. **Create reusable UI components**
3. **Pages 1-4** (Onboarding flow)
4. **Page 5** (Main hub with locked features)
5. **Page 6** (Avatar creation - unlocks features)
6. **Pages 7-9** (Rankings, Map, Challenges)
7. **Page 10** (Challenge flow with sub-pages)
8. **Polish** (animations, transitions)

---

## Key Features

✅ **Progressive Feature Unlock**
- Features locked until avatar created
- Visual indicators for locked state

✅ **Mock Navigation**
- All buttons work and navigate correctly
- Back buttons where needed

✅ **Animations**
- Pulsing logo
- Smooth page transitions
- Unlock animations

✅ **Responsive Design**
- Mobile-first approach
- Works on all screen sizes

✅ **Data Model Alignment**
- All forms collect exact fields from User model
- Age group calculated correctly
- Jersey numbers for avatars
- Challenge parameters match schema

---

## No Backend - How It Works

1. **Forms:** Store in Context/State (not saved)
2. **File uploads:** Show preview only (no actual upload)
3. **Verification codes:** Accept any 6-digit code
4. **XP/Rankings:** Static mock data
5. **Video recording:** Mock countdown/upload (no actual recording)
6. **Map:** Static markers (no real geolocation API)

---

## Success Criteria

- [ ] All 10 pages implemented
- [ ] Full navigation flow works
- [ ] Can complete entire user journey
- [ ] UI matches MVP design
- [ ] All data fields match Prisma schema
- [ ] Looks good on mobile and desktop
- [ ] Ready for backend integration later

---

**Ready to implement!** No tests, no database, pure UI prototype.