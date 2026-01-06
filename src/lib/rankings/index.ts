/**
 * Rankings Library
 * Functions for fetching and calculating player rankings
 */

import { eq, desc, and, sql } from 'drizzle-orm'
import { users, avatars, playerStats, sports, cities, countries } from '@/db/schema'
import type { Database } from '@/db'
import { getUserAvatarSasUrl, getDefaultAvatarSasUrl } from '@/lib/azure-storage'

/**
 * Get avatar URL with SAS token
 * Returns user's avatar SAS URL if they have one, otherwise default from Azure
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

export interface RankedPlayer {
  id: string
  rank: number
  name: string | null
  gender: string | null
  xp: number
  avatar: {
    imageUrl: string | null
    skinTone: string | null
    hairStyle: string | null
    hairColor: string | null
  } | null
  isKing: boolean
}

export interface RankingsResponse {
  level: 'venue' | 'city' | 'country'
  sport: string
  location: {
    id: string
    name: string
  } | null
  king: RankedPlayer | null
  rankings: RankedPlayer[]
  currentUser: RankedPlayer | null
  totalPlayers: number
}

export type RankingLevel = 'venue' | 'city' | 'country'

// ===========================================
// HELPER FUNCTIONS
// ===========================================

/**
 * Assign ranks to players, handling ties
 */
export function assignRanks<T extends { xp: number }>(players: T[]): (T & { rank: number })[] {
  let currentRank = 1
  let previousXp: number | null = null

  return players.map((player, index) => {
    if (previousXp !== null && player.xp < previousXp) {
      currentRank = index + 1
    }
    previousXp = player.xp
    return { ...player, rank: currentRank }
  })
}

/**
 * Get sport ID by slug
 */
export async function getSportId(db: Database, slug: string): Promise<string | null> {
  const [sport] = await db
    .select({ id: sports.id })
    .from(sports)
    .where(eq(sports.slug, slug))
    .limit(1)
  return sport?.id || null
}

// ===========================================
// DATA FETCHING
// ===========================================

/**
 * Get city rankings (filtered by age group)
 */
export async function getCityRankings(
  db: Database,
  sportId: string,
  cityId: string,
  ageGroup: string,
  limit: number = 10
): Promise<{ players: RankedPlayer[]; total: number }> {
  // Get all players in the city with stats for this sport (same age group)
  const playersWithStats = await db
    .select({
      id: users.id,
      name: users.name,
      gender: users.gender,
      xp: playerStats.totalXp,
      avatarImageUrl: avatars.imageUrl,
      avatarSkinTone: avatars.skinTone,
      avatarHairStyle: avatars.hairStyle,
      avatarHairColor: avatars.hairColor,
    })
    .from(users)
    .innerJoin(playerStats, and(eq(playerStats.userId, users.id), eq(playerStats.sportId, sportId)))
    .leftJoin(avatars, eq(avatars.userId, users.id))
    .where(and(eq(users.cityId, cityId), eq(users.ageGroup, ageGroup)))
    .orderBy(desc(playerStats.totalXp))

  const total = playersWithStats.length

  // Assign ranks
  const rankedPlayers = assignRanks(playersWithStats)

  // Transform to response format with SAS URLs
  const players: RankedPlayer[] = rankedPlayers.slice(0, limit).map((p) => ({
    id: p.id,
    rank: p.rank,
    name: p.name,
    gender: p.gender,
    xp: p.xp,
    avatar: {
      imageUrl: getAvatarSasUrl(p.id, !!p.avatarImageUrl, p.gender),
      skinTone: p.avatarSkinTone,
      hairStyle: p.avatarHairStyle,
      hairColor: p.avatarHairColor,
    },
    isKing: p.rank === 1,
  }))

  return { players, total }
}

/**
 * Get country rankings (filtered by age group)
 */
export async function getCountryRankings(
  db: Database,
  sportId: string,
  countryId: string,
  ageGroup: string,
  limit: number = 10
): Promise<{ players: RankedPlayer[]; total: number }> {
  // Get all players in cities of this country with stats (same age group)
  const playersWithStats = await db
    .select({
      id: users.id,
      name: users.name,
      gender: users.gender,
      xp: playerStats.totalXp,
      avatarImageUrl: avatars.imageUrl,
      avatarSkinTone: avatars.skinTone,
      avatarHairStyle: avatars.hairStyle,
      avatarHairColor: avatars.hairColor,
    })
    .from(users)
    .innerJoin(cities, eq(users.cityId, cities.id))
    .innerJoin(playerStats, and(eq(playerStats.userId, users.id), eq(playerStats.sportId, sportId)))
    .leftJoin(avatars, eq(avatars.userId, users.id))
    .where(and(eq(cities.countryId, countryId), eq(users.ageGroup, ageGroup)))
    .orderBy(desc(playerStats.totalXp))

  const total = playersWithStats.length

  // Assign ranks
  const rankedPlayers = assignRanks(playersWithStats)

  // Transform to response format with SAS URLs
  const players: RankedPlayer[] = rankedPlayers.slice(0, limit).map((p) => ({
    id: p.id,
    rank: p.rank,
    name: p.name,
    gender: p.gender,
    xp: p.xp,
    avatar: {
      imageUrl: getAvatarSasUrl(p.id, !!p.avatarImageUrl, p.gender),
      skinTone: p.avatarSkinTone,
      hairStyle: p.avatarHairStyle,
      hairColor: p.avatarHairColor,
    },
    isKing: p.rank === 1,
  }))

  return { players, total }
}

/**
 * Get global rankings (filtered by age group)
 */
export async function getGlobalRankings(
  db: Database,
  sportId: string,
  ageGroup: string,
  limit: number = 10
): Promise<{ players: RankedPlayer[]; total: number }> {
  const playersWithStats = await db
    .select({
      id: users.id,
      name: users.name,
      gender: users.gender,
      xp: playerStats.totalXp,
      avatarImageUrl: avatars.imageUrl,
      avatarSkinTone: avatars.skinTone,
      avatarHairStyle: avatars.hairStyle,
      avatarHairColor: avatars.hairColor,
    })
    .from(users)
    .innerJoin(playerStats, and(eq(playerStats.userId, users.id), eq(playerStats.sportId, sportId)))
    .leftJoin(avatars, eq(avatars.userId, users.id))
    .where(eq(users.ageGroup, ageGroup))
    .orderBy(desc(playerStats.totalXp))

  const total = playersWithStats.length

  // Assign ranks
  const rankedPlayers = assignRanks(playersWithStats)

  // Transform to response format with SAS URLs
  const players: RankedPlayer[] = rankedPlayers.slice(0, limit).map((p) => ({
    id: p.id,
    rank: p.rank,
    name: p.name,
    gender: p.gender,
    xp: p.xp,
    avatar: {
      imageUrl: getAvatarSasUrl(p.id, !!p.avatarImageUrl, p.gender),
      skinTone: p.avatarSkinTone,
      hairStyle: p.avatarHairStyle,
      hairColor: p.avatarHairColor,
    },
    isKing: p.rank === 1,
  }))

  return { players, total }
}

/**
 * Get current user's rank (within their age group)
 */
export async function getUserRank(
  db: Database,
  userId: string,
  sportId: string,
  ageGroup: string,
  cityId?: string
): Promise<RankedPlayer | null> {
  // Get user data
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      gender: users.gender,
      cityId: users.cityId,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (!user) return null

  // Get user's stats
  const [stats] = await db
    .select({ xp: playerStats.totalXp })
    .from(playerStats)
    .where(and(eq(playerStats.userId, userId), eq(playerStats.sportId, sportId)))
    .limit(1)

  if (!stats) {
    // User has no stats, return unranked
    const [avatar] = await db.select().from(avatars).where(eq(avatars.userId, userId)).limit(1)

    return {
      id: user.id,
      rank: 0,
      name: user.name,
      gender: user.gender,
      xp: 0,
      avatar: {
        imageUrl: getAvatarSasUrl(user.id, !!avatar?.imageUrl, user.gender),
        skinTone: avatar?.skinTone || null,
        hairStyle: avatar?.hairStyle || null,
        hairColor: avatar?.hairColor || null,
      },
      isKing: false,
    }
  }

  // Get user's avatar
  const [avatar] = await db.select().from(avatars).where(eq(avatars.userId, userId)).limit(1)

  // Calculate rank by counting players with higher XP (within same age group)
  const effectiveCityId = cityId || user.cityId

  let higherRankedCount: number

  if (effectiveCityId) {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(playerStats)
      .innerJoin(users, eq(users.id, playerStats.userId))
      .where(
        and(
          eq(playerStats.sportId, sportId),
          eq(users.cityId, effectiveCityId),
          eq(users.ageGroup, ageGroup),
          sql`${playerStats.totalXp} > ${stats.xp}`
        )
      )
    higherRankedCount = Number(result[0]?.count || 0)
  } else {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(playerStats)
      .innerJoin(users, eq(users.id, playerStats.userId))
      .where(
        and(
          eq(playerStats.sportId, sportId),
          eq(users.ageGroup, ageGroup),
          sql`${playerStats.totalXp} > ${stats.xp}`
        )
      )
    higherRankedCount = Number(result[0]?.count || 0)
  }

  const rank = higherRankedCount + 1

  return {
    id: user.id,
    rank,
    name: user.name,
    gender: user.gender,
    xp: stats.xp,
    avatar: {
      imageUrl: getAvatarSasUrl(user.id, !!avatar?.imageUrl, user.gender),
      skinTone: avatar?.skinTone || null,
      hairStyle: avatar?.hairStyle || null,
      hairColor: avatar?.hairColor || null,
    },
    isKing: rank === 1,
  }
}

/**
 * Get location info (city or country)
 */
export async function getLocationInfo(
  db: Database,
  level: RankingLevel,
  cityId?: string,
  countryId?: string
): Promise<{ id: string; name: string } | null> {
  if (level === 'city' && cityId) {
    const [city] = await db
      .select({ id: cities.id, name: cities.name })
      .from(cities)
      .where(eq(cities.id, cityId))
      .limit(1)
    return city || null
  }

  if (level === 'country' && countryId) {
    const [country] = await db
      .select({ id: countries.id, name: countries.name })
      .from(countries)
      .where(eq(countries.id, countryId))
      .limit(1)
    return country || null
  }

  return null
}

/**
 * Get user's city and country
 */
export async function getUserLocation(
  db: Database,
  userId: string
): Promise<{ cityId: string | null; countryId: string | null }> {
  const [user] = await db
    .select({
      cityId: users.cityId,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (!user?.cityId) {
    return { cityId: null, countryId: null }
  }

  const [city] = await db
    .select({ countryId: cities.countryId })
    .from(cities)
    .where(eq(cities.id, user.cityId))
    .limit(1)

  return {
    cityId: user.cityId,
    countryId: city?.countryId || null,
  }
}
