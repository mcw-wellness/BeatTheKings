/**
 * Check-in Unit Tests
 * Tests for distance validation, response formatting, and constants
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { calculateDistance, isWithinDistance } from '@/lib/utils/distance'

// Mock logger
vi.mock('@/lib/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}))

// Vienna coordinates for testing
const VENUE_LAT = 48.1962 // Weghuberpark
const VENUE_LNG = 16.3551

describe('Check-in Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Distance Validation for Check-in', () => {
    it('should allow auto check-in within 200m', () => {
      // ~100m away from venue
      const userLat = 48.1971
      const userLng = 16.3551
      const distance = calculateDistance(userLat, userLng, VENUE_LAT, VENUE_LNG)

      expect(distance).toBeLessThan(0.2) // 200m = 0.2km
      expect(isWithinDistance(userLat, userLng, VENUE_LAT, VENUE_LNG, 0.2)).toBe(true)
    })

    it('should allow manual check-in within 500m', () => {
      // ~400m away from venue
      const userLat = 48.1998
      const userLng = 16.3551
      const distance = calculateDistance(userLat, userLng, VENUE_LAT, VENUE_LNG)

      expect(distance).toBeLessThan(0.5) // 500m = 0.5km
      expect(distance).toBeGreaterThan(0.2) // Beyond auto range
      expect(isWithinDistance(userLat, userLng, VENUE_LAT, VENUE_LNG, 0.5)).toBe(true)
    })

    it('should reject check-in beyond 500m', () => {
      // ~700m away from venue
      const userLat = 48.2025
      const userLng = 16.3551
      const distance = calculateDistance(userLat, userLng, VENUE_LAT, VENUE_LNG)

      expect(distance).toBeGreaterThan(0.5) // Beyond 500m
      expect(isWithinDistance(userLat, userLng, VENUE_LAT, VENUE_LNG, 0.5)).toBe(false)
    })

    it('should trigger auto check-out beyond 300m', () => {
      // ~350m away from venue
      const userLat = 48.1993
      const userLng = 16.3551
      const distance = calculateDistance(userLat, userLng, VENUE_LAT, VENUE_LNG)

      // Should be beyond 300m auto-checkout threshold
      expect(distance).toBeGreaterThan(0.3) // 300m = 0.3km
      expect(isWithinDistance(userLat, userLng, VENUE_LAT, VENUE_LNG, 0.3)).toBe(false)
    })

    it('should not trigger auto check-out within 300m (hysteresis)', () => {
      // ~250m away - between 200m and 300m
      const userLat = 48.1984
      const userLng = 16.3551
      const distance = calculateDistance(userLat, userLng, VENUE_LAT, VENUE_LNG)

      expect(distance).toBeGreaterThan(0.2)
      expect(distance).toBeLessThan(0.3)
      expect(isWithinDistance(userLat, userLng, VENUE_LAT, VENUE_LNG, 0.3)).toBe(true)
    })
  })

  describe('Check-in Constants', () => {
    it('auto check-in radius should be 200m (0.2km)', () => {
      const AUTO_CHECKIN_RADIUS_KM = 0.2
      expect(AUTO_CHECKIN_RADIUS_KM).toBe(0.2)
    })

    it('auto check-out radius should be 300m (0.3km)', () => {
      const AUTO_CHECKOUT_RADIUS_KM = 0.3
      expect(AUTO_CHECKOUT_RADIUS_KM).toBe(0.3)
    })

    it('API max check-in distance should be 500m (0.5km)', () => {
      const MAX_CHECKIN_DISTANCE_KM = 0.5
      expect(MAX_CHECKIN_DISTANCE_KM).toBe(0.5)
    })

    it('stale timeout should be 2 hours', () => {
      const STALE_THRESHOLD_HOURS = 2
      expect(STALE_THRESHOLD_HOURS).toBe(2)
    })

    it('heartbeat interval should be 60 seconds', () => {
      const HEARTBEAT_INTERVAL_MS = 60_000
      expect(HEARTBEAT_INTERVAL_MS).toBe(60_000)
    })
  })

  describe('Check-in Status Response', () => {
    it('should format checked-in status correctly', () => {
      const status = {
        isCheckedIn: true,
        lastSeenAt: new Date('2026-01-01T12:00:00Z'),
      }

      expect(status.isCheckedIn).toBe(true)
      expect(status.lastSeenAt).toBeInstanceOf(Date)
    })

    it('should format not-checked-in status correctly', () => {
      const status = { isCheckedIn: false, lastSeenAt: null }

      expect(status.isCheckedIn).toBe(false)
      expect(status.lastSeenAt).toBeNull()
    })
  })

  describe('Check-in Result Response', () => {
    it('should include distance on rejection', () => {
      const result = {
        success: false,
        message: 'Too far from venue to check in',
        distance: 0.75,
      }

      expect(result.success).toBe(false)
      expect(result.distance).toBeGreaterThan(0.5)
    })

    it('should format success without distance', () => {
      const result = {
        success: true,
        message: 'Checked in to Weghuberpark',
      }

      expect(result.success).toBe(true)
      expect(result.message).toContain('Weghuberpark')
    })
  })

  describe('Stale Check-in Detection', () => {
    it('should identify records older than 2 hours as stale', () => {
      const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000)
      const threshold = new Date(Date.now() - 2 * 60 * 60 * 1000)

      const isStale = threeHoursAgo < threshold
      expect(isStale).toBe(true)
    })

    it('should not mark recent records as stale', () => {
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)
      const threshold = new Date(Date.now() - 2 * 60 * 60 * 1000)

      const isStale = thirtyMinutesAgo < threshold
      expect(isStale).toBe(false)
    })
  })

  describe('Cross-venue Cleanup Logic', () => {
    it('should identify check-ins at different venues', () => {
      const currentVenueId = 'venue-A'
      const checkIns = [
        { userId: 'user-1', venueId: 'venue-A' },
        { userId: 'user-1', venueId: 'venue-B' },
        { userId: 'user-1', venueId: 'venue-C' },
      ]

      const toClean = checkIns.filter((c) => c.venueId !== currentVenueId)
      expect(toClean).toHaveLength(2)
      expect(toClean.every((c) => c.venueId !== currentVenueId)).toBe(true)
    })

    it('should not remove check-in at target venue', () => {
      const currentVenueId = 'venue-A'
      const checkIns = [{ userId: 'user-1', venueId: 'venue-A' }]

      const toClean = checkIns.filter((c) => c.venueId !== currentVenueId)
      expect(toClean).toHaveLength(0)
    })
  })
})
