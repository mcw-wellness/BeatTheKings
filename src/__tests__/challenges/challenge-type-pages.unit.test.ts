/**
 * Challenge Type Pages Unit Tests
 * Tests for 1v1 history and by-type response structures
 */

import { describe, it, expect } from 'vitest'

interface Match1v1History {
  id: string
  opponent: {
    id: string
    name: string | null
    avatarUrl: string | null
  }
  venueName: string
  myScore: number
  opponentScore: number
  won: boolean
  completedAt: string
}

interface HistoryResponse {
  stats: {
    totalMatches: number
    wins: number
    losses: number
  }
  matches: Match1v1History[]
}

interface BestScore {
  scoreValue: number
  maxValue: number
  accuracy: number
}

interface ChallengeWithAttempts {
  id: string
  name: string
  description: string
  difficulty: string
  xpReward: number
  venueName: string
  venueId: string
  attempts: number
  bestScore: BestScore | null
}

interface ByTypeResponse {
  challengeType: string
  displayName: string
  total: number
  completed: number
  challenges: ChallengeWithAttempts[]
}

describe('Challenge Type Pages Unit Tests', () => {
  describe('1v1 History Response Structure', () => {
    it('should have all required fields', () => {
      const response: HistoryResponse = {
        stats: {
          totalMatches: 10,
          wins: 7,
          losses: 3,
        },
        matches: [
          {
            id: 'match-1',
            opponent: {
              id: 'opp-1',
              name: 'Player One',
              avatarUrl: 'https://example.com/avatar.png',
            },
            venueName: 'Esterhazy Park',
            myScore: 10,
            opponentScore: 8,
            won: true,
            completedAt: '2026-01-20T10:00:00Z',
          },
        ],
      }

      expect(response.stats).toBeDefined()
      expect(response.stats.totalMatches).toBe(10)
      expect(response.stats.wins).toBe(7)
      expect(response.stats.losses).toBe(3)
      expect(response.matches).toHaveLength(1)
      expect(response.matches[0].won).toBe(true)
    })

    it('should handle empty match history', () => {
      const response: HistoryResponse = {
        stats: {
          totalMatches: 0,
          wins: 0,
          losses: 0,
        },
        matches: [],
      }

      expect(response.stats.totalMatches).toBe(0)
      expect(response.matches).toHaveLength(0)
    })

    it('should correctly calculate win/loss from match data', () => {
      const matches: Match1v1History[] = [
        {
          id: '1',
          opponent: { id: 'o1', name: 'P1', avatarUrl: null },
          venueName: 'V1',
          myScore: 10,
          opponentScore: 5,
          won: true,
          completedAt: '2026-01-01',
        },
        {
          id: '2',
          opponent: { id: 'o2', name: 'P2', avatarUrl: null },
          venueName: 'V1',
          myScore: 5,
          opponentScore: 10,
          won: false,
          completedAt: '2026-01-02',
        },
        {
          id: '3',
          opponent: { id: 'o3', name: 'P3', avatarUrl: null },
          venueName: 'V1',
          myScore: 8,
          opponentScore: 6,
          won: true,
          completedAt: '2026-01-03',
        },
      ]

      const wins = matches.filter((m) => m.won).length
      const losses = matches.filter((m) => !m.won).length

      expect(wins).toBe(2)
      expect(losses).toBe(1)
      expect(wins + losses).toBe(matches.length)
    })
  })

  describe('By Type Response Structure', () => {
    it('should have all required fields', () => {
      const response: ByTypeResponse = {
        challengeType: 'free_throw',
        displayName: 'Free Throw',
        total: 3,
        completed: 2,
        challenges: [
          {
            id: 'ch-1',
            name: 'Free Throw Basic',
            description: 'Make 10 free throws',
            difficulty: 'easy',
            xpReward: 50,
            venueName: 'Esterhazy Park',
            venueId: 'venue-1',
            attempts: 3,
            bestScore: { scoreValue: 8, maxValue: 10, accuracy: 80 },
          },
        ],
      }

      expect(response.challengeType).toBe('free_throw')
      expect(response.displayName).toBe('Free Throw')
      expect(response.total).toBe(3)
      expect(response.completed).toBe(2)
      expect(response.challenges).toHaveLength(1)
    })

    it('should handle challenge with no attempts', () => {
      const challenge: ChallengeWithAttempts = {
        id: 'ch-1',
        name: 'New Challenge',
        description: 'Test',
        difficulty: 'medium',
        xpReward: 100,
        venueName: 'Test Venue',
        venueId: 'v-1',
        attempts: 0,
        bestScore: null,
      }

      expect(challenge.attempts).toBe(0)
      expect(challenge.bestScore).toBeNull()
    })

    it('should calculate accuracy correctly', () => {
      const attempts = [
        { scoreValue: 8, maxValue: 10 }, // 80%
        { scoreValue: 6, maxValue: 10 }, // 60%
        { scoreValue: 9, maxValue: 10 }, // 90% - best
      ]

      let bestAccuracy = 0
      let bestScore: BestScore | null = null

      for (const attempt of attempts) {
        const accuracy = attempt.maxValue > 0 ? attempt.scoreValue / attempt.maxValue : 0
        if (accuracy > bestAccuracy) {
          bestAccuracy = accuracy
          bestScore = {
            scoreValue: attempt.scoreValue,
            maxValue: attempt.maxValue,
            accuracy: Math.round(accuracy * 100),
          }
        }
      }

      expect(bestScore?.scoreValue).toBe(9)
      expect(bestScore?.accuracy).toBe(90)
    })
  })

  describe('Challenge Type Validation', () => {
    const validTypes = ['free_throw', 'three_point', 'around_the_world']

    it('should recognize valid challenge types', () => {
      validTypes.forEach((type) => {
        expect(validTypes.includes(type)).toBe(true)
      })
    })

    it('should reject invalid challenge types', () => {
      const invalidTypes = ['invalid', 'basketball', '1v1', 'sponsored']
      invalidTypes.forEach((type) => {
        expect(validTypes.includes(type)).toBe(false)
      })
    })
  })

  describe('Display Name Mapping', () => {
    const displayNames: Record<string, string> = {
      free_throw: 'Free Throw',
      three_point: '3-Point Shot',
      around_the_world: 'Around the World',
    }

    it('should map types to display names', () => {
      expect(displayNames['free_throw']).toBe('Free Throw')
      expect(displayNames['three_point']).toBe('3-Point Shot')
      expect(displayNames['around_the_world']).toBe('Around the World')
    })
  })

  describe('Progress Calculation', () => {
    it('should calculate completion percentage', () => {
      const total = 9
      const completed = 6
      const percentage = Math.round((completed / total) * 100)

      expect(percentage).toBe(67)
    })

    it('should handle zero total', () => {
      const total = 0
      const completed = 0
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

      expect(percentage).toBe(0)
    })

    it('should handle 100% completion', () => {
      const total = 3
      const completed = 3
      const percentage = Math.round((completed / total) * 100)

      expect(percentage).toBe(100)
    })
  })
})
