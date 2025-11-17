# Product Requirements Document (PRD)
## Beat the Kingz - Next.js MVP

**Version:** 1.0
**Date:** November 2025
**Status:** Ready for Development

---

## Executive Summary

Beat the Kingz is a location-based sports competition platform where players compete at local venues (basketball courts, soccer fields, running tracks) through video challenges to earn XP and become "King" of their venue. MVP focuses on basketball and soccer with architecture supporting future expansion to running, cycling, and skiing.

## Core Principles

- **KISS** - Keep implementations simple, avoid over-engineering
- **YAGNI** - Build only what's needed NOW, not future possibilities
- **TDD** - Write tests first, ensure all features are tested
- **Database Safety** - All schema changes require explicit approval

## User Journey (10 Pages)

### Page 1: Email Verification
- Email input field
- "GO" button triggers verification code email
- Shows "Sending verification code..." loading state

### Page 2: Verification Code
- 6-digit code input
- "Verify" button
- Auto-advances on correct code

### Page 3: User Registration
- Name (text)
- Age (number) → calculates age group
- Gender (dropdown: Male/Female/Other)
- Location (text input)
- "Start" button

### Page 4: Profile Photo
- Camera capture or file upload
- Preview with Retake/Confirm options
- NO face recognition - just photo storage
- Sets `hasCompletedOnboarding = true`

### Page 5: Welcome/Main Hub
- "Welcome to Beat the Kingz!"
- Avatar button (active, pulsing)
- Ranking/Map/Challenge buttons (locked until avatar created)
- Progressive unlock animation

### Page 6: Avatar Creation
- Hair color/style selection
- Sport-specific equipment:
  - Basketball: jersey (with number), shorts, shoes
  - Soccer: jersey (with number), shorts, cleats
- Crown icon shows if user is King of any venue

### Page 7: Rankings
- Three tabs: Venue/City/Country
- Top 10 lists per category
- Monthly challenge section (top 5)
- Sponsors section at bottom

### Page 8: Interactive Map
- Shows all venues with sport filter
- Active player count per venue
- Click venue for details
- King of Venue highlighted with crown

### Page 9: Challenges List
- Available challenges at venues
- Status indicators (not started/in progress/completed)
- Tutorials section for each challenge type

### Page 10: Challenge Flow
- Instructions → 10-second countdown → Record
- Try Again / Upload options
- Results showing XP earned
- Verification status

## Simplified Data Model (MVP Only)

### Core Tables (6 tables for MVP)

```typescript
// 1. User - Authentication & Profile
interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string;
  age: number;
  ageGroup: 'Under-13' | '13-15' | '16-18' | '19-21' | '22-25' | '26+';
  gender: 'Male' | 'Female' | 'Other';
  location: string;
  profilePictureUrl?: string;
  hasCompletedOnboarding: boolean;
  createdAt: Date;
}

// 2. Venue - Sports Locations
interface Venue {
  id: string;
  name: string;
  venueType: 'court' | 'field' | 'track' | 'trail' | 'slope';
  sportType: 'basketball' | 'soccer' | 'running' | 'cycling' | 'skiing';
  latitude: number;
  longitude: number;
  city: string;
  country: string;
  activePlayerCount: number;
  currentKingId?: string; // User ID
}

// 3. Challenge - Activities at Venues
interface Challenge {
  id: string;
  venueId: string;
  name: string;
  description: string;
  instructions: string;
  challengeType: string; // 'free_throws', 'penalty_kicks', etc.
  parameters: {
    requiredShots?: number;
    timeLimit?: number;
    distance?: string;
  };
  xpReward: number;
  difficulty: 'easy' | 'medium' | 'hard';
  isActive: boolean;
}

// 4. ChallengeSubmission - User Attempts
interface ChallengeSubmission {
  id: string;
  challengeId: string;
  userId: string;
  videoUrl: string;
  performanceData: {
    shotsMade?: number;
    shotsAttempted?: number;
    timeTaken?: number;
  };
  verificationStatus: 'pending' | 'verified' | 'rejected';
  xpEarned: number;
  createdAt: Date;
}

// 5. PlayerStats - User Progress
interface PlayerStats {
  id: string;
  userId: string;
  totalXp: number;
  currentRank: number;
  totalChallenges: number;
  sportType: string;
  venueStats: Record<string, { rank: number; xp: number }>;
}

// 6. UserChallengeStatus - Track Progress
interface UserChallengeStatus {
  id: string;
  userId: string;
  challengeId: string;
  status: 'not_started' | 'in_progress' | 'completed';
  attempts: number;
  bestSubmissionId?: string;
  startedAt?: Date;
  completedAt?: Date;
}
```

## Tech Stack

### Frontend
- **Next.js 14+** (App Router)
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations (pulsing logo, transitions)
- **React Hook Form** - Form handling
- **Zod** - Schema validation

### Backend
- **Next.js API Routes** - RESTful endpoints
- **Azure Database for PostgreSQL** - Primary database (managed service)
- **PostGIS** - Geospatial queries (distance calculations)
- **Prisma** - ORM with migrations
- **Redis** (optional) - Session storage, caching

### Infrastructure
- **Vercel** or **Azure App Service** - Hosting
- **Azure Blob Storage** or **Cloudflare R2** - Video/image storage
- **SendGrid** or **Resend** - Email verification
- **Clerk** or custom **JWT** - Authentication

## API Endpoints (MVP)

```typescript
// Authentication
POST   /api/auth/send-verification
POST   /api/auth/verify-code
POST   /api/auth/logout

// User
GET    /api/users/profile
PUT    /api/users/profile
POST   /api/users/profile-picture
PUT    /api/users/onboarding-complete

// Venues
GET    /api/venues/nearby?lat=&lng=&radius=&sport=
GET    /api/venues/[venueId]
GET    /api/venues/[venueId]/active-players

// Challenges
GET    /api/challenges?venueId=
GET    /api/challenges/[challengeId]
POST   /api/challenges/[challengeId]/start
POST   /api/challenges/[challengeId]/submit
GET    /api/challenges/user-status

// Rankings
GET    /api/rankings/venue/[venueId]
GET    /api/rankings/city/[city]?sport=
GET    /api/rankings/country/[country]?sport=

// Stats
GET    /api/stats/user/[userId]
PUT    /api/stats/update-xp
```

## Key Features Implementation

### 1. Email Verification Flow
```typescript
// Simple 6-digit code, expires in 10 minutes
const code = Math.floor(100000 + Math.random() * 900000).toString();
const expiry = new Date(Date.now() + 10 * 60 * 1000);
```

### 2. Age Group Calculation
```typescript
function calculateAgeGroup(age: number): string {
  if (age < 13) return 'Under-13';
  if (age <= 15) return '13-15';
  if (age <= 18) return '16-18';
  if (age <= 21) return '19-21';
  if (age <= 25) return '22-25';
  return '26+';
}
```

### 3. Distance Calculation (PostGIS)
```sql
SELECT *,
  ST_Distance(
    ST_MakePoint(longitude, latitude)::geography,
    ST_MakePoint($1, $2)::geography
  ) AS distance
FROM venues
WHERE ST_DWithin(
  ST_MakePoint(longitude, latitude)::geography,
  ST_MakePoint($1, $2)::geography,
  $3 -- radius in meters
)
ORDER BY distance;
```

### 4. Progressive Feature Unlock
```typescript
// Check in middleware or component
const canAccessFeature = (user: User, feature: string) => {
  if (!user.hasCompletedOnboarding) {
    return feature === 'avatar'; // Only avatar accessible
  }
  return true; // All features unlocked
};
```

### 5. King of Venue Logic
```typescript
// Update after each challenge submission
async function updateVenueKing(venueId: string, sportType: string) {
  const topPlayer = await db.playerStats.findFirst({
    where: {
      venueStats: {
        path: [venueId],
        gte: 0
      },
      sportType
    },
    orderBy: {
      venueStats: {
        path: [venueId, 'xp'],
        order: 'desc'
      }
    }
  });

  await db.venue.update({
    where: { id: venueId },
    data: { currentKingId: topPlayer?.userId }
  });
}
```

## MVP Deliverables Checklist

### Phase 1: Foundation (Week 1-2)
- [ ] Next.js project setup with TypeScript
- [ ] Database schema creation (6 tables)
- [ ] Prisma setup with migrations
- [ ] Email verification system
- [ ] User registration flow (Pages 1-4)

### Phase 2: Core Features (Week 3-4)
- [ ] Avatar system (basic, no equipment catalog)
- [ ] Venue listing with map
- [ ] Challenge listing and details
- [ ] Video upload to cloud storage
- [ ] XP and ranking calculations

### Phase 3: Gameplay (Week 5-6)
- [ ] Challenge recording flow
- [ ] Challenge submission and verification
- [ ] User challenge status tracking
- [ ] Rankings (venue/city/country)
- [ ] King of Venue logic

### Phase 4: Polish (Week 7-8)
- [ ] UI animations (pulsing, transitions)
- [ ] Progressive feature unlock
- [ ] Tutorial content
- [ ] Testing and bug fixes
- [ ] Deployment setup

## Success Metrics

1. **User Onboarding:** 80% completion rate from email to avatar creation
2. **Challenge Participation:** Average 3+ challenges per user in first week
3. **Retention:** 40% weekly active users after first month
4. **Performance:** Page loads < 2 seconds, video upload < 30 seconds

## Out of Scope for MVP

- Face recognition
- In-app payments
- Equipment marketplace
- Social features (following, messaging)
- Advanced video analysis/AI verification
- Multiple sports beyond basketball/soccer
- Native mobile apps

## Future Enhancements (Post-MVP)

1. **Month 2:** Add running, cycling, skiing
2. **Month 3:** Equipment catalog and unlocks
3. **Month 4:** Monthly competitions with prizes
4. **Month 5:** Social features and teams
5. **Month 6:** Native mobile apps

## Technical Decisions

1. **Why Next.js?** Full-stack framework, easy deployment, good DX
2. **Why PostgreSQL?** Mature, supports geospatial with PostGIS
3. **Why Prisma?** Type-safe ORM, good migrations, works well with Next.js
4. **Why Cloud Storage?** Videos too large for database, CDN delivery
5. **Why No Face Recognition?** Complex, expensive, privacy concerns - not needed for MVP

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Video upload failures | Implement retry logic, progress indicators |
| Fake challenge submissions | Manual review for top players, community reporting |
| Database performance | Start with indices, add caching layer if needed |
| Location accuracy | Use device GPS + manual venue selection fallback |

## Development Guidelines

1. **Every feature must have tests** (unit + integration)
2. **Database changes require approval** before migration
3. **Keep components under 200 lines** - extract if larger
4. **Use conventional commits** for clear history
5. **Deploy to staging first** - never direct to production

## Questions Resolved

- ✅ **Age groups:** Calculated on signup, updated via cron job later
- ✅ **Face recognition:** NOT implementing, just photo upload
- ✅ **XP system:** Separate per sport for fair rankings
- ✅ **Initial sports:** Basketball and soccer only for MVP

---

## Next Steps

1. **Review and approve this PRD**
2. **Initialize Next.js project**
3. **Set up PostgreSQL database**
4. **Create Prisma schema from data model**
5. **Begin Phase 1 implementation**

**Ready to start building? Let's create the Next.js project!**