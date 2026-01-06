/**
 * Challenges Library
 * Functions for managing challenges and attempts
 */

import { eq, and, desc } from 'drizzle-orm'
import {
  challenges,
  challengeAttempts,
  playerStats,
  venues,
  sports,
  users,
  avatars,
  activePlayers,
} from '@/db/schema'
import type { Database } from '@/db'
import { calculateDistance, formatDistance } from '@/lib/utils/distance'
import { getUserAvatarSasUrl, getDefaultAvatarSasUrl } from '@/lib/azure-storage'

// ===========================================
// TYPES
// ===========================================

export interface ChallengeVenue {
  id: string
  name: string
  district: string | null
  distance: number | null
  distanceFormatted: string | null
  challengeCount: number
  activePlayerCount: number
}

export interface ChallengeDetail {
  id: string
  name: string
  description: string
  instructions: string
  challengeType: string
  difficulty: string
  xpReward: number
  rpReward: number
  sportName: string
  venueName: string
  myAttempts: number
  myBestScore: { scoreValue: number; maxValue: number } | null
}

export interface ChallengeListItem {
  id: string
  name: string
  description: string
  challengeType: string
  difficulty: string
  xpReward: number
  rpReward: number
  myAttempts: number
  completed: boolean
}

export interface AttemptResult {
  success: boolean
  xpEarned: number
  rpEarned: number
  newTotalXp: number
  newTotalRp: number
  message: string
}

// ===========================================
// HELPER FUNCTIONS
// ===========================================

function getAvatarUrl(userId: string, hasAvatar: boolean, gender: string | null): string {
  if (hasAvatar) {
    return getUserAvatarSasUrl(userId)
  }
  return getDefaultAvatarSasUrl(gender || 'male')
}

const DIFFICULTY_MULTIPLIERS: Record<string, number> = {
  easy: 1,
  medium: 1.5,
  hard: 2,
}

/**
 * Calculate XP and RP earned from a challenge attempt
 */
export function calculateChallengeRewards(
  baseXpReward: number,
  baseRpReward: number,
  difficulty: string,
  scoreValue: number,
  maxValue: number
): { xpEarned: number; rpEarned: number } {
  if (maxValue === 0) {
    return { xpEarned: 0, rpEarned: 0 }
  }

  const accuracy = scoreValue / maxValue
  const multiplier = DIFFICULTY_MULTIPLIERS[difficulty] || 1

  // Base XP scaled by accuracy and difficulty
  const xpEarned = Math.round(baseXpReward * accuracy * multiplier)

  // RP only awarded if 80%+ accuracy
  const rpEarned = accuracy >= 0.8 ? baseRpReward : 0

  return { xpEarned, rpEarned }
}

// ===========================================
// DATA FETCHING
// ===========================================

/**
 * Get venues with challenge counts, sorted by distance
 */
export async function getChallengeVenues(
  db: Database,
  options: { userLat?: number; userLng?: number; limit?: number }
): Promise<ChallengeVenue[]> {
  const { userLat, userLng, limit = 20 } = options

  // Get all active venues
  const venueList = await db
    .select({
      id: venues.id,
      name: venues.name,
      district: venues.district,
      latitude: venues.latitude,
      longitude: venues.longitude,
    })
    .from(venues)
    .where(eq(venues.isActive, true))
    .limit(limit)

  // Get challenge and active player counts for each venue
  const result: ChallengeVenue[] = await Promise.all(
    venueList.map(async (venue) => {
      // Calculate distance
      let distance: number | null = null
      let distanceFormatted: string | null = null
      if (userLat && userLng && venue.latitude && venue.longitude) {
        distance = calculateDistance(userLat, userLng, venue.latitude, venue.longitude)
        distanceFormatted = formatDistance(distance)
      }

      // Count challenges at venue
      const challengeList = await db
        .select({ id: challenges.id })
        .from(challenges)
        .where(and(eq(challenges.venueId, venue.id), eq(challenges.isActive, true)))

      // Count active players at venue
      const activeList = await db
        .select({ id: activePlayers.id })
        .from(activePlayers)
        .where(eq(activePlayers.venueId, venue.id))

      return {
        id: venue.id,
        name: venue.name,
        district: venue.district,
        distance,
        distanceFormatted,
        challengeCount: challengeList.length,
        activePlayerCount: activeList.length,
      }
    })
  )

  // Sort by distance (nulls last)
  if (userLat && userLng) {
    result.sort((a, b) => {
      if (a.distance === null) return 1
      if (b.distance === null) return -1
      return a.distance - b.distance
    })
  }

  return result
}

/**
 * Get challenges at a specific venue
 */
export async function getVenueChallenges(
  db: Database,
  venueId: string,
  userId: string
): Promise<ChallengeListItem[]> {
  // Get all active challenges at venue
  const challengeList = await db
    .select({
      id: challenges.id,
      name: challenges.name,
      description: challenges.description,
      challengeType: challenges.challengeType,
      difficulty: challenges.difficulty,
      xpReward: challenges.xpReward,
      rpReward: challenges.rpReward,
    })
    .from(challenges)
    .where(and(eq(challenges.venueId, venueId), eq(challenges.isActive, true)))

  // Get user's attempts for each challenge
  const result: ChallengeListItem[] = await Promise.all(
    challengeList.map(async (challenge) => {
      const attempts = await db
        .select({ id: challengeAttempts.id })
        .from(challengeAttempts)
        .where(
          and(eq(challengeAttempts.challengeId, challenge.id), eq(challengeAttempts.userId, userId))
        )

      return {
        ...challenge,
        myAttempts: attempts.length,
        completed: attempts.length > 0,
      }
    })
  )

  return result
}

/**
 * Get single challenge details
 */
export async function getChallengeById(
  db: Database,
  challengeId: string,
  userId: string
): Promise<ChallengeDetail | null> {
  const [challenge] = await db
    .select({
      id: challenges.id,
      name: challenges.name,
      description: challenges.description,
      instructions: challenges.instructions,
      challengeType: challenges.challengeType,
      difficulty: challenges.difficulty,
      xpReward: challenges.xpReward,
      rpReward: challenges.rpReward,
      venueId: challenges.venueId,
      sportId: challenges.sportId,
    })
    .from(challenges)
    .where(eq(challenges.id, challengeId))
    .limit(1)

  if (!challenge) return null

  // Get venue and sport names
  const [venue] = await db
    .select({ name: venues.name })
    .from(venues)
    .where(eq(venues.id, challenge.venueId))
    .limit(1)

  const [sport] = await db
    .select({ name: sports.name })
    .from(sports)
    .where(eq(sports.id, challenge.sportId))
    .limit(1)

  // Get user's attempts
  const attempts = await db
    .select({
      scoreValue: challengeAttempts.scoreValue,
      maxValue: challengeAttempts.maxValue,
    })
    .from(challengeAttempts)
    .where(
      and(eq(challengeAttempts.challengeId, challengeId), eq(challengeAttempts.userId, userId))
    )
    .orderBy(desc(challengeAttempts.completedAt))

  // Find best score (highest accuracy)
  let myBestScore: { scoreValue: number; maxValue: number } | null = null
  let bestAccuracy = 0
  for (const attempt of attempts) {
    const accuracy = attempt.maxValue > 0 ? attempt.scoreValue / attempt.maxValue : 0
    if (accuracy > bestAccuracy) {
      bestAccuracy = accuracy
      myBestScore = { scoreValue: attempt.scoreValue, maxValue: attempt.maxValue }
    }
  }

  return {
    id: challenge.id,
    name: challenge.name,
    description: challenge.description,
    instructions: challenge.instructions,
    challengeType: challenge.challengeType,
    difficulty: challenge.difficulty,
    xpReward: challenge.xpReward,
    rpReward: challenge.rpReward,
    sportName: sport?.name || 'Unknown',
    venueName: venue?.name || 'Unknown',
    myAttempts: attempts.length,
    myBestScore,
  }
}

/**
 * Record a challenge attempt and update stats
 */
export async function recordChallengeAttempt(
  db: Database,
  userId: string,
  challengeId: string,
  scoreValue: number,
  maxValue: number
): Promise<AttemptResult> {
  // Get challenge details
  const [challenge] = await db
    .select({
      id: challenges.id,
      challengeType: challenges.challengeType,
      difficulty: challenges.difficulty,
      xpReward: challenges.xpReward,
      rpReward: challenges.rpReward,
      sportId: challenges.sportId,
    })
    .from(challenges)
    .where(eq(challenges.id, challengeId))
    .limit(1)

  if (!challenge) {
    return {
      success: false,
      xpEarned: 0,
      rpEarned: 0,
      newTotalXp: 0,
      newTotalRp: 0,
      message: 'Challenge not found',
    }
  }

  // Calculate rewards
  const { xpEarned, rpEarned } = calculateChallengeRewards(
    challenge.xpReward,
    challenge.rpReward,
    challenge.difficulty,
    scoreValue,
    maxValue
  )

  // Create attempt record
  await db.insert(challengeAttempts).values({
    challengeId,
    userId,
    scoreValue,
    maxValue,
    xpEarned,
    rpEarned,
  })

  // Update player stats
  const [existingStats] = await db
    .select()
    .from(playerStats)
    .where(and(eq(playerStats.userId, userId), eq(playerStats.sportId, challenge.sportId)))
    .limit(1)

  let newTotalXp = xpEarned
  let newTotalRp = rpEarned

  if (existingStats) {
    // Update existing stats
    const updates: Record<string, number> = {
      totalXp: existingStats.totalXp + xpEarned,
      totalRp: existingStats.totalRp + rpEarned,
      availableRp: existingStats.availableRp + rpEarned,
      challengesCompleted: existingStats.challengesCompleted + 1,
    }

    // Update sport-specific stats
    if (challenge.challengeType === 'three_point') {
      updates.threePointMade = existingStats.threePointMade + scoreValue
      updates.threePointAttempted = existingStats.threePointAttempted + maxValue
    } else if (challenge.challengeType === 'free_throw') {
      updates.freeThrowMade = existingStats.freeThrowMade + scoreValue
      updates.freeThrowAttempted = existingStats.freeThrowAttempted + maxValue
    }

    await db
      .update(playerStats)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(playerStats.id, existingStats.id))

    newTotalXp = updates.totalXp as number
    newTotalRp = updates.totalRp as number
  } else {
    // Create new stats record
    const newStats: Record<string, number> = {
      totalXp: xpEarned,
      totalRp: rpEarned,
      availableRp: rpEarned,
      challengesCompleted: 1,
      threePointMade: challenge.challengeType === 'three_point' ? scoreValue : 0,
      threePointAttempted: challenge.challengeType === 'three_point' ? maxValue : 0,
      freeThrowMade: challenge.challengeType === 'free_throw' ? scoreValue : 0,
      freeThrowAttempted: challenge.challengeType === 'free_throw' ? maxValue : 0,
    }

    await db.insert(playerStats).values({
      userId,
      sportId: challenge.sportId,
      ...newStats,
    })
  }

  const accuracy = maxValue > 0 ? Math.round((scoreValue / maxValue) * 100) : 0

  return {
    success: true,
    xpEarned,
    rpEarned,
    newTotalXp,
    newTotalRp,
    message: `${accuracy}% accuracy! Earned ${xpEarned} XP${rpEarned > 0 ? ` and ${rpEarned} RP` : ''}`,
  }
}

/**
 * Get active players at a venue (for 1v1 opponent selection)
 */
export async function getVenueOpponents(
  db: Database,
  venueId: string,
  currentUserId: string
): Promise<
  Array<{
    id: string
    name: string | null
    rank: number
    avatar: { imageUrl: string }
    xp: number
  }>
> {
  // Get active players at venue (excluding current user)
  const activeList = await db
    .select({
      userId: activePlayers.userId,
    })
    .from(activePlayers)
    .where(eq(activePlayers.venueId, venueId))

  const opponentIds = activeList.map((a) => a.userId).filter((id) => id !== currentUserId)

  if (opponentIds.length === 0) return []

  // Get player details with stats
  const opponents = await Promise.all(
    opponentIds.map(async (userId) => {
      const [user] = await db
        .select({
          id: users.id,
          name: users.name,
          gender: users.gender,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)

      if (!user) return null

      // Get avatar
      const [avatar] = await db
        .select({ imageUrl: avatars.imageUrl })
        .from(avatars)
        .where(eq(avatars.userId, userId))
        .limit(1)

      // Get stats (for ranking)
      const [stats] = await db
        .select({ totalXp: playerStats.totalXp })
        .from(playerStats)
        .where(eq(playerStats.userId, userId))
        .limit(1)

      return {
        id: user.id,
        name: user.name,
        rank: 0, // Will be calculated after sorting
        avatar: {
          imageUrl: getAvatarUrl(user.id, !!avatar?.imageUrl, user.gender),
        },
        xp: stats?.totalXp || 0,
      }
    })
  )

  // Filter nulls, sort by XP, assign ranks
  const validOpponents = opponents.filter((o) => o !== null)
  validOpponents.sort((a, b) => b.xp - a.xp)
  validOpponents.forEach((o, i) => {
    o.rank = i + 1
  })

  return validOpponents
}
