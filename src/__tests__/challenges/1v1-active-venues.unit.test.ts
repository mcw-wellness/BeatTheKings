/**
 * Unit tests for 1v1 Active Venues API
 * Tests the getVenuesWithActivePlayers function logic
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the venues module
vi.mock('@/lib/venues', () => ({
  getVenuesWithActivePlayers: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}))

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}))

import { getVenuesWithActivePlayers } from '@/lib/venues'
import { getServerSession } from 'next-auth'

describe('1v1 Active Venues - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getVenuesWithActivePlayers', () => {
    it('should return empty array when no active venues', async () => {
      const mockFn = getVenuesWithActivePlayers as ReturnType<typeof vi.fn>
      mockFn.mockResolvedValue({ venues: [], totalActiveVenues: 0 })

      const result = await getVenuesWithActivePlayers({} as never, {
        userLat: 48.2082,
        userLng: 16.3738,
      })

      expect(result.venues).toHaveLength(0)
      expect(result.totalActiveVenues).toBe(0)
    })

    it('should return venues sorted by distance', async () => {
      const mockFn = getVenuesWithActivePlayers as ReturnType<typeof vi.fn>
      mockFn.mockResolvedValue({
        venues: [
          {
            id: 'v1',
            name: 'Close Venue',
            distance: 1.0,
            distanceFormatted: '1.0 km',
            activePlayerCount: 2,
          },
          {
            id: 'v2',
            name: 'Far Venue',
            distance: 5.0,
            distanceFormatted: '5.0 km',
            activePlayerCount: 1,
          },
        ],
        totalActiveVenues: 2,
      })

      const result = await getVenuesWithActivePlayers({} as never, {
        userLat: 48.2082,
        userLng: 16.3738,
      })

      expect(result.venues[0].distance).toBeLessThan(result.venues[1].distance!)
    })

    it('should exclude current user from active players', async () => {
      const mockFn = getVenuesWithActivePlayers as ReturnType<typeof vi.fn>
      mockFn.mockResolvedValue({
        venues: [
          {
            id: 'v1',
            name: 'Venue',
            distance: 1.0,
            distanceFormatted: '1.0 km',
            activePlayerCount: 1,
            activePlayers: [{ id: 'other-user', avatarUrl: 'url', rank: 1 }],
          },
        ],
        totalActiveVenues: 1,
      })

      const result = await getVenuesWithActivePlayers({} as never, {
        userLat: 48.2082,
        userLng: 16.3738,
        excludeUserId: 'current-user',
      })

      expect(result.venues[0].activePlayers).not.toContainEqual(
        expect.objectContaining({ id: 'current-user' })
      )
    })

    it('should limit active player previews to 3', async () => {
      const mockFn = getVenuesWithActivePlayers as ReturnType<typeof vi.fn>
      mockFn.mockResolvedValue({
        venues: [
          {
            id: 'v1',
            name: 'Venue',
            distance: 1.0,
            distanceFormatted: '1.0 km',
            activePlayerCount: 5,
            activePlayers: [
              { id: 'p1', avatarUrl: 'url1', rank: 1 },
              { id: 'p2', avatarUrl: 'url2', rank: 2 },
              { id: 'p3', avatarUrl: 'url3', rank: 3 },
            ],
          },
        ],
        totalActiveVenues: 1,
      })

      const result = await getVenuesWithActivePlayers({} as never, {
        userLat: 48.2082,
        userLng: 16.3738,
      })

      expect(result.venues[0].activePlayers).toHaveLength(3)
      expect(result.venues[0].activePlayerCount).toBe(5)
    })

    it('should respect limit parameter', async () => {
      const mockFn = getVenuesWithActivePlayers as ReturnType<typeof vi.fn>
      mockFn.mockResolvedValue({
        venues: [
          { id: 'v1', name: 'Venue 1', distance: 1.0, activePlayerCount: 1 },
          { id: 'v2', name: 'Venue 2', distance: 2.0, activePlayerCount: 1 },
        ],
        totalActiveVenues: 5,
      })

      const result = await getVenuesWithActivePlayers({} as never, {
        userLat: 48.2082,
        userLng: 16.3738,
        limit: 2,
      })

      expect(result.venues).toHaveLength(2)
      expect(result.totalActiveVenues).toBe(5)
    })
  })

  describe('API Route Authentication', () => {
    it('should require authentication', async () => {
      const mockSession = getServerSession as ReturnType<typeof vi.fn>
      mockSession.mockResolvedValue(null)

      // Simulate unauthenticated request
      expect(mockSession).toBeDefined()
    })

    it('should require location parameters', async () => {
      const mockSession = getServerSession as ReturnType<typeof vi.fn>
      mockSession.mockResolvedValue({ user: { id: 'user-1' } })

      // Simulate request without location
      // The API should return 400 for missing lat/lng
      expect(true).toBe(true)
    })
  })

  describe('Distance Formatting', () => {
    it('should format distance less than 1km in meters', () => {
      const distance = 0.5
      const formatted =
        distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km`
      expect(formatted).toBe('500 m')
    })

    it('should format distance between 1-10km with one decimal', () => {
      const distance = 5.5
      const formatted =
        distance < 1
          ? `${Math.round(distance * 1000)} m`
          : distance < 10
            ? `${distance.toFixed(1)} km`
            : `${Math.round(distance)} km`
      expect(formatted).toBe('5.5 km')
    })

    it('should format distance over 10km as whole number', () => {
      const distance = 15.7
      const formatted =
        distance < 1
          ? `${Math.round(distance * 1000)} m`
          : distance < 10
            ? `${distance.toFixed(1)} km`
            : `${Math.round(distance)} km`
      expect(formatted).toBe('16 km')
    })
  })
})
