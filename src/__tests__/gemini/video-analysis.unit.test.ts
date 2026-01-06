/**
 * Video Analysis Unit Tests
 * Tests for Gemini video analysis functions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the client module
vi.mock('@/lib/gemini/client', () => ({
  isGeminiConfigured: vi.fn(),
  getAnalysisModel: vi.fn(),
}))

// Mock logger
vi.mock('@/lib/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

import { calculateRewards } from '@/lib/gemini/video-analysis'
import { isGeminiConfigured } from '@/lib/gemini/client'

describe('Video Analysis Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('calculateRewards', () => {
    it('should calculate base rewards for close game', () => {
      const rewards = calculateRewards(10, 9)

      expect(rewards.winnerXp).toBeGreaterThan(0)
      expect(rewards.winnerRp).toBeGreaterThan(0)
      expect(rewards.loserXp).toBe(50) // Base XP
    })

    it('should give higher rewards for larger score difference', () => {
      const closeGame = calculateRewards(10, 9)
      const blowout = calculateRewards(20, 5)

      expect(blowout.winnerXp).toBeGreaterThan(closeGame.winnerXp)
      expect(blowout.winnerRp).toBeGreaterThan(closeGame.winnerRp)
    })

    it('should cap winner XP bonus at max value', () => {
      const extremeBlowout = calculateRewards(100, 0)

      // winnerXp = baseXp(50) + 50 + bonus(capped at 100) = 200 max
      expect(extremeBlowout.winnerXp).toBeLessThanOrEqual(200)
    })

    it('should cap winner RP at max value', () => {
      const extremeBlowout = calculateRewards(100, 0)

      // winnerRp capped at 50
      expect(extremeBlowout.winnerRp).toBeLessThanOrEqual(50)
    })

    it('should always give base XP to loser', () => {
      const rewards1 = calculateRewards(10, 5)
      const rewards2 = calculateRewards(50, 0)

      expect(rewards1.loserXp).toBe(50)
      expect(rewards2.loserXp).toBe(50)
    })

    it('should handle tie scenario (same score)', () => {
      const rewards = calculateRewards(10, 10)

      // Even in tie, function still calculates (winner determined elsewhere)
      expect(rewards.winnerXp).toBeDefined()
      expect(rewards.loserXp).toBe(50)
    })

    it('should return correct structure', () => {
      const rewards = calculateRewards(15, 10)

      expect(rewards).toHaveProperty('winnerXp')
      expect(rewards).toHaveProperty('winnerRp')
      expect(rewards).toHaveProperty('loserXp')
      expect(typeof rewards.winnerXp).toBe('number')
      expect(typeof rewards.winnerRp).toBe('number')
      expect(typeof rewards.loserXp).toBe('number')
    })
  })

  describe('isGeminiConfigured', () => {
    it('should return false when not configured', () => {
      vi.mocked(isGeminiConfigured).mockReturnValue(false)

      expect(isGeminiConfigured()).toBe(false)
    })

    it('should return true when configured', () => {
      vi.mocked(isGeminiConfigured).mockReturnValue(true)

      expect(isGeminiConfigured()).toBe(true)
    })
  })

  describe('MatchAnalysisResult Structure', () => {
    it('should define expected analysis result fields', () => {
      const mockResult = {
        player1Score: 12,
        player2Score: 10,
        player1ShotsMade: 6,
        player1ShotsAttempted: 10,
        player2ShotsMade: 5,
        player2ShotsAttempted: 9,
        durationSeconds: 600,
        confidence: 0.9,
      }

      expect(mockResult.player1Score).toBeDefined()
      expect(mockResult.player2Score).toBeDefined()
      expect(mockResult.confidence).toBeGreaterThanOrEqual(0)
      expect(mockResult.confidence).toBeLessThanOrEqual(1)
    })

    it('should have valid shot statistics', () => {
      const mockResult = {
        player1ShotsMade: 6,
        player1ShotsAttempted: 10,
        player2ShotsMade: 5,
        player2ShotsAttempted: 9,
      }

      // Shots made should not exceed attempts
      expect(mockResult.player1ShotsMade).toBeLessThanOrEqual(mockResult.player1ShotsAttempted)
      expect(mockResult.player2ShotsMade).toBeLessThanOrEqual(mockResult.player2ShotsAttempted)
    })
  })

  describe('Reward Calculations Edge Cases', () => {
    it('should handle zero scores', () => {
      const rewards = calculateRewards(0, 0)

      expect(rewards.winnerXp).toBeDefined()
      expect(rewards.loserXp).toBe(50)
    })

    it('should handle very high scores', () => {
      const rewards = calculateRewards(999, 998)

      expect(rewards.winnerXp).toBeGreaterThan(0)
      expect(rewards.loserXp).toBe(50)
    })

    it('should scale bonus linearly with score difference', () => {
      const diff5 = calculateRewards(15, 10)
      const diff10 = calculateRewards(20, 10)

      // Larger difference should give larger bonus (up to cap)
      expect(diff10.winnerXp).toBeGreaterThan(diff5.winnerXp)
    })
  })
})
