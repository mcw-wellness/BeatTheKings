/**
 * Challenge Type Pages Integration Tests
 * Tests for 1v1 history and by-type API endpoints
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
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

// Mock azure-storage
vi.mock('@/lib/azure-storage', () => ({
  getUserAvatarSasUrl: (userId: string) =>
    `https://test.blob.core.windows.net/avatar/users/${userId}/avatar.png`,
}))

// Mock getDb
let testDb: TestDatabase

vi.mock('@/db', () => ({
  getDb: () => testDb,
}))

// Import after mocking
import { GET as GET_1V1_HISTORY } from '@/app/api/challenges/1v1/history/route'
import { GET as GET_BY_TYPE } from '@/app/api/challenges/by-type/[type]/route'

describe('Challenge Type Pages Integration Tests', () => {
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

  async function createAttempt(
    challengeId: string,
    odlUserId: string,
    scoreValue: number,
    maxValue: number
  ) {
    const [attempt] = await testDb
      .insert(challengeAttempts)
      .values({
        challengeId,
        userId: odlUserId,
        scoreValue,
        maxValue,
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
    status: string,
    p1Score?: number,
    p2Score?: number,
    winnerId?: string
  ) {
    const [match] = await testDb
      .insert(matches)
      .values({
        venueId,
        sportId,
        player1Id,
        player2Id,
        status,
        player1Score: p1Score,
        player2Score: p2Score,
        winnerId,
        completedAt: status === 'completed' ? new Date() : null,
      })
      .returning()
    return match
  }

  describe('GET /api/challenges/1v1/history', () => {
    it('should return 401 when not authenticated', async () => {
      mockGetSession.mockResolvedValue(null)

      const response = await GET_1V1_HISTORY()

      expect(response.status).toBe(401)
    })

    it('should return empty history for new user', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const user = await createUser('test@test.com', 'Test', city.id)

      mockGetSession.mockResolvedValue({ user: { id: user.id, email: user.email } })

      const response = await GET_1V1_HISTORY()

      expect(response.status).toBe(200)
      const body = await response.json()

      expect(body.stats.totalMatches).toBe(0)
      expect(body.stats.wins).toBe(0)
      expect(body.stats.losses).toBe(0)
      expect(body.matches).toHaveLength(0)
    })

    it('should return match history with stats', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const user = await createUser('test@test.com', 'Test User', city.id)
      const opponent = await createUser('opponent@test.com', 'Opponent', city.id)
      const sport = await createSport()
      const venue = await createVenue('Test Park', city.id)

      // Create completed matches
      await createMatch(venue.id, sport.id, user.id, opponent.id, 'completed', 10, 8, user.id)
      await createMatch(venue.id, sport.id, opponent.id, user.id, 'completed', 10, 5, opponent.id)

      mockGetSession.mockResolvedValue({ user: { id: user.id, email: user.email } })

      const response = await GET_1V1_HISTORY()

      expect(response.status).toBe(200)
      const body = await response.json()

      expect(body.stats.totalMatches).toBe(2)
      expect(body.stats.wins).toBe(1)
      expect(body.stats.losses).toBe(1)
      expect(body.matches).toHaveLength(2)
    })

    it('should not include pending matches', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const user = await createUser('test@test.com', 'Test', city.id)
      const opponent = await createUser('opponent@test.com', 'Opponent', city.id)
      const sport = await createSport()
      const venue = await createVenue('Test Park', city.id)

      await createMatch(venue.id, sport.id, user.id, opponent.id, 'completed', 10, 8, user.id)
      await createMatch(venue.id, sport.id, user.id, opponent.id, 'pending')

      mockGetSession.mockResolvedValue({ user: { id: user.id, email: user.email } })

      const response = await GET_1V1_HISTORY()

      expect(response.status).toBe(200)
      const body = await response.json()

      expect(body.stats.totalMatches).toBe(1)
      expect(body.matches).toHaveLength(1)
    })

    it('should include opponent info and venue', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const user = await createUser('test@test.com', 'Test', city.id)
      const opponent = await createUser('opponent@test.com', 'Opponent Player', city.id)
      const sport = await createSport()
      const venue = await createVenue('Esterhazy Park', city.id)

      await createMatch(venue.id, sport.id, user.id, opponent.id, 'completed', 10, 8, user.id)

      mockGetSession.mockResolvedValue({ user: { id: user.id, email: user.email } })

      const response = await GET_1V1_HISTORY()

      expect(response.status).toBe(200)
      const body = await response.json()

      expect(body.matches[0].opponent.name).toBe('Opponent Player')
      expect(body.matches[0].venueName).toBe('Esterhazy Park')
      expect(body.matches[0].myScore).toBe(10)
      expect(body.matches[0].opponentScore).toBe(8)
      expect(body.matches[0].won).toBe(true)
    })
  })

  describe('GET /api/challenges/by-type/[type]', () => {
    it('should return 401 when not authenticated', async () => {
      mockGetSession.mockResolvedValue(null)

      const response = await GET_BY_TYPE(
        new NextRequest('http://localhost/api/challenges/by-type/free_throw'),
        { params: Promise.resolve({ type: 'free_throw' }) }
      )

      expect(response.status).toBe(401)
    })

    it('should return 400 for invalid type', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const user = await createUser('test@test.com', 'Test', city.id)

      mockGetSession.mockResolvedValue({ user: { id: user.id, email: user.email } })

      const response = await GET_BY_TYPE(
        new NextRequest('http://localhost/api/challenges/by-type/invalid'),
        { params: Promise.resolve({ type: 'invalid' }) }
      )

      expect(response.status).toBe(400)
    })

    it('should return empty list for no challenges', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const user = await createUser('test@test.com', 'Test', city.id)

      mockGetSession.mockResolvedValue({ user: { id: user.id, email: user.email } })

      const response = await GET_BY_TYPE(
        new NextRequest('http://localhost/api/challenges/by-type/free_throw'),
        { params: Promise.resolve({ type: 'free_throw' }) }
      )

      expect(response.status).toBe(200)
      const body = await response.json()

      expect(body.challengeType).toBe('free_throw')
      expect(body.displayName).toBe('Free Throw')
      expect(body.total).toBe(0)
      expect(body.completed).toBe(0)
      expect(body.challenges).toHaveLength(0)
    })

    it('should return challenges of the specified type', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const user = await createUser('test@test.com', 'Test', city.id)
      const sport = await createSport()
      const venue = await createVenue('Test Park', city.id)

      await createChallenge(venue.id, sport.id, 'Free Throw 1', 'free_throw')
      await createChallenge(venue.id, sport.id, 'Free Throw 2', 'free_throw')
      await createChallenge(venue.id, sport.id, '3-Point Shot', 'three_point') // Different type

      mockGetSession.mockResolvedValue({ user: { id: user.id, email: user.email } })

      const response = await GET_BY_TYPE(
        new NextRequest('http://localhost/api/challenges/by-type/free_throw'),
        { params: Promise.resolve({ type: 'free_throw' }) }
      )

      expect(response.status).toBe(200)
      const body = await response.json()

      expect(body.total).toBe(2)
      expect(body.challenges).toHaveLength(2)
      expect(body.challenges.every((c: { name: string }) => c.name.includes('Free Throw'))).toBe(
        true
      )
    })

    it('should include user attempts and best score', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const user = await createUser('test@test.com', 'Test', city.id)
      const sport = await createSport()
      const venue = await createVenue('Test Park', city.id)

      const ch1 = await createChallenge(venue.id, sport.id, 'Free Throw 1', 'free_throw')

      // Multiple attempts with different scores
      await createAttempt(ch1.id, user.id, 6, 10) // 60%
      await createAttempt(ch1.id, user.id, 9, 10) // 90% - best
      await createAttempt(ch1.id, user.id, 7, 10) // 70%

      mockGetSession.mockResolvedValue({ user: { id: user.id, email: user.email } })

      const response = await GET_BY_TYPE(
        new NextRequest('http://localhost/api/challenges/by-type/free_throw'),
        { params: Promise.resolve({ type: 'free_throw' }) }
      )

      expect(response.status).toBe(200)
      const body = await response.json()

      expect(body.completed).toBe(1)
      expect(body.challenges[0].attempts).toBe(3)
      expect(body.challenges[0].bestScore).toBeDefined()
      expect(body.challenges[0].bestScore.accuracy).toBe(90)
    })

    it('should count completed challenges correctly', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const user = await createUser('test@test.com', 'Test', city.id)
      const sport = await createSport()
      const venue = await createVenue('Test Park', city.id)

      const ch1 = await createChallenge(venue.id, sport.id, 'FT 1', 'free_throw')
      const ch2 = await createChallenge(venue.id, sport.id, 'FT 2', 'free_throw')
      await createChallenge(venue.id, sport.id, 'FT 3', 'free_throw') // Not attempted

      // User attempts first two
      await createAttempt(ch1.id, user.id, 8, 10)
      await createAttempt(ch2.id, user.id, 7, 10)

      mockGetSession.mockResolvedValue({ user: { id: user.id, email: user.email } })

      const response = await GET_BY_TYPE(
        new NextRequest('http://localhost/api/challenges/by-type/free_throw'),
        { params: Promise.resolve({ type: 'free_throw' }) }
      )

      expect(response.status).toBe(200)
      const body = await response.json()

      expect(body.total).toBe(3)
      expect(body.completed).toBe(2)
    })

    it('should work for three_point type', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const user = await createUser('test@test.com', 'Test', city.id)
      const sport = await createSport()
      const venue = await createVenue('Test Park', city.id)

      await createChallenge(venue.id, sport.id, '3-Point Basic', 'three_point')

      mockGetSession.mockResolvedValue({ user: { id: user.id, email: user.email } })

      const response = await GET_BY_TYPE(
        new NextRequest('http://localhost/api/challenges/by-type/three_point'),
        { params: Promise.resolve({ type: 'three_point' }) }
      )

      expect(response.status).toBe(200)
      const body = await response.json()

      expect(body.challengeType).toBe('three_point')
      expect(body.displayName).toBe('3-Point Shot')
      expect(body.total).toBe(1)
    })

    it('should work for around_the_world type', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const user = await createUser('test@test.com', 'Test', city.id)
      const sport = await createSport()
      const venue = await createVenue('Test Park', city.id)

      await createChallenge(venue.id, sport.id, 'ATW Basic', 'around_the_world')

      mockGetSession.mockResolvedValue({ user: { id: user.id, email: user.email } })

      const response = await GET_BY_TYPE(
        new NextRequest('http://localhost/api/challenges/by-type/around_the_world'),
        { params: Promise.resolve({ type: 'around_the_world' }) }
      )

      expect(response.status).toBe(200)
      const body = await response.json()

      expect(body.challengeType).toBe('around_the_world')
      expect(body.displayName).toBe('Around the World')
      expect(body.total).toBe(1)
    })
  })
})
