import { describe, it, expect } from 'vitest'
import { calculateDistance, formatDistance, isWithinDistance } from '@/lib/utils/distance'

describe('Distance Utilities', () => {
  describe('calculateDistance', () => {
    it('returns 0 for same coordinates', () => {
      const distance = calculateDistance(48.2082, 16.3738, 48.2082, 16.3738)
      expect(distance).toBe(0)
    })

    it('calculates distance between Vienna and Salzburg correctly', () => {
      // Vienna: 48.2082° N, 16.3738° E
      // Salzburg: 47.8095° N, 13.0550° E
      // Actual straight-line distance: ~251 km
      const distance = calculateDistance(48.2082, 16.3738, 47.8095, 13.055)
      expect(distance).toBeGreaterThan(245)
      expect(distance).toBeLessThan(260)
    })

    it('calculates short distance correctly', () => {
      // Two points ~1km apart in Vienna
      const distance = calculateDistance(48.2082, 16.3738, 48.2172, 16.3738)
      expect(distance).toBeGreaterThan(0.9)
      expect(distance).toBeLessThan(1.1)
    })

    it('handles negative coordinates', () => {
      // New York to Sydney
      const distance = calculateDistance(40.7128, -74.006, -33.8688, 151.2093)
      expect(distance).toBeGreaterThan(15000)
      expect(distance).toBeLessThan(16500)
    })
  })

  describe('formatDistance', () => {
    it('formats distances under 1km in meters', () => {
      expect(formatDistance(0.3)).toBe('300 m')
      expect(formatDistance(0.5)).toBe('500 m')
      expect(formatDistance(0.05)).toBe('50 m')
    })

    it('formats distances 1-10km with one decimal', () => {
      expect(formatDistance(1.5)).toBe('1.5 km')
      expect(formatDistance(5.25)).toBe('5.3 km')
      expect(formatDistance(9.99)).toBe('10.0 km')
    })

    it('formats distances over 10km as whole numbers', () => {
      expect(formatDistance(15.3)).toBe('15 km')
      expect(formatDistance(100.7)).toBe('101 km')
    })
  })

  describe('isWithinDistance', () => {
    it('returns true when within distance', () => {
      // Same location
      expect(isWithinDistance(48.2082, 16.3738, 48.2082, 16.3738, 1)).toBe(true)

      // Very close points
      expect(isWithinDistance(48.2082, 16.3738, 48.209, 16.374, 1)).toBe(true)
    })

    it('returns false when outside distance', () => {
      // Vienna to Salzburg (~295km) with 100km limit
      expect(isWithinDistance(48.2082, 16.3738, 47.8095, 13.055, 100)).toBe(false)
    })

    it('returns true at exact boundary', () => {
      // Two points 1km apart
      const lat1 = 48.2082
      const lon1 = 16.3738
      const lat2 = 48.2172 // Approximately 1km north
      const lon2 = 16.3738

      const actualDistance = calculateDistance(lat1, lon1, lat2, lon2)
      expect(isWithinDistance(lat1, lon1, lat2, lon2, actualDistance)).toBe(true)
    })
  })
})
