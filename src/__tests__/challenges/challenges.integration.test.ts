/**
 * Challenges API Integration Tests
 * Tests for challenge API endpoints with real database
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import { createTestDb, closeTestDb, clearTestDb, type TestDatabase } from '@/db/test-utils'
import { eq } from 'drizzle-orm'
import { users, venues, cities, countries, challenges, sports, playerStats } from '@/db/schema'

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
import { GET as GET_VENUES } from '@/app/api/challenges/venues/route'
import { GET as GET_VENUE_CHALLENGES } from '@/app/api/challenges/venues/[venueId]/route'
import { GET as GET_CHALLENGE } from '@/app/api/challenges/[challengeId]/route'
import { POST as POST_ATTEMPT } from '@/app/api/challenges/[challengeId]/attempt/route'

describe('Challenges API Integration Tests', () => {
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

  async function createUser(email: string, name: string, cityId: string, ageGroup = '18-30') {
    const [user] = await testDb
      .insert(users)
      .values({ email, name, cityId, hasCreatedAvatar: true, ageGroup })
      .returning()
    return user
  }

  async function createVenue(name: string, cityId: string, lat?: number, lng?: number) {
    const [venue] = await testDb
      .insert(venues)
      .values({
        name,
        cityId,
        latitude: lat,
        longitude: lng,
        isActive: true,
      })
      .returning()
    return venue
  }

  async function createSport(name = 'Basketball', slug = 'basketball') {
    const [sport] = await testDb.insert(sports).values({ name, slug, isActive: true }).returning()
    return sport
  }

  async function createChallenge(
    venueId: string,
    sportId: string,
    name: string,
    type = 'three_point'
  ) {
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

  describe('GET /api/challenges/venues', () => {
    it('should return 401 when not authenticated', async () => {
      mockGetSession.mockResolvedValue(null)

      const response = await GET_VENUES(new Request('http://localhost/api/challenges/venues'))

      expect(response.status).toBe(401)
    })

    it('should return list of venues with challenge counts', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const user = await createUser('test@test.com', 'Test', city.id)
      const sport = await createSport()

      const venue1 = await createVenue('Park A', city.id)
      const venue2 = await createVenue('Park B', city.id)

      await createChallenge(venue1.id, sport.id, 'Challenge 1')
      await createChallenge(venue1.id, sport.id, 'Challenge 2')
      await createChallenge(venue2.id, sport.id, 'Challenge 3')

      mockGetSession.mockResolvedValue({ user: { id: user.id, email: user.email } })

      const response = await GET_VENUES(new Request('http://localhost/api/challenges/venues'))

      expect(response.status).toBe(200)
      const body = await response.json()

      expect(body.venues).toHaveLength(2)
      const parkA = body.venues.find((v: { name: string }) => v.name === 'Park A')
      const parkB = body.venues.find((v: { name: string }) => v.name === 'Park B')
      expect(parkA.challengeCount).toBe(2)
      expect(parkB.challengeCount).toBe(1)
    })

    it('should sort venues by distance when location provided', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const user = await createUser('test@test.com', 'Test', city.id)

      // User at 48.20, 16.37
      await createVenue('Close Venue', city.id, 48.21, 16.37) // ~1km
      await createVenue('Far Venue', city.id, 48.25, 16.4) // ~6km

      mockGetSession.mockResolvedValue({ user: { id: user.id, email: user.email } })

      const response = await GET_VENUES(
        new Request('http://localhost/api/challenges/venues?lat=48.20&lng=16.37')
      )

      expect(response.status).toBe(200)
      const body = await response.json()

      expect(body.venues[0].name).toBe('Close Venue')
      expect(body.venues[1].name).toBe('Far Venue')
    })
  })

  describe('GET /api/challenges/venues/[venueId]', () => {
    it('should return 401 when not authenticated', async () => {
      mockGetSession.mockResolvedValue(null)

      const response = await GET_VENUE_CHALLENGES(
        new Request('http://localhost/api/challenges/venues/123'),
        { params: Promise.resolve({ venueId: '123' }) }
      )

      expect(response.status).toBe(401)
    })

    it('should return 404 for non-existent venue', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const user = await createUser('test@test.com', 'Test', city.id)

      mockGetSession.mockResolvedValue({ user: { id: user.id, email: user.email } })

      const response = await GET_VENUE_CHALLENGES(
        new Request('http://localhost/api/challenges/venues/00000000-0000-0000-0000-000000000000'),
        { params: Promise.resolve({ venueId: '00000000-0000-0000-0000-000000000000' }) }
      )

      expect(response.status).toBe(404)
    })

    it('should return venue with challenges', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const user = await createUser('test@test.com', 'Test', city.id)
      const sport = await createSport()
      const venue = await createVenue('Test Park', city.id)

      await createChallenge(venue.id, sport.id, '3-Point Shot', 'three_point')
      await createChallenge(venue.id, sport.id, 'Free Throw', 'free_throw')

      mockGetSession.mockResolvedValue({ user: { id: user.id, email: user.email } })

      const response = await GET_VENUE_CHALLENGES(
        new Request('http://localhost/api/challenges/venues/' + venue.id),
        { params: Promise.resolve({ venueId: venue.id }) }
      )

      expect(response.status).toBe(200)
      const body = await response.json()

      expect(body.venue.name).toBe('Test Park')
      expect(body.challenges).toHaveLength(2)
      expect(body.opponents).toHaveLength(0) // No active players
    })
  })

  describe('GET /api/challenges/[challengeId]', () => {
    it('should return 401 when not authenticated', async () => {
      mockGetSession.mockResolvedValue(null)

      const response = await GET_CHALLENGE(new Request('http://localhost/api/challenges/123'), {
        params: Promise.resolve({ challengeId: '123' }),
      })

      expect(response.status).toBe(401)
    })

    it('should return 404 for non-existent challenge', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const user = await createUser('test@test.com', 'Test', city.id)

      mockGetSession.mockResolvedValue({ user: { id: user.id, email: user.email } })

      const response = await GET_CHALLENGE(
        new Request('http://localhost/api/challenges/00000000-0000-0000-0000-000000000000'),
        { params: Promise.resolve({ challengeId: '00000000-0000-0000-0000-000000000000' }) }
      )

      expect(response.status).toBe(404)
    })

    it('should return challenge details with instructions', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const user = await createUser('test@test.com', 'Test', city.id)
      const sport = await createSport()
      const venue = await createVenue('Test Park', city.id)
      const challenge = await createChallenge(venue.id, sport.id, '3-Point Shot')

      mockGetSession.mockResolvedValue({ user: { id: user.id, email: user.email } })

      const response = await GET_CHALLENGE(
        new Request('http://localhost/api/challenges/' + challenge.id),
        { params: Promise.resolve({ challengeId: challenge.id }) }
      )

      expect(response.status).toBe(200)
      const body = await response.json()

      expect(body.challenge.name).toBe('3-Point Shot')
      expect(body.challenge.instructions).toBeDefined()
      expect(body.challenge.venueName).toBe('Test Park')
      expect(body.challenge.sportName).toBe('Basketball')
      expect(body.challenge.myAttempts).toBe(0)
    })
  })

  describe('POST /api/challenges/[challengeId]/attempt', () => {
    it('should return 401 when not authenticated', async () => {
      mockGetSession.mockResolvedValue(null)

      const response = await POST_ATTEMPT(
        new Request('http://localhost/api/challenges/123/attempt', {
          method: 'POST',
          body: JSON.stringify({ scoreValue: 5, maxValue: 10 }),
        }),
        { params: Promise.resolve({ challengeId: '123' }) }
      )

      expect(response.status).toBe(401)
    })

    it('should return 400 for missing score values', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const user = await createUser('test@test.com', 'Test', city.id)

      mockGetSession.mockResolvedValue({ user: { id: user.id, email: user.email } })

      const response = await POST_ATTEMPT(
        new Request('http://localhost/api/challenges/123/attempt', {
          method: 'POST',
          body: JSON.stringify({}),
        }),
        { params: Promise.resolve({ challengeId: '123' }) }
      )

      expect(response.status).toBe(400)
    })

    it('should return 400 for negative values', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const user = await createUser('test@test.com', 'Test', city.id)

      mockGetSession.mockResolvedValue({ user: { id: user.id, email: user.email } })

      const response = await POST_ATTEMPT(
        new Request('http://localhost/api/challenges/123/attempt', {
          method: 'POST',
          body: JSON.stringify({ scoreValue: -1, maxValue: 10 }),
        }),
        { params: Promise.resolve({ challengeId: '123' }) }
      )

      expect(response.status).toBe(400)
    })

    it('should return 400 when scoreValue exceeds maxValue', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const user = await createUser('test@test.com', 'Test', city.id)

      mockGetSession.mockResolvedValue({ user: { id: user.id, email: user.email } })

      const response = await POST_ATTEMPT(
        new Request('http://localhost/api/challenges/123/attempt', {
          method: 'POST',
          body: JSON.stringify({ scoreValue: 15, maxValue: 10 }),
        }),
        { params: Promise.resolve({ challengeId: '123' }) }
      )

      expect(response.status).toBe(400)
    })

    it('should record attempt and return XP earned', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const user = await createUser('test@test.com', 'Test', city.id)
      const sport = await createSport()
      const venue = await createVenue('Test Park', city.id)
      const challenge = await createChallenge(venue.id, sport.id, '3-Point Shot')

      mockGetSession.mockResolvedValue({ user: { id: user.id, email: user.email } })

      const response = await POST_ATTEMPT(
        new Request('http://localhost/api/challenges/' + challenge.id + '/attempt', {
          method: 'POST',
          body: JSON.stringify({ scoreValue: 8, maxValue: 10 }),
        }),
        { params: Promise.resolve({ challengeId: challenge.id }) }
      )

      expect(response.status).toBe(200)
      const body = await response.json()

      expect(body.success).toBe(true)
      expect(body.xpEarned).toBeGreaterThan(0)
      expect(body.message).toContain('80%')
    })

    it('should update player stats after attempt', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const user = await createUser('test@test.com', 'Test', city.id)
      const sport = await createSport()
      const venue = await createVenue('Test Park', city.id)
      const challenge = await createChallenge(venue.id, sport.id, '3-Point Shot', 'three_point')

      mockGetSession.mockResolvedValue({ user: { id: user.id, email: user.email } })

      await POST_ATTEMPT(
        new Request('http://localhost/api/challenges/' + challenge.id + '/attempt', {
          method: 'POST',
          body: JSON.stringify({ scoreValue: 8, maxValue: 10 }),
        }),
        { params: Promise.resolve({ challengeId: challenge.id }) }
      )

      // Check stats were created/updated
      const [stats] = await testDb.select().from(playerStats).where(eq(playerStats.userId, user.id))

      expect(stats).toBeDefined()
      expect(stats.challengesCompleted).toBe(1)
      expect(stats.threePointMade).toBe(8)
      expect(stats.threePointAttempted).toBe(10)
    })

    it('should award RP for 80%+ accuracy', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const user = await createUser('test@test.com', 'Test', city.id)
      const sport = await createSport()
      const venue = await createVenue('Test Park', city.id)
      const challenge = await createChallenge(venue.id, sport.id, '3-Point Shot')

      mockGetSession.mockResolvedValue({ user: { id: user.id, email: user.email } })

      // 80% accuracy
      const response = await POST_ATTEMPT(
        new Request('http://localhost/api/challenges/' + challenge.id + '/attempt', {
          method: 'POST',
          body: JSON.stringify({ scoreValue: 8, maxValue: 10 }),
        }),
        { params: Promise.resolve({ challengeId: challenge.id }) }
      )

      const body = await response.json()
      expect(body.rpEarned).toBeGreaterThan(0)
    })

    it('should not award RP for below 80% accuracy', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const user = await createUser('test@test.com', 'Test', city.id)
      const sport = await createSport()
      const venue = await createVenue('Test Park', city.id)
      const challenge = await createChallenge(venue.id, sport.id, '3-Point Shot')

      mockGetSession.mockResolvedValue({ user: { id: user.id, email: user.email } })

      // 70% accuracy
      const response = await POST_ATTEMPT(
        new Request('http://localhost/api/challenges/' + challenge.id + '/attempt', {
          method: 'POST',
          body: JSON.stringify({ scoreValue: 7, maxValue: 10 }),
        }),
        { params: Promise.resolve({ challengeId: challenge.id }) }
      )

      const body = await response.json()
      expect(body.rpEarned).toBe(0)
    })
  })
})
