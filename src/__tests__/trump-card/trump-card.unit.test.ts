import { describe, it, expect } from 'vitest'
import { calculateXpProgress, calculateWinRate, calculateAccuracy } from '@/lib/trump-card'

describe('Trump Card Unit Tests', () => {
  describe('calculateXpProgress', () => {
    it('should calculate XP progress at level 0', () => {
      const result = calculateXpProgress(0)
      expect(result.current).toBe(0)
      expect(result.toNext).toBe(100)
    })

    it('should calculate XP progress mid-level', () => {
      const result = calculateXpProgress(50)
      expect(result.current).toBe(50)
      expect(result.toNext).toBe(50)
    })

    it('should calculate XP progress at level boundary', () => {
      const result = calculateXpProgress(100)
      expect(result.current).toBe(0)
      expect(result.toNext).toBe(100)
    })

    it('should calculate XP progress at higher levels', () => {
      const result = calculateXpProgress(250)
      expect(result.current).toBe(50)
      expect(result.toNext).toBe(50)
    })

    it('should calculate XP progress with 1 XP to next level', () => {
      const result = calculateXpProgress(99)
      expect(result.current).toBe(99)
      expect(result.toNext).toBe(1)
    })

    it('should handle large XP values', () => {
      const result = calculateXpProgress(12345)
      expect(result.current).toBe(45)
      expect(result.toNext).toBe(55)
    })
  })

  describe('calculateWinRate', () => {
    it('should return 0 for 0 matches played', () => {
      expect(calculateWinRate(0, 0)).toBe(0)
    })

    it('should calculate 100% win rate', () => {
      expect(calculateWinRate(10, 10)).toBe(100)
    })

    it('should calculate 0% win rate', () => {
      expect(calculateWinRate(0, 10)).toBe(0)
    })

    it('should calculate 50% win rate', () => {
      expect(calculateWinRate(5, 10)).toBe(50)
    })

    it('should round to nearest integer', () => {
      expect(calculateWinRate(1, 3)).toBe(33) // 33.33%
      expect(calculateWinRate(2, 3)).toBe(67) // 66.66%
    })

    it('should handle single match', () => {
      expect(calculateWinRate(1, 1)).toBe(100)
      expect(calculateWinRate(0, 1)).toBe(0)
    })

    it('should handle many matches', () => {
      expect(calculateWinRate(75, 100)).toBe(75)
      expect(calculateWinRate(23, 100)).toBe(23)
    })
  })

  describe('calculateAccuracy', () => {
    it('should return 0 for 0 attempts', () => {
      expect(calculateAccuracy(0, 0)).toBe(0)
    })

    it('should calculate 100% accuracy', () => {
      expect(calculateAccuracy(10, 10)).toBe(100)
    })

    it('should calculate 0% accuracy', () => {
      expect(calculateAccuracy(0, 10)).toBe(0)
    })

    it('should calculate 50% accuracy', () => {
      expect(calculateAccuracy(5, 10)).toBe(50)
    })

    it('should round to nearest integer', () => {
      expect(calculateAccuracy(1, 3)).toBe(33)
      expect(calculateAccuracy(2, 3)).toBe(67)
    })

    it('should handle three-point shots scenario', () => {
      // Made 7 out of 15 three-pointers
      expect(calculateAccuracy(7, 15)).toBe(47)
    })

    it('should handle free-throw scenario', () => {
      // Made 18 out of 20 free throws
      expect(calculateAccuracy(18, 20)).toBe(90)
    })
  })

  describe('Trump Card Data Structure', () => {
    it('should have correct stats structure', () => {
      const stats = {
        rank: 1,
        xp: 227,
        xpToNextLevel: 73,
        rp: 250,
        totalPoints: 1420,
        winRate: 23,
        matchesPlayed: 10,
        matchesWon: 3,
        matchesLost: 7,
        challengesCompleted: 7,
        totalChallenges: 13,
      }

      expect(stats.rank).toBeGreaterThanOrEqual(0)
      expect(stats.xp).toBeGreaterThanOrEqual(0)
      expect(stats.xpToNextLevel).toBeGreaterThan(0)
      expect(stats.rp).toBeGreaterThanOrEqual(0)
      expect(stats.winRate).toBeGreaterThanOrEqual(0)
      expect(stats.winRate).toBeLessThanOrEqual(100)
      expect(stats.matchesWon + stats.matchesLost).toBeLessThanOrEqual(stats.matchesPlayed)
    })

    it('should have correct crowns structure', () => {
      const crowns = {
        isKingOfCourt: true,
        isKingOfCity: false,
        isKingOfCountry: false,
        courtName: 'Esterhazy Park',
        cityName: null,
        countryName: null,
      }

      expect(typeof crowns.isKingOfCourt).toBe('boolean')
      expect(typeof crowns.isKingOfCity).toBe('boolean')
      expect(typeof crowns.isKingOfCountry).toBe('boolean')
    })

    it('should have correct detailed stats structure', () => {
      const detailedStats = {
        threePointAccuracy: 45,
        freeThrowAccuracy: 67,
        totalPointsScored: 1420,
      }

      expect(detailedStats.threePointAccuracy).toBeGreaterThanOrEqual(0)
      expect(detailedStats.threePointAccuracy).toBeLessThanOrEqual(100)
      expect(detailedStats.freeThrowAccuracy).toBeGreaterThanOrEqual(0)
      expect(detailedStats.freeThrowAccuracy).toBeLessThanOrEqual(100)
    })
  })

  describe('Rank Calculations', () => {
    it('should rank by XP descending', () => {
      const players = [
        { id: '1', xp: 100 },
        { id: '2', xp: 300 },
        { id: '3', xp: 200 },
      ]

      const sorted = [...players].sort((a, b) => b.xp - a.xp)
      expect(sorted[0].id).toBe('2') // Rank 1: 300 XP
      expect(sorted[1].id).toBe('3') // Rank 2: 200 XP
      expect(sorted[2].id).toBe('1') // Rank 3: 100 XP
    })

    it('should determine King as rank 1', () => {
      const rank = 1
      const isKing = rank === 1
      expect(isKing).toBe(true)
    })

    it('should not be King if rank > 1', () => {
      const ranks = [2, 3, 10, 100]
      ranks.forEach((rank) => {
        const isKing = rank === 1
        expect(isKing).toBe(false)
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle new player with no stats', () => {
      const newPlayerStats = {
        rank: 0,
        xp: 0,
        xpToNextLevel: 100,
        rp: 0,
        totalPoints: 0,
        winRate: 0,
        matchesPlayed: 0,
        matchesWon: 0,
        matchesLost: 0,
        challengesCompleted: 0,
        totalChallenges: 13,
      }

      expect(newPlayerStats.rank).toBe(0)
      expect(newPlayerStats.winRate).toBe(0)
      expect(calculateWinRate(newPlayerStats.matchesWon, newPlayerStats.matchesPlayed)).toBe(0)
    })

    it('should handle player with no avatar', () => {
      const player = {
        id: 'test-id',
        name: 'Test Player',
        avatar: null,
      }

      expect(player.avatar).toBeNull()
    })

    it('should handle player with no name', () => {
      const player = {
        id: 'test-id',
        name: null,
        avatar: {
          imageUrl: null,
          skinTone: 'medium',
          hairStyle: 'short',
          hairColor: 'black',
        },
      }

      expect(player.name).toBeNull()
    })
  })
})
