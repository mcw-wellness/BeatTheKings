// Types aligned with Prisma schema - MVP Phase 1

export type AgeGroup = 'Under-13' | '13-15' | '16-18' | '19-21' | '22-25' | '26+'
export type Gender = 'Male' | 'Female' | 'Other'
export type VenueType = 'court' | 'field' | 'track' | 'trail' | 'slope'
export type SportType = 'basketball' | 'soccer' | 'running' | 'cycling' | 'skiing'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type VerificationStatus = 'pending' | 'verified' | 'rejected'
export type ChallengeStatusType = 'not_started' | 'in_progress' | 'completed'

export interface User {
  id: string
  email: string
  emailVerified: boolean
  verificationCode?: string
  verificationCodeExpiry?: Date
  name: string
  age: number
  ageGroup: AgeGroup
  gender: Gender
  location: string
  profilePictureUrl?: string
  hasCompletedOnboarding: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Venue {
  id: string
  name: string
  venueType: VenueType
  sportType: SportType
  address?: string
  latitude: number
  longitude: number
  city: string
  country: string
  activePlayerCount: number
  currentKingId?: string
  description?: string
  createdAt: Date
  updatedAt: Date
}

export interface Challenge {
  id: string
  venueId: string
  name: string
  description: string
  instructions: string
  challengeType: string
  parameters: {
    requiredShots?: number
    timeLimit?: number
    distance?: string
    [key: string]: string | number | undefined
  }
  xpReward: number
  difficulty: Difficulty
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ChallengeSubmission {
  id: string
  challengeId: string
  userId: string
  videoUrl: string
  performanceData: {
    shotsMade?: number
    shotsAttempted?: number
    timeTaken?: number
    distance?: number
    [key: string]: string | number | undefined
  }
  verificationStatus: VerificationStatus
  verifiedAt?: Date
  xpEarned: number
  createdAt: Date
}

export interface PlayerStats {
  id: string
  userId: string
  totalXp: number
  currentRank: number
  totalChallenges: number
  sportType: SportType
  venueStatsJson: {
    [venueId: string]: {
      rank: number
      xp: number
    }
  }
  updatedAt: Date
}

export interface UserChallengeStatus {
  id: string
  userId: string
  challengeId: string
  status: ChallengeStatusType
  startedAt?: Date
  completedAt?: Date
  attempts: number
  bestSubmissionId?: string
  createdAt: Date
  updatedAt: Date
}

// Avatar (Phase 2, but needed for UI)
export interface Avatar {
  id: string
  userId: string
  hairColor: string
  hairStyle: string
  jerseyNumber?: number
  equippedItems: {
    head?: string
    torso?: string
    legs?: string
    feet?: string
  }
  createdAt: Date
  updatedAt: Date
}

// Extended types for UI
export interface VenueWithKing extends Venue {
  currentKing?: User
}

export interface ChallengeWithVenue extends Challenge {
  venue: Venue
}

export interface PlayerWithStats {
  user: User
  stats: PlayerStats
  avatar?: Avatar
}
