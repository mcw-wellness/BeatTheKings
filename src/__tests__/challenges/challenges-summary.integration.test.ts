/**
 * Challenges Summary API Integration Tests
 * Tests for GET /api/challenges/summary endpoint with real database
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import { createTestDb, closeTestDb, clearTestDb, type TestDatabase } from '@/db/test-utils'
import {
  users,
  venues,
  cities,
  countries,
  challenges,
  challengeAttempts,
  matches,
  sports,
} from '@/db/schema'

// Mock getSession
const mockGetSession = vi.fn()

vi.mock('@/lib/auth', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/auth')>()
  return {
    ...original,
    getSession: () => mockGetSession(),
  }
})

// Mock getDb
let testDb: TestDatabase

vi.mock('@/db', () => ({
  getDb: () => testDb,
}))

// Import after mocking
import { GET } from '@/app/api/challenges/summary/route'

describe('Challenges Summary API Integration Tests', () => {
  beforeAll(async () => {
    testDb = await createTestDb()
  })

  afterAll(async () => {
    await closeTestDb()
  })

  beforeEach(async () => {
    await clearTestDb(testDb)
    mockGetSession.mockReset()
  })

  // Helper functions
  async function createCountry(name = 'Austria', code = 'AT') {
    const [country] = await testDb.insert(countries).values({ name, code }).returning()
    return country
  }

  async function createCity(name = 'Vienna', countryId: string) {
    const [city] = await testDb.insert(cities).values({ name, countryId }).returning()
    return city
  }

  async function createUser(email: string, name: string, cityId: string) {
    const [user] = await testDb
      .insert(users)
      .values({ email, name, cityId, hasCreatedAvatar: true, ageGroup: '18-30' })
      .returning()
    return user
  }

  async function createVenue(name: string, cityId: string) {
    const [venue] = await testDb.insert(venues).values({ name, cityId, isActive: true }).returning()
    return venue
  }

  async function createSport(name = 'Basketball', slug = 'basketball') {
    const [sport] = await testDb.insert(sports).values({ name, slug, isActive: true }).returning()
    return sport
  }

  async function createChallenge(venueId: string, sportId: string, name: string, type: string) {
    const [challenge] = await testDb
      .insert(challenges)
      .values({
        venueId,
        sportId,
        name,
        description: 'Test challenge',
        instructions: 'Do the thing',
        challengeType: type,
        xpReward: 50,
        rpReward: 10,
        difficulty: 'medium',
        isActive: true,
      })
      .returning()
    return challenge
  }

  async function createAttempt(challengeId: string, odlUserId: string) {
    const [attempt] = await testDb
      .insert(challengeAttempts)
      .values({
        challengeId,
        userId: odlUserId,
        scoreValue: 8,
        maxValue: 10,
        xpEarned: 50,
        rpEarned: 10,
      })
      .returning()
    return attempt
  }

  async function createMatch(
    venueId: string,
    sportId: string,
    player1Id: string,
    player2Id: string,
    status: string
  ) {
    const [match] = await testDb
      .insert(matches)
      .values({
        venueId,
        sportId,
        player1Id,
        player2Id,
        status,
      })
      .returning()
    return match
  }

  describe('GET /api/challenges/summary', () => {
    it('should return 401 when not authenticated', async () => {
      mockGetSession.mockResolvedValue(null)

      const response = await GET()

      expect(response.status).toBe(401)
    })

    it('should return empty summary for new user', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const user = await createUser('test@test.com', 'Test', city.id)

      mockGetSession.mockResolvedValue({ user: { id: user.id, email: user.email } })

      const response = await GET()

      expect(response.status).toBe(200)
      const body = await response.json()

      expect(body.oneVsOne.matchesPlayed).toBe(0)
      expect(body.freeThrow.total).toBe(0)
      expect(body.freeThrow.completed).toBe(0)
      expect(body.threePointShot.total).toBe(0)
      expect(body.threePointShot.completed).toBe(0)
      expect(body.aroundTheWorld.total).toBe(0)
      expect(body.aroundTheWorld.completed).toBe(0)
      expect(body.sponsoredChallenge).toBeNull()
    })

    it('should count challenges by type', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const user = await createUser('test@test.com', 'Test', city.id)
      const sport = await createSport()
      const venue = await createVenue('Test Park', city.id)

      // Create 3 of each challenge type
      await createChallenge(venue.id, sport.id, '3-Point 1', 'three_point')
      await createChallenge(venue.id, sport.id, '3-Point 2', 'three_point')
      await createChallenge(venue.id, sport.id, '3-Point 3', 'three_point')
      await createChallenge(venue.id, sport.id, 'Free Throw 1', 'free_throw')
      await createChallenge(venue.id, sport.id, 'Free Throw 2', 'free_throw')
      await createChallenge(venue.id, sport.id, 'Free Throw 3', 'free_throw')
      await createChallenge(venue.id, sport.id, 'Around 1', 'around_the_world')
      await createChallenge(venue.id, sport.id, 'Around 2', 'around_the_world')
      await createChallenge(venue.id, sport.id, 'Around 3', 'around_the_world')

      mockGetSession.mockResolvedValue({ user: { id: user.id, email: user.email } })

      const response = await GET()

      expect(response.status).toBe(200)
      const body = await response.json()

      expect(body.threePointShot.total).toBe(3)
      expect(body.freeThrow.total).toBe(3)
      expect(body.aroundTheWorld.total).toBe(3)
    })

    it('should count completed challenges for user', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const user = await createUser('test@test.com', 'Test', city.id)
      const sport = await createSport()
      const venue = await createVenue('Test Park', city.id)

      const ch1 = await createChallenge(venue.id, sport.id, '3-Point 1', 'three_point')
      const ch2 = await createChallenge(venue.id, sport.id, '3-Point 2', 'three_point')
      await createChallenge(venue.id, sport.id, '3-Point 3', 'three_point')
      const ch4 = await createChallenge(venue.id, sport.id, 'Free Throw 1', 'free_throw')

      // User completes 2 three-point and 1 free-throw
      await createAttempt(ch1.id, user.id)
      await createAttempt(ch2.id, user.id)
      await createAttempt(ch4.id, user.id)

      mockGetSession.mockResolvedValue({ user: { id: user.id, email: user.email } })

      const response = await GET()

      expect(response.status).toBe(200)
      const body = await response.json()

      expect(body.threePointShot.total).toBe(3)
      expect(body.threePointShot.completed).toBe(2)
      expect(body.freeThrow.total).toBe(1)
      expect(body.freeThrow.completed).toBe(1)
    })

    it('should count multiple attempts as single completion', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const user = await createUser('test@test.com', 'Test', city.id)
      const sport = await createSport()
      const venue = await createVenue('Test Park', city.id)

      const ch1 = await createChallenge(venue.id, sport.id, '3-Point 1', 'three_point')

      // User attempts same challenge 3 times
      await createAttempt(ch1.id, user.id)
      await createAttempt(ch1.id, user.id)
      await createAttempt(ch1.id, user.id)

      mockGetSession.mockResolvedValue({ user: { id: user.id, email: user.email } })

      const response = await GET()

      expect(response.status).toBe(200)
      const body = await response.json()

      expect(body.threePointShot.total).toBe(1)
      expect(body.threePointShot.completed).toBe(1) // Still only 1 completed
    })

    it('should count 1v1 matches played', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const user = await createUser('test@test.com', 'Test', city.id)
      const opponent = await createUser('opponent@test.com', 'Opponent', city.id)
      const sport = await createSport()
      const venue = await createVenue('Test Park', city.id)

      // Create matches - user as player1 and player2
      await createMatch(venue.id, sport.id, user.id, opponent.id, 'completed')
      await createMatch(venue.id, sport.id, opponent.id, user.id, 'completed')
      await createMatch(venue.id, sport.id, user.id, opponent.id, 'pending') // Not counted

      mockGetSession.mockResolvedValue({ user: { id: user.id, email: user.email } })

      const response = await GET()

      expect(response.status).toBe(200)
      const body = await response.json()

      expect(body.oneVsOne.matchesPlayed).toBe(2)
    })

    it('should not count other users matches', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const user = await createUser('test@test.com', 'Test', city.id)
      const other1 = await createUser('other1@test.com', 'Other1', city.id)
      const other2 = await createUser('other2@test.com', 'Other2', city.id)
      const sport = await createSport()
      const venue = await createVenue('Test Park', city.id)

      // Create match between other users
      await createMatch(venue.id, sport.id, other1.id, other2.id, 'completed')

      mockGetSession.mockResolvedValue({ user: { id: user.id, email: user.email } })

      const response = await GET()

      expect(response.status).toBe(200)
      const body = await response.json()

      expect(body.oneVsOne.matchesPlayed).toBe(0)
    })

    it('should not count other users challenge attempts', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const user = await createUser('test@test.com', 'Test', city.id)
      const other = await createUser('other@test.com', 'Other', city.id)
      const sport = await createSport()
      const venue = await createVenue('Test Park', city.id)

      const ch1 = await createChallenge(venue.id, sport.id, '3-Point 1', 'three_point')

      // Other user completes challenge
      await createAttempt(ch1.id, other.id)

      mockGetSession.mockResolvedValue({ user: { id: user.id, email: user.email } })

      const response = await GET()

      expect(response.status).toBe(200)
      const body = await response.json()

      expect(body.threePointShot.total).toBe(1)
      expect(body.threePointShot.completed).toBe(0) // User hasn't completed any
    })

    it('should only count active challenges', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const user = await createUser('test@test.com', 'Test', city.id)
      const sport = await createSport()
      const venue = await createVenue('Test Park', city.id)

      // Create active and inactive challenges
      await createChallenge(venue.id, sport.id, '3-Point Active', 'three_point')

      // Create inactive challenge
      await testDb.insert(challenges).values({
        venueId: venue.id,
        sportId: sport.id,
        name: '3-Point Inactive',
        description: 'Test',
        instructions: 'Test',
        challengeType: 'three_point',
        xpReward: 50,
        rpReward: 10,
        difficulty: 'medium',
        isActive: false, // Inactive
      })

      mockGetSession.mockResolvedValue({ user: { id: user.id, email: user.email } })

      const response = await GET()

      expect(response.status).toBe(200)
      const body = await response.json()

      expect(body.threePointShot.total).toBe(1) // Only active challenge counted
    })
  })
})
