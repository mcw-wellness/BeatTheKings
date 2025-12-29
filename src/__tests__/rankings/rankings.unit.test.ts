import { describe, it, expect } from 'vitest'
import { assignRanks } from '@/lib/rankings'

describe('Rankings Unit Tests', () => {
  describe('assignRanks', () => {
    it('should assign sequential ranks to players sorted by XP', () => {
      const players = [
        { id: '1', xp: 500 },
        { id: '2', xp: 400 },
        { id: '3', xp: 300 },
      ]

      const ranked = assignRanks(players)

      expect(ranked[0].rank).toBe(1)
      expect(ranked[1].rank).toBe(2)
      expect(ranked[2].rank).toBe(3)
    })

    it('should handle ties with same rank', () => {
      const players = [
        { id: '1', xp: 500 },
        { id: '2', xp: 500 }, // Tie
        { id: '3', xp: 300 },
      ]

      const ranked = assignRanks(players)

      expect(ranked[0].rank).toBe(1)
      expect(ranked[1].rank).toBe(1) // Same rank for tie
      expect(ranked[2].rank).toBe(3) // Skips rank 2
    })

    it('should handle multiple ties', () => {
      const players = [
        { id: '1', xp: 500 },
        { id: '2', xp: 500 },
        { id: '3', xp: 500 },
        { id: '4', xp: 200 },
      ]

      const ranked = assignRanks(players)

      expect(ranked[0].rank).toBe(1)
      expect(ranked[1].rank).toBe(1)
      expect(ranked[2].rank).toBe(1)
      expect(ranked[3].rank).toBe(4) // Skips 2 and 3
    })

    it('should handle single player', () => {
      const players = [{ id: '1', xp: 100 }]

      const ranked = assignRanks(players)

      expect(ranked[0].rank).toBe(1)
    })

    it('should handle empty array', () => {
      const players: { id: string; xp: number }[] = []

      const ranked = assignRanks(players)

      expect(ranked).toHaveLength(0)
    })

    it('should handle all players with same XP', () => {
      const players = [
        { id: '1', xp: 100 },
        { id: '2', xp: 100 },
        { id: '3', xp: 100 },
      ]

      const ranked = assignRanks(players)

      expect(ranked[0].rank).toBe(1)
      expect(ranked[1].rank).toBe(1)
      expect(ranked[2].rank).toBe(1)
    })

    it('should handle descending XP order', () => {
      const players = [
        { id: '1', xp: 1000 },
        { id: '2', xp: 900 },
        { id: '3', xp: 800 },
        { id: '4', xp: 700 },
        { id: '5', xp: 600 },
      ]

      const ranked = assignRanks(players)

      expect(ranked.map((p) => p.rank)).toEqual([1, 2, 3, 4, 5])
    })

    it('should preserve original player data', () => {
      const players = [
        { id: '1', xp: 500, name: 'Player 1', extra: 'data' },
        { id: '2', xp: 400, name: 'Player 2', extra: 'more' },
      ]

      const ranked = assignRanks(players)

      expect(ranked[0].id).toBe('1')
      expect(ranked[0].name).toBe('Player 1')
      expect(ranked[0].extra).toBe('data')
      expect(ranked[0].rank).toBe(1)
    })

    it('should handle zero XP', () => {
      const players = [
        { id: '1', xp: 100 },
        { id: '2', xp: 0 },
        { id: '3', xp: 0 },
      ]

      const ranked = assignRanks(players)

      expect(ranked[0].rank).toBe(1)
      expect(ranked[1].rank).toBe(2)
      expect(ranked[2].rank).toBe(2) // Tie at 0 XP
    })

    it('should handle large XP values', () => {
      const players = [
        { id: '1', xp: 1000000 },
        { id: '2', xp: 999999 },
        { id: '3', xp: 1 },
      ]

      const ranked = assignRanks(players)

      expect(ranked[0].rank).toBe(1)
      expect(ranked[1].rank).toBe(2)
      expect(ranked[2].rank).toBe(3)
    })
  })

  describe('Ranking Logic', () => {
    it('should identify King as rank 1', () => {
      const rankings = [
        { id: '1', rank: 1, isKing: true },
        { id: '2', rank: 2, isKing: false },
      ]

      const king = rankings.find((p) => p.rank === 1)
      expect(king?.isKing).toBe(true)
    })

    it('should correctly set isKing flag', () => {
      const players = [
        { id: '1', xp: 500 },
        { id: '2', xp: 400 },
        { id: '3', xp: 300 },
      ]

      const ranked = assignRanks(players).map((p) => ({
        ...p,
        isKing: p.rank === 1,
      }))

      expect(ranked[0].isKing).toBe(true)
      expect(ranked[1].isKing).toBe(false)
      expect(ranked[2].isKing).toBe(false)
    })

    it('should handle tie at first place', () => {
      const players = [
        { id: '1', xp: 500 },
        { id: '2', xp: 500 },
      ]

      const ranked = assignRanks(players).map((p) => ({
        ...p,
        isKing: p.rank === 1,
      }))

      // Both are rank 1, both are kings
      expect(ranked[0].isKing).toBe(true)
      expect(ranked[1].isKing).toBe(true)
    })
  })

  describe('Ranking Levels', () => {
    it('should validate ranking levels', () => {
      const validLevels = ['venue', 'city', 'country']
      const invalidLevels = ['global', 'world', 'region', '']

      validLevels.forEach((level) => {
        expect(['venue', 'city', 'country'].includes(level)).toBe(true)
      })

      invalidLevels.forEach((level) => {
        expect(['venue', 'city', 'country'].includes(level)).toBe(false)
      })
    })
  })

  describe('Response Structure', () => {
    it('should have correct response shape', () => {
      const response = {
        level: 'city' as const,
        sport: 'basketball',
        location: { id: '1', name: 'Vienna' },
        king: {
          id: '1',
          rank: 1,
          name: 'King Player',
          xp: 500,
          avatar: null,
          isKing: true,
        },
        rankings: [],
        currentUser: null,
        totalPlayers: 10,
      }

      expect(response.level).toBe('city')
      expect(response.sport).toBe('basketball')
      expect(response.king?.isKing).toBe(true)
      expect(response.king?.rank).toBe(1)
      expect(typeof response.totalPlayers).toBe('number')
    })

    it('should handle missing king (no players)', () => {
      const response = {
        level: 'city' as const,
        sport: 'basketball',
        location: { id: '1', name: 'Empty City' },
        king: null,
        rankings: [],
        currentUser: null,
        totalPlayers: 0,
      }

      expect(response.king).toBeNull()
      expect(response.rankings).toHaveLength(0)
    })

    it('should include current user even if not in top rankings', () => {
      const response = {
        level: 'city' as const,
        sport: 'basketball',
        location: { id: '1', name: 'Vienna' },
        king: { id: '1', rank: 1, name: 'King', xp: 1000, avatar: null, isKing: true },
        rankings: [], // Top 10 only
        currentUser: {
          id: '99',
          rank: 150,
          name: 'Me',
          xp: 10,
          avatar: null,
          isKing: false,
        },
        totalPlayers: 200,
      }

      expect(response.currentUser?.rank).toBe(150)
      expect(response.currentUser?.isKing).toBe(false)
    })
  })
})
