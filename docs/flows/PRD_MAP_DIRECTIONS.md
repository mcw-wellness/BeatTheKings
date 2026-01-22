# PRD: Map Directions Feature

## Overview

Add the ability to show directions/route from user's current location to a selected venue on the Map page.

## Current Behavior

- Map shows venues as markers
- Clicking a venue shows details panel
- No route/directions functionality

## Required Behavior

- Map can receive a pre-selected venue via URL parameter
- "Get Directions" button opens native maps app with route
- Support for Google Maps, Apple Maps, and fallback to web

## User Flow

1. User selects a venue (from challenges page or map)
2. Map shows the venue highlighted
3. User taps "Get Directions" button
4. Native maps app opens with route from current location to venue

## URL Parameters

### Map Page URL

```
/map?venueId=<venue-uuid>
```

When `venueId` is provided:

- Auto-select and center on that venue
- Show venue details panel
- Highlight "Get Directions" button

## Implementation

### Get Directions Logic

```typescript
function openDirections(venue: { lat: number; lng: number; name: string }) {
  const destination = `${venue.lat},${venue.lng}`

  // Try Google Maps first (works on Android and most browsers)
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=walking`

  // Apple Maps for iOS
  const appleMapsUrl = `maps://maps.apple.com/?daddr=${destination}&dirflg=w`

  // Detect platform and open appropriate app
  if (isIOS()) {
    window.location.href = appleMapsUrl
  } else {
    window.open(googleMapsUrl, '_blank')
  }
}
```

## UI Design

### Venue Details Panel

```
┌─────────────────────────────────────┐
│ 📍 Donaupark Court                  │
│    1.2 km away                      │
├─────────────────────────────────────┤
│ 👑 King: TomTom (2,450 XP)          │
├─────────────────────────────────────┤
│ 👥 Active Players (3)               │
│ [Avatar1] [Avatar2] [Avatar3]       │
├─────────────────────────────────────┤
│ [🗺️ Get Directions]  [🏀 Challenges]│
└─────────────────────────────────────┘
```

### Get Directions Button

- Primary action button with orange gradient
- Shows navigation icon
- Opens native maps app

## Acceptance Criteria

1. Map accepts `venueId` query parameter
2. When venueId provided, auto-selects that venue
3. "Get Directions" button visible in venue panel
4. Clicking opens native maps with walking directions
5. Works on iOS (Apple Maps) and Android/Web (Google Maps)
6. Graceful fallback if maps app not available
