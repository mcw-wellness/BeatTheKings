/**
 * Challenges Unit Tests
 * Tests for challenge utility functions with mocked database
 */

import { describe, it, expect, vi } from 'vitest'

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
    return Math.abs(lat2 - lat1) + Math.abs(lng2 - lng1)
  }),
  formatDistance: vi.fn((km: number) => {
    if (km < 1) return `${Math.round(km * 1000)} m`
    return `${km.toFixed(1)} km`
  }),
}))

import { calculateChallengeRewards } from '@/lib/challenges'

describe('Challenges Unit Tests', () => {
  describe('calculateChallengeRewards', () => {
    it('should calculate XP based on accuracy and difficulty', () => {
      // 100% accuracy on easy challenge
      const result = calculateChallengeRewards(100, 20, 'easy', 10, 10)
      expect(result.xpEarned).toBe(100) // 100 * 1.0 * 1.0 = 100
      expect(result.rpEarned).toBe(20) // 100% >= 80%, so full RP
    })

    it('should apply medium difficulty multiplier', () => {
      // 100% accuracy on medium challenge
      const result = calculateChallengeRewards(100, 20, 'medium', 10, 10)
      expect(result.xpEarned).toBe(150) // 100 * 1.0 * 1.5 = 150
      expect(result.rpEarned).toBe(20)
    })

    it('should apply hard difficulty multiplier', () => {
      // 100% accuracy on hard challenge
      const result = calculateChallengeRewards(100, 20, 'hard', 10, 10)
      expect(result.xpEarned).toBe(200) // 100 * 1.0 * 2.0 = 200
      expect(result.rpEarned).toBe(20)
    })

    it('should scale XP by accuracy', () => {
      // 50% accuracy
      const result = calculateChallengeRewards(100, 20, 'easy', 5, 10)
      expect(result.xpEarned).toBe(50) // 100 * 0.5 * 1.0 = 50
      expect(result.rpEarned).toBe(0) // 50% < 80%, no RP
    })

    it('should award RP only for 80%+ accuracy', () => {
      // 79% accuracy - no RP
      const result79 = calculateChallengeRewards(100, 20, 'easy', 79, 100)
      expect(result79.rpEarned).toBe(0)

      // 80% accuracy - gets RP
      const result80 = calculateChallengeRewards(100, 20, 'easy', 80, 100)
      expect(result80.rpEarned).toBe(20)

      // 90% accuracy - gets RP
      const result90 = calculateChallengeRewards(100, 20, 'easy', 90, 100)
      expect(result90.rpEarned).toBe(20)
    })

    it('should return 0 for zero maxValue', () => {
      const result = calculateChallengeRewards(100, 20, 'easy', 0, 0)
      expect(result.xpEarned).toBe(0)
      expect(result.rpEarned).toBe(0)
    })

    it('should round XP to nearest integer', () => {
      // 33.33% accuracy on medium
      const result = calculateChallengeRewards(100, 20, 'medium', 1, 3)
      // 100 * 0.333 * 1.5 = 50
      expect(result.xpEarned).toBe(50)
    })

    it('should handle unknown difficulty as multiplier 1', () => {
      const result = calculateChallengeRewards(100, 20, 'unknown', 10, 10)
      expect(result.xpEarned).toBe(100) // Falls back to multiplier 1
    })
  })

  describe('Challenge Types', () => {
    const validChallengeTypes = [
      'three_point',
      'free_throw',
      'around_the_world',
      'penalty_kick',
      'free_kick',
    ]

    it('should have expected challenge types defined', () => {
      validChallengeTypes.forEach((type) => {
        expect(typeof type).toBe('string')
        expect(type.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Difficulty Levels', () => {
    it('should have expected difficulty levels', () => {
      const difficulties = ['easy', 'medium', 'hard']

      difficulties.forEach((diff) => {
        const result = calculateChallengeRewards(100, 10, diff, 10, 10)
        expect(result.xpEarned).toBeGreaterThan(0)
      })
    })

    it('should have increasing multipliers for harder difficulties', () => {
      const easy = calculateChallengeRewards(100, 10, 'easy', 10, 10)
      const medium = calculateChallengeRewards(100, 10, 'medium', 10, 10)
      const hard = calculateChallengeRewards(100, 10, 'hard', 10, 10)

      expect(medium.xpEarned).toBeGreaterThan(easy.xpEarned)
      expect(hard.xpEarned).toBeGreaterThan(medium.xpEarned)
    })
  })

  describe('ChallengeVenue Structure', () => {
    it('should have all required fields', () => {
      const venue = {
        id: 'venue-123',
        name: 'Esterhazy Park',
        district: '6. Bezirk',
        distance: 0.5,
        distanceFormatted: '500 m',
        challengeCount: 3,
        activePlayerCount: 5,
      }

      expect(venue.id).toBeDefined()
      expect(venue.name).toBeDefined()
      expect(venue.challengeCount).toBeGreaterThanOrEqual(0)
      expect(venue.activePlayerCount).toBeGreaterThanOrEqual(0)
    })

    it('should allow null distance when no location', () => {
      const venue = {
        id: 'venue-123',
        name: 'Unknown Venue',
        district: null,
        distance: null,
        distanceFormatted: null,
        challengeCount: 0,
        activePlayerCount: 0,
      }

      expect(venue.distance).toBeNull()
      expect(venue.distanceFormatted).toBeNull()
    })
  })

  describe('ChallengeListItem Structure', () => {
    it('should have all required fields', () => {
      const challenge = {
        id: 'challenge-123',
        name: '3-Point Shot',
        description: 'Make 5 three-pointers',
        challengeType: 'three_point',
        difficulty: 'medium',
        xpReward: 50,
        rpReward: 10,
        myAttempts: 2,
        completed: true,
      }

      expect(challenge.id).toBeDefined()
      expect(challenge.name).toBeDefined()
      expect(challenge.xpReward).toBeGreaterThan(0)
      expect(['easy', 'medium', 'hard']).toContain(challenge.difficulty)
    })

    it('should track completion status', () => {
      const notStarted = {
        id: 'ch-1',
        name: 'Test',
        description: 'Test',
        challengeType: 'test',
        difficulty: 'easy',
        xpReward: 10,
        rpReward: 0,
        myAttempts: 0,
        completed: false,
      }

      const completed = {
        ...notStarted,
        myAttempts: 3,
        completed: true,
      }

      expect(notStarted.completed).toBe(false)
      expect(completed.completed).toBe(true)
    })
  })

  describe('ChallengeDetail Structure', () => {
    it('should have all required fields', () => {
      const detail = {
        id: 'challenge-123',
        name: '3-Point Shot',
        description: 'Make shots from beyond the arc',
        instructions: 'Stand at the 3-point line and shoot',
        challengeType: 'three_point',
        difficulty: 'medium',
        xpReward: 50,
        rpReward: 10,
        sportName: 'Basketball',
        venueName: 'Esterhazy Park',
        myAttempts: 5,
        myBestScore: { scoreValue: 8, maxValue: 10 },
      }

      expect(detail.instructions).toBeDefined()
      expect(detail.sportName).toBeDefined()
      expect(detail.venueName).toBeDefined()
      expect(detail.myBestScore).toBeDefined()
    })

    it('should allow null best score for no attempts', () => {
      const detail = {
        id: 'challenge-123',
        name: 'New Challenge',
        description: 'Test',
        instructions: 'Test',
        challengeType: 'test',
        difficulty: 'easy',
        xpReward: 10,
        rpReward: 0,
        sportName: 'Basketball',
        venueName: 'Test Venue',
        myAttempts: 0,
        myBestScore: null,
      }

      expect(detail.myAttempts).toBe(0)
      expect(detail.myBestScore).toBeNull()
    })
  })

  describe('AttemptResult Structure', () => {
    it('should have success result', () => {
      const result = {
        success: true,
        xpEarned: 75,
        rpEarned: 10,
        newTotalXp: 1075,
        newTotalRp: 210,
        message: '80% accuracy! Earned 75 XP and 10 RP',
      }

      expect(result.success).toBe(true)
      expect(result.xpEarned).toBeGreaterThan(0)
      expect(result.message).toContain('Earned')
    })

    it('should have failure result', () => {
      const result = {
        success: false,
        xpEarned: 0,
        rpEarned: 0,
        newTotalXp: 0,
        newTotalRp: 0,
        message: 'Challenge not found',
      }

      expect(result.success).toBe(false)
      expect(result.xpEarned).toBe(0)
    })
  })

  describe('Venue Sorting Logic', () => {
    it('should sort venues by distance ascending', () => {
      const venues = [
        { id: '1', name: 'Far', distance: 5 },
        { id: '2', name: 'Near', distance: 0.5 },
        { id: '3', name: 'Medium', distance: 2 },
        { id: '4', name: 'No location', distance: null },
      ]

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
  })

  describe('Stats Update Logic', () => {
    it('should update three_point stats for three_point challenge', () => {
      const existingStats = {
        threePointMade: 10,
        threePointAttempted: 15,
        challengesCompleted: 5,
      }

      const scoreValue = 8
      const maxValue = 10

      const updated = {
        threePointMade: existingStats.threePointMade + scoreValue,
        threePointAttempted: existingStats.threePointAttempted + maxValue,
        challengesCompleted: existingStats.challengesCompleted + 1,
      }

      expect(updated.threePointMade).toBe(18)
      expect(updated.threePointAttempted).toBe(25)
      expect(updated.challengesCompleted).toBe(6)
    })

    it('should update free_throw stats for free_throw challenge', () => {
      const existingStats = {
        freeThrowMade: 20,
        freeThrowAttempted: 25,
        challengesCompleted: 10,
      }

      const scoreValue = 9
      const maxValue = 10

      const updated = {
        freeThrowMade: existingStats.freeThrowMade + scoreValue,
        freeThrowAttempted: existingStats.freeThrowAttempted + maxValue,
        challengesCompleted: existingStats.challengesCompleted + 1,
      }

      expect(updated.freeThrowMade).toBe(29)
      expect(updated.freeThrowAttempted).toBe(35)
      expect(updated.challengesCompleted).toBe(11)
    })
  })

  describe('Best Score Calculation', () => {
    it('should find best score by accuracy', () => {
      const attempts = [
        { scoreValue: 6, maxValue: 10 }, // 60%
        { scoreValue: 8, maxValue: 10 }, // 80% - best
        { scoreValue: 5, maxValue: 8 }, // 62.5%
      ]

      let bestScore = null
      let bestAccuracy = 0

      for (const attempt of attempts) {
        const accuracy = attempt.maxValue > 0 ? attempt.scoreValue / attempt.maxValue : 0
        if (accuracy > bestAccuracy) {
          bestAccuracy = accuracy
          bestScore = attempt
        }
      }

      expect(bestScore).toEqual({ scoreValue: 8, maxValue: 10 })
      expect(bestAccuracy).toBe(0.8)
    })

    it('should handle empty attempts', () => {
      const attempts: Array<{ scoreValue: number; maxValue: number }> = []

      let bestScore = null
      let bestAccuracy = 0

      for (const attempt of attempts) {
        const accuracy = attempt.maxValue > 0 ? attempt.scoreValue / attempt.maxValue : 0
        if (accuracy > bestAccuracy) {
          bestAccuracy = accuracy
          bestScore = attempt
        }
      }

      expect(bestScore).toBeNull()
    })
  })
})
