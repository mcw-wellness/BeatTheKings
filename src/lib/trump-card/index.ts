/**
 * Trump Card Library
 * Functions for fetching and calculating Trump Card data
 */

import { eq, desc, and } from 'drizzle-orm'
import { users, avatars, playerStats, sports, cities, countries } from '@/db/schema'
import type { Database } from '@/db'
import { getUserAvatarSasUrl, getDefaultAvatarSasUrl } from '@/lib/azure-storage'

/**
 * Get avatar URL with SAS token
 */
function getAvatarSasUrl(userId: string, hasAvatar: boolean, gender: string | null): string {
  if (hasAvatar) {
    return getUserAvatarSasUrl(userId)
  }
  return getDefaultAvatarSasUrl(gender || 'male')
}

// ===========================================
// TYPES
// ===========================================

export interface TrumpCardData {
  player: {
    id: string
    name: string | null
    gender: string | null
    avatar: {
      imageUrl: string | null
      skinTone: string | null
      hairStyle: string | null
      hairColor: string | null
    } | null
  }
  stats: {
    rank: number
    xp: number
    xpToNextLevel: number
    rp: number
    totalPoints: number
    winRate: number
    matchesPlayed: number
    matchesWon: number
    matchesLost: number
    challengesCompleted: number
    totalChallenges: number
  }
  crowns: {
    isKingOfCourt: boolean
    isKingOfCity: boolean
    isKingOfCountry: boolean
    courtName: string | null
    cityName: string | null
    countryName: string | null
  }
  detailedStats: {
    threePointAccuracy: number
    freeThrowAccuracy: number
    totalPointsScored: number
  }
}

// ===========================================
// CONSTANTS
// ===========================================

// XP required per level (simplified progression)
const XP_PER_LEVEL = 100

// Total challenges available (will be dynamic later)
const TOTAL_CHALLENGES = 13

// ===========================================
// HELPER FUNCTIONS
// ===========================================

/**
 * Calculate XP to next level
 */
export function calculateXpProgress(totalXp: number): { current: number; toNext: number } {
  const xpInCurrentLevel = totalXp % XP_PER_LEVEL
  return {
    current: xpInCurrentLevel,
    toNext: XP_PER_LEVEL - xpInCurrentLevel,
  }
}

/**
 * Calculate win rate percentage
 */
export function calculateWinRate(won: number, played: number): number {
  if (played === 0) return 0
  return Math.round((won / played) * 100)
}

/**
 * Calculate accuracy percentage
 */
export function calculateAccuracy(made: number, attempted: number): number {
  if (attempted === 0) return 0
  return Math.round((made / attempted) * 100)
}

// ===========================================
// DATA FETCHING
// ===========================================

/**
 * Get player's rank for a specific sport
 */
export async function getPlayerRank(
  db: Database,
  userId: string,
  sportId: string
): Promise<number> {
  // Get all players ordered by XP for this sport
  const rankings = await db
    .select({
      userId: playerStats.userId,
      totalXp: playerStats.totalXp,
    })
    .from(playerStats)
    .where(eq(playerStats.sportId, sportId))
    .orderBy(desc(playerStats.totalXp))

  const playerIndex = rankings.findIndex((r) => r.userId === userId)
  return playerIndex === -1 ? 0 : playerIndex + 1
}

/**
 * Check if player is King (highest XP) for a sport
 */
export async function isKingOfSport(
  db: Database,
  userId: string,
  sportId: string
): Promise<boolean> {
  const rank = await getPlayerRank(db, userId, sportId)
  return rank === 1
}

/**
 * Check if player is King of their City (highest XP in city for sport + age group)
 */
export async function isKingOfCity(
  db: Database,
  userId: string,
  sportId: string
): Promise<{ isKing: boolean; cityName: string | null }> {
  // Get user's city and age group
  const [user] = await db
    .select({ cityId: users.cityId, ageGroup: users.ageGroup })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (!user?.cityId || !user?.ageGroup) {
    return { isKing: false, cityName: null }
  }

  // Get city name
  const [city] = await db
    .select({ name: cities.name })
    .from(cities)
    .where(eq(cities.id, user.cityId))
    .limit(1)

  // Get highest XP player in this city for this sport and age group
  const [topPlayer] = await db
    .select({ userId: playerStats.userId })
    .from(playerStats)
    .innerJoin(users, eq(users.id, playerStats.userId))
    .where(
      and(
        eq(playerStats.sportId, sportId),
        eq(users.cityId, user.cityId),
        eq(users.ageGroup, user.ageGroup)
      )
    )
    .orderBy(desc(playerStats.totalXp))
    .limit(1)

  return {
    isKing: topPlayer?.userId === userId,
    cityName: city?.name || null,
  }
}

/**
 * Check if player is King of their Country (highest XP in country for sport + age group)
 */
export async function isKingOfCountry(
  db: Database,
  userId: string,
  sportId: string
): Promise<{ isKing: boolean; countryName: string | null }> {
  // Get user's city and age group
  const [user] = await db
    .select({ cityId: users.cityId, ageGroup: users.ageGroup })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (!user?.cityId || !user?.ageGroup) {
    return { isKing: false, countryName: null }
  }

  // Get country via city
  const [city] = await db
    .select({ countryId: cities.countryId })
    .from(cities)
    .where(eq(cities.id, user.cityId))
    .limit(1)

  if (!city?.countryId) {
    return { isKing: false, countryName: null }
  }

  // Get country name
  const [country] = await db
    .select({ name: countries.name })
    .from(countries)
    .where(eq(countries.id, city.countryId))
    .limit(1)

  // Get highest XP player in this country for this sport and age group
  const [topPlayer] = await db
    .select({ userId: playerStats.userId })
    .from(playerStats)
    .innerJoin(users, eq(users.id, playerStats.userId))
    .innerJoin(cities, eq(cities.id, users.cityId))
    .where(
      and(
        eq(playerStats.sportId, sportId),
        eq(cities.countryId, city.countryId),
        eq(users.ageGroup, user.ageGroup)
      )
    )
    .orderBy(desc(playerStats.totalXp))
    .limit(1)

  return {
    isKing: topPlayer?.userId === userId,
    countryName: country?.name || null,
  }
}

/**
 * Get Trump Card data for a player
 */
export async function getTrumpCardData(
  db: Database,
  userId: string,
  sportSlug: string = 'basketball'
): Promise<TrumpCardData | null> {
  // Get user data
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

  // Get avatar data
  const [avatar] = await db
    .select({
      imageUrl: avatars.imageUrl,
      skinTone: avatars.skinTone,
      hairStyle: avatars.hairStyle,
      hairColor: avatars.hairColor,
    })
    .from(avatars)
    .where(eq(avatars.userId, userId))
    .limit(1)

  // Get sport
  const [sport] = await db
    .select({ id: sports.id })
    .from(sports)
    .where(eq(sports.slug, sportSlug))
    .limit(1)

  if (!sport) {
    // Return empty stats if sport not found
    return {
      player: {
        id: user.id,
        name: user.name,
        gender: user.gender,
        avatar: {
          imageUrl: getAvatarSasUrl(user.id, !!avatar?.imageUrl, user.gender),
          skinTone: avatar?.skinTone || null,
          hairStyle: avatar?.hairStyle || null,
          hairColor: avatar?.hairColor || null,
        },
      },
      stats: {
        rank: 0,
        xp: 0,
        xpToNextLevel: XP_PER_LEVEL,
        rp: 0,
        totalPoints: 0,
        winRate: 0,
        matchesPlayed: 0,
        matchesWon: 0,
        matchesLost: 0,
        challengesCompleted: 0,
        totalChallenges: TOTAL_CHALLENGES,
      },
      crowns: {
        isKingOfCourt: false,
        isKingOfCity: false,
        isKingOfCountry: false,
        courtName: null,
        cityName: null,
        countryName: null,
      },
      detailedStats: {
        threePointAccuracy: 0,
        freeThrowAccuracy: 0,
        totalPointsScored: 0,
      },
    }
  }

  // Get player stats for this sport
  const [stats] = await db
    .select()
    .from(playerStats)
    .where(and(eq(playerStats.userId, userId), eq(playerStats.sportId, sport.id)))
    .limit(1)

  // Calculate rank
  const rank = await getPlayerRank(db, userId, sport.id)

  // Check King status at all levels
  const isKingGlobal = rank === 1
  const cityKingStatus = await isKingOfCity(db, userId, sport.id)
  const countryKingStatus = await isKingOfCountry(db, userId, sport.id)

  // Calculate XP progress
  const xpProgress = calculateXpProgress(stats?.totalXp || 0)

  // Calculate accuracies
  const threePointAccuracy = calculateAccuracy(
    stats?.threePointMade || 0,
    stats?.threePointAttempted || 0
  )
  const freeThrowAccuracy = calculateAccuracy(
    stats?.freeThrowMade || 0,
    stats?.freeThrowAttempted || 0
  )

  return {
    player: {
      id: user.id,
      name: user.name,
      gender: user.gender,
      avatar: {
        imageUrl: getAvatarSasUrl(user.id, !!avatar?.imageUrl, user.gender),
        skinTone: avatar?.skinTone || null,
        hairStyle: avatar?.hairStyle || null,
        hairColor: avatar?.hairColor || null,
      },
    },
    stats: {
      rank,
      xp: stats?.totalXp || 0,
      xpToNextLevel: xpProgress.toNext,
      rp: stats?.availableRp || 0,
      totalPoints: stats?.totalPointsScored || 0,
      winRate: calculateWinRate(stats?.matchesWon || 0, stats?.matchesPlayed || 0),
      matchesPlayed: stats?.matchesPlayed || 0,
      matchesWon: stats?.matchesWon || 0,
      matchesLost: stats?.matchesLost || 0,
      challengesCompleted: stats?.challengesCompleted || 0,
      totalChallenges: TOTAL_CHALLENGES,
    },
    crowns: {
      isKingOfCourt: isKingGlobal, // Global rank #1 for the sport
      isKingOfCity: cityKingStatus.isKing,
      isKingOfCountry: countryKingStatus.isKing,
      courtName: isKingGlobal ? 'Global' : null,
      cityName: cityKingStatus.cityName,
      countryName: countryKingStatus.countryName,
    },
    detailedStats: {
      threePointAccuracy,
      freeThrowAccuracy,
      totalPointsScored: stats?.totalPointsScored || 0,
    },
  }
}

/**
 * Check if a user exists
 */
export async function userExists(db: Database, userId: string): Promise<boolean> {
  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, userId)).limit(1)
  return !!user
}
