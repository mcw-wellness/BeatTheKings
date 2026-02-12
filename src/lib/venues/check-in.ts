/**
 * Venue Check-in/Check-out Logic
 * Handles auto/manual check-in, heartbeat, stale cleanup
 */

import { eq, and, sql, ne, lt } from 'drizzle-orm'
import { venues, activePlayers } from '@/db/schema'
import type { Database } from '@/db'
import { calculateDistance } from '@/lib/utils/distance'
import { logger } from '@/lib/utils/logger'

// Distance thresholds in kilometers
const MAX_CHECKIN_DISTANCE_KM = 0.5 // 500m - API max for manual check-in
const STALE_THRESHOLD_HOURS = 2

interface CheckInResult {
  success: boolean
  message: string
  distance?: number
}

interface CheckInStatus {
  isCheckedIn: boolean
  lastSeenAt: Date | null
}

/**
 * Check in to a venue with distance validation and cross-venue cleanup
 */
export async function checkInToVenue(
  db: Database,
  userId: string,
  venueId: string,
  latitude: number,
  longitude: number
): Promise<CheckInResult> {
  try {
    const [venue] = await db
      .select({
        id: venues.id,
        name: venues.name,
        latitude: venues.latitude,
        longitude: venues.longitude,
      })
      .from(venues)
      .where(eq(venues.id, venueId))
      .limit(1)

    if (!venue) {
      return { success: false, message: 'Venue not found' }
    }

    // Validate distance if venue has coordinates
    if (venue.latitude && venue.longitude) {
      const distance = calculateDistance(
        latitude, longitude,
        venue.latitude, venue.longitude
      )
      if (distance > MAX_CHECKIN_DISTANCE_KM) {
        return {
          success: false,
          message: 'Too far from venue to check in',
          distance,
        }
      }
    }

    // Clean up stale check-ins globally
    await cleanupStaleCheckIns(db)

    // Remove check-ins at OTHER venues for this user
    await db
      .delete(activePlayers)
      .where(
        and(
          eq(activePlayers.userId, userId),
          ne(activePlayers.venueId, venueId)
        )
      )

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
  } catch (error) {
    logger.error({ error, userId, venueId }, 'Failed to check in')
    return { success: false, message: 'Failed to check in' }
  }
}

/**
 * Check out from a venue (remove active player record)
 */
export async function checkOutFromVenue(
  db: Database,
  userId: string,
  venueId: string
): Promise<{ success: boolean }> {
  try {
    await db
      .delete(activePlayers)
      .where(
        and(
          eq(activePlayers.userId, userId),
          eq(activePlayers.venueId, venueId)
        )
      )
    return { success: true }
  } catch (error) {
    logger.error({ error, userId, venueId }, 'Failed to check out')
    return { success: false }
  }
}

/**
 * Check if user is currently checked in at a specific venue
 */
export async function getUserCheckInStatus(
  db: Database,
  userId: string,
  venueId: string
): Promise<CheckInStatus> {
  const [record] = await db
    .select({ lastSeenAt: activePlayers.lastSeenAt })
    .from(activePlayers)
    .where(
      and(
        eq(activePlayers.userId, userId),
        eq(activePlayers.venueId, venueId)
      )
    )
    .limit(1)

  if (!record) {
    return { isCheckedIn: false, lastSeenAt: null }
  }

  return { isCheckedIn: true, lastSeenAt: record.lastSeenAt }
}

/**
 * Update lastSeenAt and position during heartbeat polling
 */
export async function refreshCheckIn(
  db: Database,
  userId: string,
  venueId: string,
  latitude: number,
  longitude: number
): Promise<{ success: boolean }> {
  try {
    const result = await db
      .update(activePlayers)
      .set({
        latitude,
        longitude,
        lastSeenAt: new Date(),
      })
      .where(
        and(
          eq(activePlayers.userId, userId),
          eq(activePlayers.venueId, venueId)
        )
      )
      .returning()

    return { success: result.length > 0 }
  } catch (error) {
    logger.error({ error, userId, venueId }, 'Failed to refresh check-in')
    return { success: false }
  }
}

/**
 * Remove check-in records older than the stale threshold
 */
export async function cleanupStaleCheckIns(
  db: Database,
  staleThresholdHours: number = STALE_THRESHOLD_HOURS
): Promise<number> {
  try {
    const deleted = await db
      .delete(activePlayers)
      .where(
        lt(
          activePlayers.lastSeenAt,
          sql`NOW() - INTERVAL '${sql.raw(String(staleThresholdHours))} hours'`
        )
      )
      .returning()

    if (deleted.length > 0) {
      logger.info(
        { count: deleted.length, thresholdHours: staleThresholdHours },
        'Cleaned up stale check-ins'
      )
    }

    return deleted.length
  } catch (error) {
    logger.error({ error }, 'Failed to cleanup stale check-ins')
    return 0
  }
}
