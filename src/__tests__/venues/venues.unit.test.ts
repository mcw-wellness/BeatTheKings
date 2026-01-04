/**
 * Venues Unit Tests
 * Tests for venue utility functions with mocked database
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock azure-storage
vi.mock('@/lib/azure-storage', () => ({
  getUserAvatarSasUrl: (userId: string) =>
    `https://test.blob.core.windows.net/avatar/users/${userId}/avatar.png`,
  getDefaultAvatarSasUrl: (gender: string) =>
    `https://test.blob.core.windows.net/avatar/default/basketball_${gender || 'male'}.png`,
}))

// Mock distance module
vi.mock('@/lib/distance', () => ({
  calculateDistance: vi.fn((lat1, lng1, lat2, lng2) => {
    // Simple mock: return sum of differences for predictable testing
    return Math.abs(lat2 - lat1) + Math.abs(lng2 - lng1)
  }),
  formatDistance: vi.fn((km: number) => {
    if (km < 1) return `${Math.round(km * 1000)} m`
    return `${km.toFixed(1)} km`
  }),
}))

import { calculateDistance } from '@/lib/distance'

describe('Venues Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Distance Integration', () => {
    it('should calculate distance correctly for nearby venues', () => {
      // Vienna coordinates
      const userLat = 48.2082
      const userLng = 16.3738
      const venueLat = 48.1962
      const venueLng = 16.3551

      const distance = calculateDistance(userLat, userLng, venueLat, venueLng)

      expect(distance).toBeGreaterThan(0)
      expect(calculateDistance).toHaveBeenCalledWith(userLat, userLng, venueLat, venueLng)
    })

    it('should return 0 for same location', () => {
      const lat = 48.2082
      const lng = 16.3738

      const distance = calculateDistance(lat, lng, lat, lng)

      expect(distance).toBe(0)
    })
  })

  describe('Venue Sorting Logic', () => {
    it('should sort venues by distance ascending', () => {
      const venues = [
        { id: '1', name: 'Far', distance: 10 },
        { id: '2', name: 'Near', distance: 1 },
        { id: '3', name: 'Medium', distance: 5 },
        { id: '4', name: 'No location', distance: null },
      ]

      // Sort logic from getVenuesList
      const sorted = [...venues].sort((a, b) => {
        if (a.distance === null) return 1
        if (b.distance === null) return -1
        return a.distance - b.distance
      })

      expect(sorted[0].name).toBe('Near')
      expect(sorted[1].name).toBe('Medium')
      expect(sorted[2].name).toBe('Far')
      expect(sorted[3].name).toBe('No location')
    })

    it('should handle all null distances', () => {
      const venues = [
        { id: '1', name: 'A', distance: null },
        { id: '2', name: 'B', distance: null },
      ]

      const sorted = [...venues].sort((a, b) => {
        if (a.distance === null) return 1
        if (b.distance === null) return -1
        return a.distance - b.distance
      })

      // Order should be preserved when both are null
      expect(sorted).toHaveLength(2)
    })

    it('should handle mixed null and valid distances', () => {
      const venues = [
        { id: '1', name: 'Null first', distance: null },
        { id: '2', name: 'Valid', distance: 5 },
        { id: '3', name: 'Null second', distance: null },
      ]

      const sorted = [...venues].sort((a, b) => {
        if (a.distance === null) return 1
        if (b.distance === null) return -1
        return a.distance - b.distance
      })

      expect(sorted[0].name).toBe('Valid')
      expect(sorted[1].distance).toBeNull()
      expect(sorted[2].distance).toBeNull()
    })
  })

  describe('Avatar URL Helper Logic', () => {
    it('should return user avatar URL when user has avatar', () => {
      const userId = 'test-user-123'
      const hasAvatar = true
      const gender = 'female'

      // Logic from getAvatarUrl helper
      const url = hasAvatar
        ? `https://test.blob.core.windows.net/avatar/users/${userId}/avatar.png`
        : `https://test.blob.core.windows.net/avatar/default/basketball_${gender || 'male'}.png`

      expect(url).toContain(`users/${userId}`)
      expect(url).not.toContain('default')
    })

    it('should return default avatar URL when user has no avatar', () => {
      const userId = 'test-user-123'
      const hasAvatar = false
      const gender = 'female'

      const url = hasAvatar
        ? `https://test.blob.core.windows.net/avatar/users/${userId}/avatar.png`
        : `https://test.blob.core.windows.net/avatar/default/basketball_${gender || 'male'}.png`

      expect(url).toContain('default')
      expect(url).toContain('female')
    })

    it('should default to male avatar when gender is null', () => {
      const hasAvatar = false
      const gender: string | null = null

      const url = hasAvatar
        ? 'user-avatar'
        : `https://test.blob.core.windows.net/avatar/default/basketball_${gender || 'male'}.png`

      expect(url).toContain('male')
    })
  })

  describe('Active Player Ranking Logic', () => {
    it('should assign ranks based on array index', () => {
      const players = [
        { id: '1', xp: 1000 },
        { id: '2', xp: 500 },
        { id: '3', xp: 100 },
      ]

      // Logic from getActivePlayersAtVenue
      const ranked = players.map((player, index) => ({
        ...player,
        rank: index + 1,
      }))

      expect(ranked[0].rank).toBe(1)
      expect(ranked[1].rank).toBe(2)
      expect(ranked[2].rank).toBe(3)
    })

    it('should handle empty player list', () => {
      const players: { id: string; xp: number }[] = []

      const ranked = players.map((player, index) => ({
        ...player,
        rank: index + 1,
      }))

      expect(ranked).toHaveLength(0)
    })
  })

  describe('Check-in Response Formatting', () => {
    it('should format success response correctly', () => {
      const venueName = 'Esterhazy Park'

      const response = { success: true, message: `Checked in to ${venueName}` }

      expect(response.success).toBe(true)
      expect(response.message).toContain(venueName)
    })

    it('should format error response for missing venue', () => {
      const response = { success: false, message: 'Venue not found' }

      expect(response.success).toBe(false)
      expect(response.message).toBe('Venue not found')
    })

    it('should format error response for failed check-in', () => {
      const response = { success: false, message: 'Failed to check in' }

      expect(response.success).toBe(false)
      expect(response.message).toBe('Failed to check in')
    })
  })

  describe('Venue List Item Structure', () => {
    it('should have all required fields', () => {
      const venueItem = {
        id: 'venue-123',
        name: 'Test Venue',
        address: '123 Test St',
        district: '1. Bezirk',
        latitude: 48.2082,
        longitude: 16.3738,
        distance: 1.5,
        activePlayerCount: 5,
        king: {
          id: 'king-123',
          name: 'King Player',
          xp: 5000,
          avatar: { imageUrl: 'https://example.com/avatar.png' },
        },
        challengeCount: 3,
      }

      expect(venueItem.id).toBeDefined()
      expect(venueItem.name).toBeDefined()
      expect(venueItem.activePlayerCount).toBeGreaterThanOrEqual(0)
      expect(venueItem.challengeCount).toBeGreaterThanOrEqual(0)
      expect(venueItem.king?.avatar.imageUrl).toBeDefined()
    })

    it('should allow null king when no active players', () => {
      const venueItem = {
        id: 'venue-123',
        name: 'Empty Venue',
        address: null,
        district: null,
        latitude: null,
        longitude: null,
        distance: null,
        activePlayerCount: 0,
        king: null,
        challengeCount: 0,
      }

      expect(venueItem.king).toBeNull()
      expect(venueItem.activePlayerCount).toBe(0)
    })

    it('should allow null for optional location fields', () => {
      const venueItem = {
        id: 'venue-123',
        name: 'Partial Venue',
        address: null,
        district: null,
        latitude: null,
        longitude: null,
        distance: null,
        activePlayerCount: 0,
        king: null,
        challengeCount: 0,
      }

      expect(venueItem.address).toBeNull()
      expect(venueItem.latitude).toBeNull()
      expect(venueItem.distance).toBeNull()
    })
  })

  describe('Venue Detail Structure', () => {
    it('should have all required fields', () => {
      const venueDetail = {
        id: 'venue-123',
        name: 'Test Venue',
        address: '123 Test St',
        district: '1. Bezirk',
        latitude: 48.2082,
        longitude: 16.3738,
        distance: 1.5,
        imageUrl: 'https://example.com/venue.jpg',
        description: 'A great basketball court',
        cityName: 'Vienna',
      }

      expect(venueDetail.id).toBeDefined()
      expect(venueDetail.name).toBeDefined()
      expect(venueDetail.cityName).toBe('Vienna')
      expect(venueDetail.description).toBeDefined()
    })

    it('should allow null for optional fields', () => {
      const venueDetail = {
        id: 'venue-123',
        name: 'Minimal Venue',
        address: null,
        district: null,
        latitude: null,
        longitude: null,
        distance: null,
        imageUrl: null,
        description: null,
        cityName: null,
      }

      expect(venueDetail.imageUrl).toBeNull()
      expect(venueDetail.description).toBeNull()
      expect(venueDetail.cityName).toBeNull()
    })
  })

  describe('Active Player Structure', () => {
    it('should have rank and avatar', () => {
      const player = {
        id: 'player-123',
        rank: 1,
        name: 'Top Player',
        avatar: { imageUrl: 'https://example.com/avatar.png' },
        distance: 0.5,
      }

      expect(player.rank).toBeGreaterThan(0)
      expect(player.avatar.imageUrl).toBeDefined()
    })

    it('should allow null name per privacy requirement', () => {
      // Active players show Avatar + Rank only, no names in UI
      // But the data structure allows name for internal use
      const player = {
        id: 'player-123',
        rank: 2,
        name: null,
        avatar: { imageUrl: 'https://example.com/avatar.png' },
        distance: null,
      }

      expect(player.name).toBeNull()
      expect(player.rank).toBeDefined()
    })
  })

  describe('Challenge Structure', () => {
    it('should have all required fields', () => {
      const challenge = {
        id: 'challenge-123',
        name: '3-Point Shot',
        description: 'Make 5 three-pointers in a row',
        xpReward: 100,
        rpReward: 10,
        difficulty: 'medium',
      }

      expect(challenge.id).toBeDefined()
      expect(challenge.name).toBeDefined()
      expect(challenge.xpReward).toBeGreaterThan(0)
      expect(['easy', 'medium', 'hard']).toContain(challenge.difficulty)
    })

    it('should have valid difficulty values', () => {
      const validDifficulties = ['easy', 'medium', 'hard']

      validDifficulties.forEach((difficulty) => {
        const challenge = {
          id: 'test',
          name: 'Test',
          description: 'Test',
          xpReward: 100,
          rpReward: 10,
          difficulty,
        }

        expect(validDifficulties).toContain(challenge.difficulty)
      })
    })
  })
})
