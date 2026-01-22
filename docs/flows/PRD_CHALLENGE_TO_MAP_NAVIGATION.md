# PRD: Challenge Type Pages Navigate to Map

## Overview

Update challenge type pages (Free Throw, 3-Point Shot, Around the World) so that clicking a venue navigates to the Map page with that venue selected and directions available.

## Current Behavior

- Challenge type pages show venues with challenges
- Clicking a challenge navigates to `/challenges/{challengeId}`

## Required Behavior

- Clicking a venue navigates to `/map?venueId={venueId}`
- Map shows the venue with directions option
- User can get directions to go complete challenges at that venue

## User Flow

1. User on Challenges Dashboard
2. Taps "Free Throw" (3/0)
3. Sees list of venues with free throw challenges
4. Taps "Donaupark Court"
5. Navigates to Map with Donaupark selected
6. Can tap "Get Directions" to navigate there

## UI Changes

### Challenge Type Page

```
┌─────────────────────────────────────┐
│ 🏀 Free Throw                       │
│    Training Challenges              │
├─────────────────────────────────────┤
│ Progress: 0/3 completed             │
│ [█████░░░░░░░░░░░░░░░] 0%          │
├─────────────────────────────────────┤
│ 📍 DONAUPARK COURT                  │
│ ┌─────────────────────────────────┐ │
│ │ Free Throw Basic    [easy]     │ │
│ │ Make 5 of 10 shots             │ │
│ │ Best: Not attempted  +50 XP    │ │
│ │           [🗺️ Go to Venue]     │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ 📍 PRATER SPORTS                    │
│ ┌─────────────────────────────────┐ │
│ │ Free Throw Pro      [medium]   │ │
│ │ Make 7 of 10 shots             │ │
│ │ Best: Not attempted  +100 XP   │ │
│ │           [🗺️ Go to Venue]     │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### "Go to Venue" Button

- Each venue section has a "Go to Venue" button
- Clicking navigates to `/map?venueId={venueId}`
- Button styled as secondary action

## Code Changes

### ChallengeTypeList Component

Update the venue section to include navigation button:

```typescript
function VenueSection({ venue, challenges }) {
  const router = useRouter();

  const goToVenue = () => {
    router.push(`/map?venueId=${venue.id}`);
  };

  return (
    <div>
      <h2>{venue.name}</h2>
      {challenges.map(ch => <ChallengeCard key={ch.id} challenge={ch} />)}
      <button onClick={goToVenue}>🗺️ Go to Venue</button>
    </div>
  );
}
```

## Acceptance Criteria

1. Each venue section has "Go to Venue" button
2. Clicking navigates to Map with venue pre-selected
3. Map shows venue details and directions option
4. Back navigation returns to challenge type page
5. Works for all challenge types (Free Throw, 3-Point, Around the World)
