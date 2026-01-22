/**
 * Unit tests for Per-venue Attempt History feature
 * Tests the attempt history data structure and processing
 */

import { describe, it, expect } from 'vitest'

interface AttemptHistoryItem {
  id: string
  scoreValue: number
  maxValue: number
  accuracy: number
  isBest: boolean
  completedAt: string
}

interface BestScore {
  scoreValue: number
  maxValue: number
  accuracy: number
}

interface AttemptData {
  count: number
  bestScore: BestScore | null
  bestAttemptId: string | null
  history: Array<{
    id: string
    scoreValue: number
    maxValue: number
    accuracy: number
    completedAt: Date
  }>
}

/**
 * Processes raw attempts into attempt history with isBest flag
 */
function processAttemptHistory(attemptData: AttemptData | undefined): AttemptHistoryItem[] {
  if (!attemptData) return []

  return attemptData.history.map((h) => ({
    id: h.id,
    scoreValue: h.scoreValue,
    maxValue: h.maxValue,
    accuracy: h.accuracy,
    isBest: h.id === attemptData.bestAttemptId,
    completedAt: h.completedAt.toISOString(),
  }))
}

/**
 * Finds the best attempt from a list
 */
function findBestAttempt(
  attempts: Array<{ id: string; scoreValue: number; maxValue: number }>
): { bestAttemptId: string; bestAccuracy: number } | null {
  if (attempts.length === 0) return null

  let bestAttemptId = attempts[0].id
  let bestAccuracy = attempts[0].maxValue > 0 ? attempts[0].scoreValue / attempts[0].maxValue : 0

  for (const attempt of attempts) {
    const accuracy = attempt.maxValue > 0 ? attempt.scoreValue / attempt.maxValue : 0
    if (accuracy > bestAccuracy) {
      bestAccuracy = accuracy
      bestAttemptId = attempt.id
    }
  }

  return { bestAttemptId, bestAccuracy: Math.round(bestAccuracy * 100) }
}

describe('Attempt History - Unit Tests', () => {
  describe('processAttemptHistory', () => {
    it('should return empty array for undefined data', () => {
      const result = processAttemptHistory(undefined)
      expect(result).toEqual([])
    })

    it('should process single attempt correctly', () => {
      const attemptData: AttemptData = {
        count: 1,
        bestScore: { scoreValue: 8, maxValue: 10, accuracy: 80 },
        bestAttemptId: 'attempt-1',
        history: [
          {
            id: 'attempt-1',
            scoreValue: 8,
            maxValue: 10,
            accuracy: 80,
            completedAt: new Date('2025-01-20T14:30:00Z'),
          },
        ],
      }

      const result = processAttemptHistory(attemptData)

      expect(result).toHaveLength(1)
      expect(result[0].isBest).toBe(true)
      expect(result[0].scoreValue).toBe(8)
      expect(result[0].accuracy).toBe(80)
    })

    it('should mark only best attempt as isBest', () => {
      const attemptData: AttemptData = {
        count: 3,
        bestScore: { scoreValue: 9, maxValue: 10, accuracy: 90 },
        bestAttemptId: 'attempt-2',
        history: [
          {
            id: 'attempt-1',
            scoreValue: 7,
            maxValue: 10,
            accuracy: 70,
            completedAt: new Date('2025-01-18T10:00:00Z'),
          },
          {
            id: 'attempt-2',
            scoreValue: 9,
            maxValue: 10,
            accuracy: 90,
            completedAt: new Date('2025-01-19T10:00:00Z'),
          },
          {
            id: 'attempt-3',
            scoreValue: 8,
            maxValue: 10,
            accuracy: 80,
            completedAt: new Date('2025-01-20T10:00:00Z'),
          },
        ],
      }

      const result = processAttemptHistory(attemptData)

      expect(result).toHaveLength(3)
      expect(result.filter((r) => r.isBest)).toHaveLength(1)
      expect(result.find((r) => r.id === 'attempt-2')?.isBest).toBe(true)
      expect(result.find((r) => r.id === 'attempt-1')?.isBest).toBe(false)
      expect(result.find((r) => r.id === 'attempt-3')?.isBest).toBe(false)
    })

    it('should format completedAt as ISO string', () => {
      const attemptData: AttemptData = {
        count: 1,
        bestScore: { scoreValue: 5, maxValue: 10, accuracy: 50 },
        bestAttemptId: 'attempt-1',
        history: [
          {
            id: 'attempt-1',
            scoreValue: 5,
            maxValue: 10,
            accuracy: 50,
            completedAt: new Date('2025-01-20T14:30:00Z'),
          },
        ],
      }

      const result = processAttemptHistory(attemptData)

      expect(result[0].completedAt).toBe('2025-01-20T14:30:00.000Z')
    })
  })

  describe('findBestAttempt', () => {
    it('should return null for empty attempts', () => {
      const result = findBestAttempt([])
      expect(result).toBeNull()
    })

    it('should find best attempt from single attempt', () => {
      const attempts = [{ id: 'a1', scoreValue: 8, maxValue: 10 }]

      const result = findBestAttempt(attempts)

      expect(result?.bestAttemptId).toBe('a1')
      expect(result?.bestAccuracy).toBe(80)
    })

    it('should find best attempt from multiple attempts', () => {
      const attempts = [
        { id: 'a1', scoreValue: 6, maxValue: 10 },
        { id: 'a2', scoreValue: 9, maxValue: 10 },
        { id: 'a3', scoreValue: 7, maxValue: 10 },
      ]

      const result = findBestAttempt(attempts)

      expect(result?.bestAttemptId).toBe('a2')
      expect(result?.bestAccuracy).toBe(90)
    })

    it('should handle different maxValues correctly', () => {
      const attempts = [
        { id: 'a1', scoreValue: 4, maxValue: 5 }, // 80%
        { id: 'a2', scoreValue: 7, maxValue: 10 }, // 70%
      ]

      const result = findBestAttempt(attempts)

      expect(result?.bestAttemptId).toBe('a1')
      expect(result?.bestAccuracy).toBe(80)
    })

    it('should handle zero maxValue gracefully', () => {
      const attempts = [
        { id: 'a1', scoreValue: 5, maxValue: 0 },
        { id: 'a2', scoreValue: 7, maxValue: 10 },
      ]

      const result = findBestAttempt(attempts)

      expect(result?.bestAttemptId).toBe('a2')
      expect(result?.bestAccuracy).toBe(70)
    })

    it('should pick first attempt when all have same accuracy', () => {
      const attempts = [
        { id: 'a1', scoreValue: 5, maxValue: 10 },
        { id: 'a2', scoreValue: 5, maxValue: 10 },
        { id: 'a3', scoreValue: 5, maxValue: 10 },
      ]

      const result = findBestAttempt(attempts)

      expect(result?.bestAttemptId).toBe('a1')
      expect(result?.bestAccuracy).toBe(50)
    })
  })

  describe('Attempt history response structure', () => {
    it('should have correct structure for AttemptHistoryItem', () => {
      const item: AttemptHistoryItem = {
        id: 'attempt-uuid',
        scoreValue: 8,
        maxValue: 10,
        accuracy: 80,
        isBest: true,
        completedAt: '2025-01-20T14:30:00Z',
      }

      expect(item).toHaveProperty('id')
      expect(item).toHaveProperty('scoreValue')
      expect(item).toHaveProperty('maxValue')
      expect(item).toHaveProperty('accuracy')
      expect(item).toHaveProperty('isBest')
      expect(item).toHaveProperty('completedAt')
      expect(typeof item.isBest).toBe('boolean')
      expect(typeof item.completedAt).toBe('string')
    })

    it('should calculate accuracy as percentage correctly', () => {
      const testCases = [
        { score: 10, max: 10, expected: 100 },
        { score: 8, max: 10, expected: 80 },
        { score: 5, max: 10, expected: 50 },
        { score: 0, max: 10, expected: 0 },
        { score: 3, max: 5, expected: 60 },
        { score: 7, max: 7, expected: 100 },
      ]

      for (const { score, max, expected } of testCases) {
        const accuracy = max > 0 ? Math.round((score / max) * 100) : 0
        expect(accuracy).toBe(expected)
      }
    })
  })
})
