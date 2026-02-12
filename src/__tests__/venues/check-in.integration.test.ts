/**
 * Check-in Integration Tests
 * Full flow tests with real PGLite database
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { eq, and } from 'drizzle-orm'
import { createTestDb, closeTestDb, clearTestDb, testFactories } from '@/db/test-utils'
import { activePlayers } from '@/db/schema'
import {
  checkInToVenue,
  checkOutFromVenue,
  getUserCheckInStatus,
  refreshCheckIn,
  cleanupStaleCheckIns,
} from '@/lib/venues/check-in'
import type { Database } from '@/db'

let db: Database

beforeAll(async () => {
  db = await createTestDb()
})

afterAll(async () => {
  await closeTestDb()
})

beforeEach(async () => {
  await clearTestDb(db)
})

// Venue at Weghuberpark, Vienna
const VENUE_LAT = 48.1962
const VENUE_LNG = 16.3551

describe('Check-in Integration Tests', () => {
  describe('checkInToVenue', () => {
    it('should check in when user is within 500m', async () => {
      const { venue, city } = await testFactories.createVenueWithLocation(db)
      // Update venue with known coordinates
      const country = await testFactories.createCountry(db)
      const city2 = await testFactories.createCity(db, country.id)
      const v = await testFactories.createVenue(db, city2.id, {
        latitude: VENUE_LAT,
        longitude: VENUE_LNG,
      })
      const user = await testFactories.createUser(db)

      // User ~100m from venue
      const result = await checkInToVenue(
        db, user.id, v.id, 48.1971, 16.3551
      )

      expect(result.success).toBe(true)
      expect(result.message).toContain(v.name)
    })

    it('should reject check-in when user is beyond 500m', async () => {
      const country = await testFactories.createCountry(db)
      const city = await testFactories.createCity(db, country.id)
      const venue = await testFactories.createVenue(db, city.id, {
        latitude: VENUE_LAT,
        longitude: VENUE_LNG,
      })
      const user = await testFactories.createUser(db)

      // User ~1km away
      const result = await checkInToVenue(
        db, user.id, venue.id, 48.205, 16.3551
      )

      expect(result.success).toBe(false)
      expect(result.message).toBe('Too far from venue to check in')
      expect(result.distance).toBeGreaterThan(0.5)
    })

    it('should allow check-in when venue has no coordinates', async () => {
      const country = await testFactories.createCountry(db)
      const city = await testFactories.createCity(db, country.id)
      const venue = await testFactories.createVenue(db, city.id, {
        latitude: undefined,
        longitude: undefined,
      })
      const user = await testFactories.createUser(db)

      const result = await checkInToVenue(
        db, user.id, venue.id, 48.2082, 16.3738
      )

      expect(result.success).toBe(true)
    })

    it('should return error for non-existent venue', async () => {
      const user = await testFactories.createUser(db)

      const result = await checkInToVenue(
        db,
        user.id,
        '00000000-0000-0000-0000-000000000000',
        48.2082,
        16.3738
      )

      expect(result.success).toBe(false)
      expect(result.message).toBe('Venue not found')
    })

    it('should clean up check-ins at other venues', async () => {
      const country = await testFactories.createCountry(db)
      const city = await testFactories.createCity(db, country.id)
      const venueA = await testFactories.createVenue(db, city.id, {
        name: 'Venue A',
        latitude: VENUE_LAT,
        longitude: VENUE_LNG,
      })
      const venueB = await testFactories.createVenue(db, city.id, {
        name: 'Venue B',
        latitude: VENUE_LAT + 0.001,
        longitude: VENUE_LNG,
      })
      const user = await testFactories.createUser(db)

      // Check in to venue A first
      await checkInToVenue(db, user.id, venueA.id, VENUE_LAT, VENUE_LNG)

      // Verify checked in at A
      const statusA = await getUserCheckInStatus(db, user.id, venueA.id)
      expect(statusA.isCheckedIn).toBe(true)

      // Now check in to venue B (near enough)
      await checkInToVenue(
        db, user.id, venueB.id, VENUE_LAT + 0.001, VENUE_LNG
      )

      // Venue A record should be cleaned up
      const statusAfter = await getUserCheckInStatus(db, user.id, venueA.id)
      expect(statusAfter.isCheckedIn).toBe(false)

      // Venue B should be active
      const statusB = await getUserCheckInStatus(db, user.id, venueB.id)
      expect(statusB.isCheckedIn).toBe(true)
    })

    it('should upsert on re-check-in to same venue', async () => {
      const country = await testFactories.createCountry(db)
      const city = await testFactories.createCity(db, country.id)
      const venue = await testFactories.createVenue(db, city.id, {
        latitude: VENUE_LAT,
        longitude: VENUE_LNG,
      })
      const user = await testFactories.createUser(db)

      // Check in twice
      await checkInToVenue(db, user.id, venue.id, VENUE_LAT, VENUE_LNG)
      await checkInToVenue(
        db, user.id, venue.id, VENUE_LAT + 0.0001, VENUE_LNG
      )

      // Should still only have one record
      const records = await db
        .select()
        .from(activePlayers)
        .where(
          and(
            eq(activePlayers.userId, user.id),
            eq(activePlayers.venueId, venue.id)
          )
        )

      expect(records).toHaveLength(1)
    })
  })

  describe('checkOutFromVenue', () => {
    it('should remove active player record', async () => {
      const country = await testFactories.createCountry(db)
      const city = await testFactories.createCity(db, country.id)
      const venue = await testFactories.createVenue(db, city.id, {
        latitude: VENUE_LAT,
        longitude: VENUE_LNG,
      })
      const user = await testFactories.createUser(db)

      // Check in then check out
      await checkInToVenue(db, user.id, venue.id, VENUE_LAT, VENUE_LNG)
      const result = await checkOutFromVenue(db, user.id, venue.id)

      expect(result.success).toBe(true)

      const status = await getUserCheckInStatus(db, user.id, venue.id)
      expect(status.isCheckedIn).toBe(false)
    })

    it('should succeed even if not checked in', async () => {
      const country = await testFactories.createCountry(db)
      const city = await testFactories.createCity(db, country.id)
      const venue = await testFactories.createVenue(db, city.id)
      const user = await testFactories.createUser(db)

      const result = await checkOutFromVenue(db, user.id, venue.id)
      expect(result.success).toBe(true)
    })
  })

  describe('getUserCheckInStatus', () => {
    it('should return isCheckedIn true when checked in', async () => {
      const country = await testFactories.createCountry(db)
      const city = await testFactories.createCity(db, country.id)
      const venue = await testFactories.createVenue(db, city.id, {
        latitude: VENUE_LAT,
        longitude: VENUE_LNG,
      })
      const user = await testFactories.createUser(db)

      await checkInToVenue(db, user.id, venue.id, VENUE_LAT, VENUE_LNG)

      const status = await getUserCheckInStatus(db, user.id, venue.id)
      expect(status.isCheckedIn).toBe(true)
      expect(status.lastSeenAt).toBeInstanceOf(Date)
    })

    it('should return isCheckedIn false when not checked in', async () => {
      const country = await testFactories.createCountry(db)
      const city = await testFactories.createCity(db, country.id)
      const venue = await testFactories.createVenue(db, city.id)
      const user = await testFactories.createUser(db)

      const status = await getUserCheckInStatus(db, user.id, venue.id)
      expect(status.isCheckedIn).toBe(false)
      expect(status.lastSeenAt).toBeNull()
    })
  })

  describe('refreshCheckIn', () => {
    it('should update lastSeenAt for existing check-in', async () => {
      const country = await testFactories.createCountry(db)
      const city = await testFactories.createCity(db, country.id)
      const venue = await testFactories.createVenue(db, city.id, {
        latitude: VENUE_LAT,
        longitude: VENUE_LNG,
      })
      const user = await testFactories.createUser(db)

      await checkInToVenue(db, user.id, venue.id, VENUE_LAT, VENUE_LNG)

      const beforeStatus = await getUserCheckInStatus(db, user.id, venue.id)
      const beforeTime = beforeStatus.lastSeenAt!

      // Small delay to ensure different timestamp
      await new Promise((r) => setTimeout(r, 50))

      const result = await refreshCheckIn(
        db, user.id, venue.id,
        VENUE_LAT + 0.0001, VENUE_LNG
      )

      expect(result.success).toBe(true)

      const afterStatus = await getUserCheckInStatus(db, user.id, venue.id)
      expect(afterStatus.lastSeenAt!.getTime()).toBeGreaterThanOrEqual(
        beforeTime.getTime()
      )
    })

    it('should fail when no check-in exists', async () => {
      const country = await testFactories.createCountry(db)
      const city = await testFactories.createCity(db, country.id)
      const venue = await testFactories.createVenue(db, city.id)
      const user = await testFactories.createUser(db)

      const result = await refreshCheckIn(
        db, user.id, venue.id, 48.2082, 16.3738
      )

      expect(result.success).toBe(false)
    })
  })

  describe('cleanupStaleCheckIns', () => {
    it('should remove check-ins older than threshold', async () => {
      const country = await testFactories.createCountry(db)
      const city = await testFactories.createCity(db, country.id)
      const venue = await testFactories.createVenue(db, city.id)
      const user = await testFactories.createUser(db)

      // Insert a record with old lastSeenAt
      await db.insert(activePlayers).values({
        userId: user.id,
        venueId: venue.id,
        latitude: 48.2082,
        longitude: 16.3738,
        lastSeenAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
      })

      const deleted = await cleanupStaleCheckIns(db, 2)
      expect(deleted).toBe(1)

      const status = await getUserCheckInStatus(db, user.id, venue.id)
      expect(status.isCheckedIn).toBe(false)
    })

    it('should not remove recent check-ins', async () => {
      const country = await testFactories.createCountry(db)
      const city = await testFactories.createCity(db, country.id)
      const venue = await testFactories.createVenue(db, city.id, {
        latitude: VENUE_LAT,
        longitude: VENUE_LNG,
      })
      const user = await testFactories.createUser(db)

      // Fresh check-in
      await checkInToVenue(db, user.id, venue.id, VENUE_LAT, VENUE_LNG)

      const deleted = await cleanupStaleCheckIns(db, 2)
      expect(deleted).toBe(0)

      const status = await getUserCheckInStatus(db, user.id, venue.id)
      expect(status.isCheckedIn).toBe(true)
    })
  })

  describe('Full Check-in Flow', () => {
    it('check in → heartbeat → check out → verify removed', async () => {
      const country = await testFactories.createCountry(db)
      const city = await testFactories.createCity(db, country.id)
      const venue = await testFactories.createVenue(db, city.id, {
        latitude: VENUE_LAT,
        longitude: VENUE_LNG,
      })
      const user = await testFactories.createUser(db)

      // 1. Check in
      const checkInResult = await checkInToVenue(
        db, user.id, venue.id, VENUE_LAT, VENUE_LNG
      )
      expect(checkInResult.success).toBe(true)

      // 2. Verify checked in
      let status = await getUserCheckInStatus(db, user.id, venue.id)
      expect(status.isCheckedIn).toBe(true)

      // 3. Heartbeat
      const refreshResult = await refreshCheckIn(
        db, user.id, venue.id,
        VENUE_LAT + 0.0001, VENUE_LNG
      )
      expect(refreshResult.success).toBe(true)

      // 4. Check out
      const checkOutResult = await checkOutFromVenue(
        db, user.id, venue.id
      )
      expect(checkOutResult.success).toBe(true)

      // 5. Verify removed
      status = await getUserCheckInStatus(db, user.id, venue.id)
      expect(status.isCheckedIn).toBe(false)
    })
  })
})
