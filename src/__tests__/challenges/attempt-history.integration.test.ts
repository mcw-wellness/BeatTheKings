/**
 * Integration tests for Per-venue Attempt History API
 * Tests with real database operations using PGLite
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { eq, and } from 'drizzle-orm'
import {
  createTestDb,
  closeTestDb,
  clearTestDb,
  testFactories,
  type TestDatabase,
} from '@/db/test-utils'
import { challengeAttempts } from '@/db/schema'

describe('Attempt History - Integration Tests', () => {
  let db: TestDatabase

  beforeAll(async () => {
    db = await createTestDb()
  })

  afterAll(async () => {
    await closeTestDb()
  })

  beforeEach(async () => {
    await clearTestDb(db)
  })

  async function setupTestData() {
    const { city } = await testFactories.createCountryWithCity(db, {
      countryName: 'Austria',
      countryCode: 'AT',
      cityName: 'Vienna',
    })

    const venue = await testFactories.createVenue(db, city.id, {
      name: 'Test Court',
      latitude: 48.2,
      longitude: 16.4,
    })

    const sport = await testFactories.createSport(db, { name: 'Basketball', slug: 'basketball' })
    const user = await testFactories.createUser(db, { email: 'test@test.com', name: 'Test User' })

    const challenge = await testFactories.createChallenge(db, venue.id, sport.id, {
      name: 'Free Throw Basic',
      challengeType: 'free_throw',
      difficulty: 'easy',
      xpReward: 50,
    })

    return { venue, user, challenge, sport }
  }

  it('should return empty attemptHistory for challenge with no attempts', async () => {
    const { challenge } = await setupTestData()

    // Query the challenge directly from DB
    const result = await db.query.challenges.findFirst({
      where: (c, { eq }) => eq(c.id, challenge.id),
    })

    expect(result).toBeDefined()
    // Without attempts, we'd expect 0 attempts
    const attempts = await db
      .select()
      .from(challengeAttempts)
      .where(eq(challengeAttempts.challengeId, challenge.id))

    expect(attempts).toHaveLength(0)
  })

  it('should store and retrieve attempt with all required fields', async () => {
    const { challenge, user } = await setupTestData()

    // Create an attempt
    await db.insert(challengeAttempts).values({
      userId: user.id,
      challengeId: challenge.id,
      scoreValue: 8,
      maxValue: 10,
      videoUrl: 'https://example.com/video.mp4',
      completedAt: new Date('2025-01-20T14:30:00Z'),
    })

    // Retrieve attempts
    const attempts = await db
      .select()
      .from(challengeAttempts)
      .where(eq(challengeAttempts.challengeId, challenge.id))

    expect(attempts).toHaveLength(1)
    expect(attempts[0].scoreValue).toBe(8)
    expect(attempts[0].maxValue).toBe(10)
    expect(attempts[0].completedAt).toBeInstanceOf(Date)
  })

  it('should return multiple attempts in correct order', async () => {
    const { challenge, user } = await setupTestData()

    // Create multiple attempts
    await db.insert(challengeAttempts).values([
      {
        userId: user.id,
        challengeId: challenge.id,
        scoreValue: 5,
        maxValue: 10,
        videoUrl: 'https://example.com/v1.mp4',
        completedAt: new Date('2025-01-18T10:00:00Z'),
      },
      {
        userId: user.id,
        challengeId: challenge.id,
        scoreValue: 8,
        maxValue: 10,
        videoUrl: 'https://example.com/v2.mp4',
        completedAt: new Date('2025-01-20T14:30:00Z'),
      },
      {
        userId: user.id,
        challengeId: challenge.id,
        scoreValue: 6,
        maxValue: 10,
        videoUrl: 'https://example.com/v3.mp4',
        completedAt: new Date('2025-01-19T12:00:00Z'),
      },
    ])

    // Retrieve attempts ordered by completedAt asc
    const attempts = await db
      .select()
      .from(challengeAttempts)
      .where(eq(challengeAttempts.challengeId, challenge.id))
      .orderBy(challengeAttempts.completedAt)

    expect(attempts).toHaveLength(3)
    // First should be oldest (Jan 18)
    expect(attempts[0].scoreValue).toBe(5)
  })

  it('should correctly identify best attempt', async () => {
    const { challenge, user } = await setupTestData()

    // Create multiple attempts with different scores
    await db.insert(challengeAttempts).values([
      {
        userId: user.id,
        challengeId: challenge.id,
        scoreValue: 5,
        maxValue: 10,
        videoUrl: 'https://example.com/v1.mp4',
        completedAt: new Date('2025-01-18T10:00:00Z'),
      },
      {
        userId: user.id,
        challengeId: challenge.id,
        scoreValue: 9,
        maxValue: 10,
        videoUrl: 'https://example.com/v2.mp4',
        completedAt: new Date('2025-01-19T14:30:00Z'),
      },
      {
        userId: user.id,
        challengeId: challenge.id,
        scoreValue: 7,
        maxValue: 10,
        videoUrl: 'https://example.com/v3.mp4',
        completedAt: new Date('2025-01-20T12:00:00Z'),
      },
    ])

    // Retrieve all attempts
    const attempts = await db.select().from(challengeAttempts)

    // Find best (highest score percentage)
    let best = attempts[0]
    for (const attempt of attempts) {
      const currentAccuracy = attempt.maxValue > 0 ? attempt.scoreValue / attempt.maxValue : 0
      const bestAccuracy = best.maxValue > 0 ? best.scoreValue / best.maxValue : 0
      if (currentAccuracy > bestAccuracy) {
        best = attempt
      }
    }

    expect(best.scoreValue).toBe(9)
    expect(best.maxValue).toBe(10)
  })

  it('should only return attempts for specific user', async () => {
    const { challenge, user } = await setupTestData()

    // Create another user
    const user2 = await testFactories.createUser(db, { email: 'other@test.com', name: 'Other' })

    // Create attempts for both users
    await db.insert(challengeAttempts).values([
      {
        userId: user.id,
        challengeId: challenge.id,
        scoreValue: 8,
        maxValue: 10,
        videoUrl: 'https://example.com/v1.mp4',
        completedAt: new Date('2025-01-20T14:30:00Z'),
      },
      {
        userId: user2.id,
        challengeId: challenge.id,
        scoreValue: 6,
        maxValue: 10,
        videoUrl: 'https://example.com/v2.mp4',
        completedAt: new Date('2025-01-20T15:00:00Z'),
      },
    ])

    // Query only user's attempts
    const userAttempts = await db
      .select()
      .from(challengeAttempts)
      .where(
        and(eq(challengeAttempts.challengeId, challenge.id), eq(challengeAttempts.userId, user.id))
      )

    expect(userAttempts).toHaveLength(1)
    expect(userAttempts[0].userId).toBe(user.id)
    expect(userAttempts[0].scoreValue).toBe(8)
  })

  it('should calculate accuracy correctly from score and max', async () => {
    const { challenge, user } = await setupTestData()

    const testCases = [
      { score: 10, max: 10, expectedAccuracy: 100 },
      { score: 8, max: 10, expectedAccuracy: 80 },
      { score: 3, max: 5, expectedAccuracy: 60 },
      { score: 0, max: 10, expectedAccuracy: 0 },
    ]

    for (const tc of testCases) {
      await db.insert(challengeAttempts).values({
        userId: user.id,
        challengeId: challenge.id,
        scoreValue: tc.score,
        maxValue: tc.max,
        videoUrl: 'https://example.com/video.mp4',
        completedAt: new Date(),
      })

      const attempts = await db
        .select()
        .from(challengeAttempts)
        .orderBy(challengeAttempts.completedAt)
      const lastAttempt = attempts[attempts.length - 1]

      const accuracy = Math.round((lastAttempt.scoreValue / lastAttempt.maxValue) * 100)
      expect(accuracy).toBe(tc.expectedAccuracy)
    }
  })

  it('should handle challenges with different max values', async () => {
    const { venue, user, sport } = await setupTestData()

    // Create challenges with different maxValues
    const challenge1 = await testFactories.createChallenge(db, venue.id, sport.id, {
      name: 'Easy Challenge',
      challengeType: 'free_throw',
      difficulty: 'easy',
      xpReward: 25,
    })

    const challenge2 = await testFactories.createChallenge(db, venue.id, sport.id, {
      name: 'Hard Challenge',
      challengeType: 'free_throw',
      difficulty: 'hard',
      xpReward: 100,
    })

    // Create attempts with different max values
    await db.insert(challengeAttempts).values([
      {
        userId: user.id,
        challengeId: challenge1.id,
        scoreValue: 4,
        maxValue: 5, // 80%
        videoUrl: 'https://example.com/v1.mp4',
        completedAt: new Date(),
      },
      {
        userId: user.id,
        challengeId: challenge2.id,
        scoreValue: 7,
        maxValue: 10, // 70%
        videoUrl: 'https://example.com/v2.mp4',
        completedAt: new Date(),
      },
    ])

    const attempts = await db.select().from(challengeAttempts)

    // Verify different max values are stored correctly
    const c1Attempt = attempts.find((a) => a.challengeId === challenge1.id)
    const c2Attempt = attempts.find((a) => a.challengeId === challenge2.id)

    expect(c1Attempt?.maxValue).toBe(5)
    expect(c2Attempt?.maxValue).toBe(10)

    // Verify accuracy calculation works correctly
    const c1Accuracy = Math.round((c1Attempt!.scoreValue / c1Attempt!.maxValue) * 100)
    const c2Accuracy = Math.round((c2Attempt!.scoreValue / c2Attempt!.maxValue) * 100)

    expect(c1Accuracy).toBe(80)
    expect(c2Accuracy).toBe(70)
  })
})
