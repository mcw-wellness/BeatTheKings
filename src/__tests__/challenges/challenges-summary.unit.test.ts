/**
 * Challenges Summary Unit Tests
 * Tests for challenge summary response structures and calculations
 */

import { describe, it, expect } from 'vitest'

interface ChallengeSummary {
  total: number
  completed: number
}

interface ChallengesSummaryResponse {
  oneVsOne: {
    matchesPlayed: number
  }
  freeThrow: ChallengeSummary
  threePointShot: ChallengeSummary
  aroundTheWorld: ChallengeSummary
  sponsoredChallenge: {
    name: string
    sponsor: string
    total: number
    completed: number
    available: number
  } | null
}

describe('Challenges Summary Unit Tests', () => {
  describe('ChallengesSummaryResponse Structure', () => {
    it('should have all required fields', () => {
      const response: ChallengesSummaryResponse = {
        oneVsOne: { matchesPlayed: 5 },
        freeThrow: { total: 3, completed: 2 },
        threePointShot: { total: 3, completed: 1 },
        aroundTheWorld: { total: 3, completed: 0 },
        sponsoredChallenge: null,
      }

      expect(response.oneVsOne).toBeDefined()
      expect(response.oneVsOne.matchesPlayed).toBe(5)
      expect(response.freeThrow).toBeDefined()
      expect(response.threePointShot).toBeDefined()
      expect(response.aroundTheWorld).toBeDefined()
      expect(response.sponsoredChallenge).toBeNull()
    })

    it('should support sponsored challenge when available', () => {
      const response: ChallengesSummaryResponse = {
        oneVsOne: { matchesPlayed: 0 },
        freeThrow: { total: 0, completed: 0 },
        threePointShot: { total: 0, completed: 0 },
        aroundTheWorld: { total: 0, completed: 0 },
        sponsoredChallenge: {
          name: 'A1 Super Challenge',
          sponsor: 'A1 Telekom',
          total: 5,
          completed: 2,
          available: 3,
        },
      }

      expect(response.sponsoredChallenge).not.toBeNull()
      expect(response.sponsoredChallenge?.name).toBe('A1 Super Challenge')
      expect(response.sponsoredChallenge?.sponsor).toBe('A1 Telekom')
      expect(response.sponsoredChallenge?.available).toBe(3)
    })
  })

  describe('ChallengeSummary Calculations', () => {
    it('should correctly count completed challenges', () => {
      const allChallenges = [
        { id: '1', challengeType: 'three_point' },
        { id: '2', challengeType: 'three_point' },
        { id: '3', challengeType: 'three_point' },
        { id: '4', challengeType: 'free_throw' },
        { id: '5', challengeType: 'free_throw' },
      ]

      const completedIds = new Set(['1', '4'])

      const countByType = (type: string): ChallengeSummary => {
        const ofType = allChallenges.filter((c) => c.challengeType === type)
        const completed = ofType.filter((c) => completedIds.has(c.id)).length
        return { total: ofType.length, completed }
      }

      const threePoint = countByType('three_point')
      const freeThrow = countByType('free_throw')

      expect(threePoint.total).toBe(3)
      expect(threePoint.completed).toBe(1)
      expect(freeThrow.total).toBe(2)
      expect(freeThrow.completed).toBe(1)
    })

    it('should handle empty challenges', () => {
      const allChallenges: Array<{ id: string; challengeType: string }> = []
      const completedIds = new Set<string>()

      const countByType = (type: string): ChallengeSummary => {
        const ofType = allChallenges.filter((c) => c.challengeType === type)
        const completed = ofType.filter((c) => completedIds.has(c.id)).length
        return { total: ofType.length, completed }
      }

      const result = countByType('three_point')
      expect(result.total).toBe(0)
      expect(result.completed).toBe(0)
    })

    it('should handle all challenges completed', () => {
      const allChallenges = [
        { id: '1', challengeType: 'free_throw' },
        { id: '2', challengeType: 'free_throw' },
        { id: '3', challengeType: 'free_throw' },
      ]

      const completedIds = new Set(['1', '2', '3'])

      const countByType = (type: string): ChallengeSummary => {
        const ofType = allChallenges.filter((c) => c.challengeType === type)
        const completed = ofType.filter((c) => completedIds.has(c.id)).length
        return { total: ofType.length, completed }
      }

      const result = countByType('free_throw')
      expect(result.total).toBe(3)
      expect(result.completed).toBe(3)
    })

    it('should not double-count multiple attempts on same challenge', () => {
      const allChallenges = [
        { id: '1', challengeType: 'around_the_world' },
        { id: '2', challengeType: 'around_the_world' },
      ]

      // User attempted challenge '1' three times - should still count as 1 completed
      const attemptedChallengeIds = ['1', '1', '1', '2']
      const completedIds = new Set(attemptedChallengeIds)

      const countByType = (type: string): ChallengeSummary => {
        const ofType = allChallenges.filter((c) => c.challengeType === type)
        const completed = ofType.filter((c) => completedIds.has(c.id)).length
        return { total: ofType.length, completed }
      }

      const result = countByType('around_the_world')
      expect(result.total).toBe(2)
      expect(result.completed).toBe(2) // Both challenges have been attempted
    })
  })

  describe('1v1 Matches Count', () => {
    it('should count matches where user is player1 or player2', () => {
      const userId = 'user-123'
      const matches = [
        { id: 'm1', player1Id: userId, player2Id: 'other', status: 'completed' },
        { id: 'm2', player1Id: 'other', player2Id: userId, status: 'completed' },
        { id: 'm3', player1Id: userId, player2Id: 'other', status: 'pending' }, // Not counted
        { id: 'm4', player1Id: 'other', player2Id: 'another', status: 'completed' }, // Not user's match
      ]

      const completedMatches = matches.filter(
        (m) => (m.player1Id === userId || m.player2Id === userId) && m.status === 'completed'
      )

      expect(completedMatches.length).toBe(2)
    })

    it('should return 0 for no matches', () => {
      const matches: Array<{
        player1Id: string
        player2Id: string
        status: string
      }> = []
      const userId = 'user-123'

      const completedMatches = matches.filter(
        (m) => (m.player1Id === userId || m.player2Id === userId) && m.status === 'completed'
      )

      expect(completedMatches.length).toBe(0)
    })
  })

  describe('Challenge Types', () => {
    it('should recognize all valid challenge types', () => {
      const validTypes = ['three_point', 'free_throw', 'around_the_world']

      validTypes.forEach((type) => {
        expect(typeof type).toBe('string')
        expect(type.length).toBeGreaterThan(0)
      })
    })

    it('should map display names to challenge types', () => {
      const typeMapping: Record<string, string> = {
        '3-Point Shot': 'three_point',
        'Free Throw': 'free_throw',
        'Around the World': 'around_the_world',
      }

      expect(typeMapping['3-Point Shot']).toBe('three_point')
      expect(typeMapping['Free Throw']).toBe('free_throw')
      expect(typeMapping['Around the World']).toBe('around_the_world')
    })
  })

  describe('Dashboard Display Format', () => {
    it('should format 1v1 as single number', () => {
      const matchesPlayed = 5
      const displayValue = matchesPlayed.toString()
      expect(displayValue).toBe('5')
    })

    it('should format challenge progress as total/completed', () => {
      const summary: ChallengeSummary = { total: 3, completed: 2 }
      const displayValue = `${summary.total}/${summary.completed}`
      expect(displayValue).toBe('3/2')
    })

    it('should show 0/0 for no challenges', () => {
      const summary: ChallengeSummary = { total: 0, completed: 0 }
      const displayValue = `${summary.total}/${summary.completed}`
      expect(displayValue).toBe('0/0')
    })
  })
})
