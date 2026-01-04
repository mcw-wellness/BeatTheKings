/**
 * Venues Library
 * Functions for fetching and managing venue data
 */

import { eq, desc, and, sql, count } from 'drizzle-orm'
import { venues, users, avatars, playerStats, activePlayers, challenges, cities } from '@/db/schema'
import type { Database } from '@/db'
import { calculateDistance } from '@/lib/distance'
import { getUserAvatarSasUrl, getDefaultAvatarSasUrl } from '@/lib/azure-storage'

// ===========================================
// TYPES
// ===========================================

export interface VenueListItem {
  id: string
  name: string
  address: string | null
  district: string | null
  latitude: number | null
  longitude: number | null
  distance: number | null
  activePlayerCount: number
  king: {
    id: string
    name: string | null
    xp: number
    avatar: { imageUrl: string }
  } | null
  challengeCount: number
}

export interface VenueDetail {
  id: string
  name: string
  address: string | null
  district: string | null
  latitude: number | null
  longitude: number | null
  distance: number | null
  imageUrl: string | null
  description: string | null
  cityName: string | null
}

export interface ActivePlayer {
  id: string
  rank: number
  name: string | null
  avatar: { imageUrl: string }
  distance: number | null
}

export interface VenueChallenge {
  id: string
  name: string
  description: string
  xpReward: number
  rpReward: number
  difficulty: string
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

// ===========================================
// DATA FETCHING
// ===========================================

/**
 * Get list of venues sorted by distance from user
 */
export async function getVenuesList(
  db: Database,
  options: {
    userLat?: number
    userLng?: number
    cityId?: string
    sportSlug?: string
    limit?: number
  }
): Promise<{ venues: VenueListItem[]; total: number }> {
  const { userLat, userLng, cityId, limit = 20 } = options

  // Build query with optional city filter
  const whereCondition = cityId
    ? and(eq(venues.isActive, true), eq(venues.cityId, cityId))
    : eq(venues.isActive, true)

  const venueList = await db
    .select({
      id: venues.id,
      name: venues.name,
      address: venues.address,
      district: venues.district,
      latitude: venues.latitude,
      longitude: venues.longitude,
      imageUrl: venues.imageUrl,
    })
    .from(venues)
    .where(whereCondition)
    .limit(limit)

  // Calculate distances and get additional data for each venue
  const venuesWithData: VenueListItem[] = await Promise.all(
    venueList.map(async (venue) => {
      // Calculate distance if user location provided
      let distance: number | null = null
      if (userLat && userLng && venue.latitude && venue.longitude) {
        distance = calculateDistance(userLat, userLng, venue.latitude, venue.longitude)
      }

      // Get active player count
      const [activeCount] = await db
        .select({ count: count() })
        .from(activePlayers)
        .where(eq(activePlayers.venueId, venue.id))

      // Get challenge count
      const [challengeCount] = await db
        .select({ count: count() })
        .from(challenges)
        .where(eq(challenges.venueId, venue.id))

      // Get King of the Court (highest XP at this venue)
      // For now, we'll use global ranking - venue-specific will need activity tracking
      const king = await getVenueKing(db, venue.id)

      return {
        id: venue.id,
        name: venue.name,
        address: venue.address,
        district: venue.district,
        latitude: venue.latitude,
        longitude: venue.longitude,
        distance,
        activePlayerCount: Number(activeCount?.count || 0),
        king,
        challengeCount: Number(challengeCount?.count || 0),
      }
    })
  )

  // Sort by distance if available
  if (userLat && userLng) {
    venuesWithData.sort((a, b) => {
      if (a.distance === null) return 1
      if (b.distance === null) return -1
      return a.distance - b.distance
    })
  }

  return { venues: venuesWithData, total: venuesWithData.length }
}

/**
 * Get single venue details
 */
export async function getVenueById(
  db: Database,
  venueId: string,
  userLat?: number,
  userLng?: number
): Promise<VenueDetail | null> {
  const [venue] = await db
    .select({
      id: venues.id,
      name: venues.name,
      address: venues.address,
      district: venues.district,
      latitude: venues.latitude,
      longitude: venues.longitude,
      imageUrl: venues.imageUrl,
      description: venues.description,
      cityId: venues.cityId,
    })
    .from(venues)
    .where(eq(venues.id, venueId))
    .limit(1)

  if (!venue) return null

  // Get city name
  let cityName: string | null = null
  if (venue.cityId) {
    const [city] = await db
      .select({ name: cities.name })
      .from(cities)
      .where(eq(cities.id, venue.cityId))
      .limit(1)
    cityName = city?.name || null
  }

  // Calculate distance
  let distance: number | null = null
  if (userLat && userLng && venue.latitude && venue.longitude) {
    distance = calculateDistance(userLat, userLng, venue.latitude, venue.longitude)
  }

  return {
    id: venue.id,
    name: venue.name,
    address: venue.address,
    district: venue.district,
    latitude: venue.latitude,
    longitude: venue.longitude,
    distance,
    imageUrl: venue.imageUrl,
    description: venue.description,
    cityName,
  }
}

/**
 * Get King of the Court for a venue
 * Currently based on highest XP among players who have checked in
 */
async function getVenueKing(
  db: Database,
  venueId: string
): Promise<{ id: string; name: string | null; xp: number; avatar: { imageUrl: string } } | null> {
  // Get active players at this venue, sorted by XP
  const activePlayers_ = await db
    .select({
      userId: activePlayers.userId,
    })
    .from(activePlayers)
    .where(eq(activePlayers.venueId, venueId))

  if (activePlayers_.length === 0) return null

  const userIds = activePlayers_.map((p) => p.userId)

  // Get the player with highest XP among active players
  const [topPlayer] = await db
    .select({
      id: users.id,
      name: users.name,
      gender: users.gender,
      xp: playerStats.totalXp,
      hasAvatar: avatars.imageUrl,
    })
    .from(users)
    .innerJoin(playerStats, eq(playerStats.userId, users.id))
    .leftJoin(avatars, eq(avatars.userId, users.id))
    .where(sql`${users.id} IN ${userIds}`)
    .orderBy(desc(playerStats.totalXp))
    .limit(1)

  if (!topPlayer) return null

  return {
    id: topPlayer.id,
    name: topPlayer.name,
    xp: topPlayer.xp,
    avatar: {
      imageUrl: getAvatarUrl(topPlayer.id, !!topPlayer.hasAvatar, topPlayer.gender),
    },
  }
}

/**
 * Get active players at a venue
 */
export async function getActivePlayersAtVenue(
  db: Database,
  venueId: string,
  userLat?: number,
  userLng?: number
): Promise<ActivePlayer[]> {
  const activeList = await db
    .select({
      id: users.id,
      name: users.name,
      gender: users.gender,
      xp: playerStats.totalXp,
      hasAvatar: avatars.imageUrl,
      playerLat: activePlayers.latitude,
      playerLng: activePlayers.longitude,
    })
    .from(activePlayers)
    .innerJoin(users, eq(users.id, activePlayers.userId))
    .leftJoin(playerStats, eq(playerStats.userId, users.id))
    .leftJoin(avatars, eq(avatars.userId, users.id))
    .where(eq(activePlayers.venueId, venueId))
    .orderBy(desc(playerStats.totalXp))

  // Calculate ranks and distances
  return activeList.map((player, index) => {
    let distance: number | null = null
    if (userLat && userLng && player.playerLat && player.playerLng) {
      distance = calculateDistance(userLat, userLng, player.playerLat, player.playerLng)
    }

    return {
      id: player.id,
      rank: index + 1,
      name: player.name,
      avatar: {
        imageUrl: getAvatarUrl(player.id, !!player.hasAvatar, player.gender),
      },
      distance,
    }
  })
}

/**
 * Get challenges available at a venue
 */
export async function getVenueChallenges(db: Database, venueId: string): Promise<VenueChallenge[]> {
  const challengeList = await db
    .select({
      id: challenges.id,
      name: challenges.name,
      description: challenges.description,
      xpReward: challenges.xpReward,
      rpReward: challenges.rpReward,
      difficulty: challenges.difficulty,
    })
    .from(challenges)
    .where(and(eq(challenges.venueId, venueId), eq(challenges.isActive, true)))

  return challengeList
}

/**
 * Check in to a venue (mark as active player)
 */
export async function checkInToVenue(
  db: Database,
  userId: string,
  venueId: string,
  latitude: number,
  longitude: number
): Promise<{ success: boolean; message: string }> {
  try {
    // Check if venue exists
    const [venue] = await db
      .select({ id: venues.id, name: venues.name })
      .from(venues)
      .where(eq(venues.id, venueId))
      .limit(1)

    if (!venue) {
      return { success: false, message: 'Venue not found' }
    }

    // Upsert active player record
    await db
      .insert(activePlayers)
      .values({
        userId,
        venueId,
        latitude,
        longitude,
        lastSeenAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [activePlayers.userId, activePlayers.venueId],
        set: {
          latitude,
          longitude,
          lastSeenAt: new Date(),
        },
      })

    return { success: true, message: `Checked in to ${venue.name}` }
  } catch {
    return { success: false, message: 'Failed to check in' }
  }
}

/**
 * Check out from a venue (remove active player)
 */
export async function checkOutFromVenue(
  db: Database,
  userId: string,
  venueId: string
): Promise<{ success: boolean }> {
  try {
    await db
      .delete(activePlayers)
      .where(and(eq(activePlayers.userId, userId), eq(activePlayers.venueId, venueId)))
    return { success: true }
  } catch {
    return { success: false }
  }
}
