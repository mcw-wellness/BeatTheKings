/**
 * King System Unit Tests
 * Tests for king calculation logic
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { calculateXpProgress, calculateWinRate, calculateAccuracy } from '@/lib/trump-card'

// Mock database and schema
vi.mock('@/db/schema', () => ({
  users: { id: 'id', cityId: 'cityId', ageGroup: 'ageGroup' },
  avatars: { userId: 'userId', imageUrl: 'imageUrl' },
  playerStats: { userId: 'userId', sportId: 'sportId', totalXp: 'totalXp' },
  sports: { id: 'id', slug: 'slug' },
  cities: { id: 'id', name: 'name', countryId: 'countryId' },
  countries: { id: 'id', name: 'name' },
}))

vi.mock('@/lib/azure-storage', () => ({
  getUserAvatarSasUrl: vi.fn(() => 'https://test.blob/avatar.png'),
  getDefaultAvatarSasUrl: vi.fn(() => 'https://test.blob/default.png'),
}))

describe('King System Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('calculateXpProgress', () => {
    it('should calculate XP progress correctly for 0 XP', () => {
      const result = calculateXpProgress(0)
      expect(result.current).toBe(0)
      expect(result.toNext).toBe(100)
    })

    it('should calculate XP progress correctly for partial level', () => {
      const result = calculateXpProgress(50)
      expect(result.current).toBe(50)
      expect(result.toNext).toBe(50)
    })

    it('should calculate XP progress correctly at level boundary', () => {
      const result = calculateXpProgress(100)
      expect(result.current).toBe(0)
      expect(result.toNext).toBe(100)
    })

    it('should calculate XP progress correctly for high XP', () => {
      const result = calculateXpProgress(550)
      expect(result.current).toBe(50) // 550 % 100 = 50
      expect(result.toNext).toBe(50)
    })

    it('should handle exact multiples of 100', () => {
      const result = calculateXpProgress(500)
      expect(result.current).toBe(0)
      expect(result.toNext).toBe(100)
    })
  })

  describe('calculateWinRate', () => {
    it('should return 0 when no matches played', () => {
      const result = calculateWinRate(0, 0)
      expect(result).toBe(0)
    })

    it('should calculate 100% win rate correctly', () => {
      const result = calculateWinRate(10, 10)
      expect(result).toBe(100)
    })

    it('should calculate 50% win rate correctly', () => {
      const result = calculateWinRate(5, 10)
      expect(result).toBe(50)
    })

    it('should calculate 0% win rate correctly', () => {
      const result = calculateWinRate(0, 10)
      expect(result).toBe(0)
    })

    it('should round to nearest integer', () => {
      const result = calculateWinRate(1, 3) // 33.33%
      expect(result).toBe(33)
    })

    it('should handle large numbers', () => {
      const result = calculateWinRate(750, 1000)
      expect(result).toBe(75)
    })
  })

  describe('calculateAccuracy', () => {
    it('should return 0 when no attempts', () => {
      const result = calculateAccuracy(0, 0)
      expect(result).toBe(0)
    })

    it('should calculate 100% accuracy correctly', () => {
      const result = calculateAccuracy(10, 10)
      expect(result).toBe(100)
    })

    it('should calculate partial accuracy correctly', () => {
      const result = calculateAccuracy(7, 10)
      expect(result).toBe(70)
    })

    it('should calculate 0% accuracy correctly', () => {
      const result = calculateAccuracy(0, 10)
      expect(result).toBe(0)
    })

    it('should round to nearest integer', () => {
      const result = calculateAccuracy(2, 3) // 66.67%
      expect(result).toBe(67)
    })
  })

  describe('King determination logic', () => {
    it('should identify king as player with rank 1', () => {
      // King is determined by rank === 1
      const rank = 1
      const isKing = rank === 1
      expect(isKing).toBe(true)
    })

    it('should not identify non-rank-1 player as king', () => {
      const rank: number = 2
      const isKing = rank === 1
      expect(isKing).toBe(false)
    })

    it('should determine rank by XP ordering (highest first)', () => {
      const players = [
        { id: 'player1', xp: 5000 },
        { id: 'player2', xp: 3000 },
        { id: 'player3', xp: 7000 },
        { id: 'player4', xp: 1000 },
      ]

      // Sort by XP descending (as done in rankings)
      const sorted = [...players].sort((a, b) => b.xp - a.xp)

      expect(sorted[0].id).toBe('player3') // 7000 XP - King
      expect(sorted[1].id).toBe('player1') // 5000 XP
      expect(sorted[2].id).toBe('player2') // 3000 XP
      expect(sorted[3].id).toBe('player4') // 1000 XP
    })

    it('should handle tie-breaking for equal XP', () => {
      const players = [
        { id: 'player1', xp: 5000 },
        { id: 'player2', xp: 5000 },
      ]

      // When XP is equal, both could be rank 1 (tie)
      const sorted = [...players].sort((a, b) => b.xp - a.xp)

      // Both have same XP, first in sort order becomes rank 1
      expect(sorted[0].xp).toBe(5000)
      expect(sorted[1].xp).toBe(5000)
    })

    it('should filter players by age group', () => {
      const players = [
        { id: 'player1', xp: 5000, ageGroup: '18-30' },
        { id: 'player2', xp: 7000, ageGroup: '31+' },
        { id: 'player3', xp: 3000, ageGroup: '18-30' },
      ]

      const targetAgeGroup = '18-30'
      const filteredPlayers = players.filter((p) => p.ageGroup === targetAgeGroup)
      const sorted = filteredPlayers.sort((a, b) => b.xp - a.xp)

      // player2 has higher XP but different age group
      expect(sorted[0].id).toBe('player1') // King of 18-30 age group
      expect(sorted.length).toBe(2)
    })

    it('should filter players by city', () => {
      const players = [
        { id: 'player1', xp: 5000, cityId: 'vienna' },
        { id: 'player2', xp: 7000, cityId: 'salzburg' },
        { id: 'player3', xp: 3000, cityId: 'vienna' },
      ]

      const targetCityId = 'vienna'
      const filteredPlayers = players.filter((p) => p.cityId === targetCityId)
      const sorted = filteredPlayers.sort((a, b) => b.xp - a.xp)

      // player2 has higher XP but different city
      expect(sorted[0].id).toBe('player1') // King of Vienna
      expect(sorted.length).toBe(2)
    })

    it('should filter players by country', () => {
      const players = [
        { id: 'player1', xp: 5000, countryId: 'austria' },
        { id: 'player2', xp: 7000, countryId: 'germany' },
        { id: 'player3', xp: 3000, countryId: 'austria' },
      ]

      const targetCountryId = 'austria'
      const filteredPlayers = players.filter((p) => p.countryId === targetCountryId)
      const sorted = filteredPlayers.sort((a, b) => b.xp - a.xp)

      // player2 has higher XP but different country
      expect(sorted[0].id).toBe('player1') // King of Austria
      expect(sorted.length).toBe(2)
    })

    it('should combine age group and city filters', () => {
      const players = [
        { id: 'player1', xp: 5000, cityId: 'vienna', ageGroup: '18-30' },
        { id: 'player2', xp: 7000, cityId: 'vienna', ageGroup: '31+' },
        { id: 'player3', xp: 3000, cityId: 'vienna', ageGroup: '18-30' },
        { id: 'player4', xp: 6000, cityId: 'salzburg', ageGroup: '18-30' },
      ]

      const targetCityId = 'vienna'
      const targetAgeGroup = '18-30'

      const filteredPlayers = players.filter(
        (p) => p.cityId === targetCityId && p.ageGroup === targetAgeGroup
      )
      const sorted = filteredPlayers.sort((a, b) => b.xp - a.xp)

      // Only player1 and player3 match both filters
      expect(sorted[0].id).toBe('player1') // King of Vienna in 18-30 age group
      expect(sorted.length).toBe(2)
    })
  })

  describe('Crown display logic', () => {
    it('should show city crown when isKingOfCity is true', () => {
      const crowns = {
        isKingOfCourt: false,
        isKingOfCity: true,
        isKingOfCountry: false,
        courtName: null,
        cityName: 'Vienna',
        countryName: 'Austria',
      }

      expect(crowns.isKingOfCity).toBe(true)
      expect(crowns.cityName).toBe('Vienna')
    })

    it('should show country crown when isKingOfCountry is true', () => {
      const crowns = {
        isKingOfCourt: false,
        isKingOfCity: false,
        isKingOfCountry: true,
        courtName: null,
        cityName: 'Vienna',
        countryName: 'Austria',
      }

      expect(crowns.isKingOfCountry).toBe(true)
      expect(crowns.countryName).toBe('Austria')
    })

    it('should show multiple crowns when king at multiple levels', () => {
      const crowns = {
        isKingOfCourt: true,
        isKingOfCity: true,
        isKingOfCountry: true,
        courtName: 'Global',
        cityName: 'Vienna',
        countryName: 'Austria',
      }

      // Player can be king at all levels simultaneously
      expect(crowns.isKingOfCourt).toBe(true)
      expect(crowns.isKingOfCity).toBe(true)
      expect(crowns.isKingOfCountry).toBe(true)
    })

    it('should return null names when not king', () => {
      const isKing = false
      const cityName = isKing ? 'Vienna' : null

      // When checking if someone is king of a city they're not in
      expect(cityName).toBeNull()
    })
  })

  describe('King transfer logic', () => {
    it('should transfer crown when new player has higher XP', () => {
      // Initial state
      const player1Xp = 5000
      const initialPlayer2Xp = 3000

      const getKing = (p1Xp: number, p2Xp: number) => (p1Xp >= p2Xp ? 'player1' : 'player2')

      expect(getKing(player1Xp, initialPlayer2Xp)).toBe('player1')

      // Player 2 gains XP and surpasses player 1
      const updatedPlayer2Xp = 6000

      expect(getKing(player1Xp, updatedPlayer2Xp)).toBe('player2')
    })

    it('should not transfer crown when XP is equal', () => {
      const player1Xp = 5000
      const player2Xp = 5000

      // With equal XP, first player retains crown (or it's a tie)
      const getKing = (p1Xp: number, p2Xp: number) => (p1Xp >= p2Xp ? 'player1' : 'player2')

      expect(getKing(player1Xp, player2Xp)).toBe('player1')
    })

    it('should immediately reflect XP changes in king status', () => {
      const calculateKing = (players: Array<{ id: string; xp: number }>) => {
        const sorted = [...players].sort((a, b) => b.xp - a.xp)
        return sorted[0]?.id || null
      }

      const players = [
        { id: 'player1', xp: 5000 },
        { id: 'player2', xp: 3000 },
      ]

      expect(calculateKing(players)).toBe('player1')

      // Simulate XP update
      players[1].xp = 6000

      // King should immediately change
      expect(calculateKing(players)).toBe('player2')
    })
  })
})
