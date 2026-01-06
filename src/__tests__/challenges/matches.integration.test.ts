/**
 * Matches API Integration Tests
 * Tests for 1v1 match API endpoints with real database
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import { createTestDb, closeTestDb, clearTestDb, type TestDatabase } from '@/db/test-utils'
import { users, venues, cities, countries, sports, matches } from '@/db/schema'

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
import { NextRequest } from 'next/server'
import { GET as GET_MATCHES, POST as POST_MATCH } from '@/app/api/matches/route'
import { GET as GET_MATCH } from '@/app/api/matches/[matchId]/route'

// Helper to create mock request
function createMockRequest(url: string = 'http://localhost/api/matches'): NextRequest {
  return new NextRequest(url)
}
import { POST as POST_READY } from '@/app/api/matches/[matchId]/ready/route'
import { POST as POST_SCORE } from '@/app/api/matches/[matchId]/score/route'
import { POST as POST_AGREE } from '@/app/api/matches/[matchId]/agree/route'
import { POST as POST_DISPUTE } from '@/app/api/matches/[matchId]/dispute/route'

describe('Matches API Integration Tests', () => {
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

  async function createVenue(name: string, cityId: string) {
    const [venue] = await testDb.insert(venues).values({ name, cityId, isActive: true }).returning()
    return venue
  }

  async function createSport(name = 'Basketball', slug = 'basketball') {
    const [sport] = await testDb.insert(sports).values({ name, slug, isActive: true }).returning()
    return sport
  }

  async function createMatch(
    player1Id: string,
    player2Id: string,
    venueId: string,
    sportId: string,
    status = 'pending'
  ) {
    const [match] = await testDb
      .insert(matches)
      .values({ player1Id, player2Id, venueId, sportId, status })
      .returning()
    return match
  }

  describe('GET /api/matches', () => {
    it('should return 401 when not authenticated', async () => {
      mockGetSession.mockResolvedValue(null)

      const response = await GET_MATCHES(createMockRequest())

      expect(response.status).toBe(401)
    })

    it('should return empty list when no matches', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const user = await createUser('test@test.com', 'Test', city.id)

      mockGetSession.mockResolvedValue({ user: { id: user.id, email: user.email } })

      const response = await GET_MATCHES(createMockRequest())

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.matches).toHaveLength(0)
    })

    it('should return user matches', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const user1 = await createUser('test1@test.com', 'Player 1', city.id)
      const user2 = await createUser('test2@test.com', 'Player 2', city.id)
      const venue = await createVenue('Test Park', city.id)
      const sport = await createSport()

      await createMatch(user1.id, user2.id, venue.id, sport.id)

      mockGetSession.mockResolvedValue({ user: { id: user1.id, email: user1.email } })

      const response = await GET_MATCHES(createMockRequest())

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.matches).toHaveLength(1)
    })
  })

  describe('POST /api/matches', () => {
    it('should return 401 when not authenticated', async () => {
      mockGetSession.mockResolvedValue(null)

      const response = await POST_MATCH(
        new Request('http://localhost/api/matches', {
          method: 'POST',
          body: JSON.stringify({ opponentId: '123', venueId: '456', sportId: '789' }),
        })
      )

      expect(response.status).toBe(401)
    })

    it('should return 400 for missing fields', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const user = await createUser('test@test.com', 'Test', city.id)

      mockGetSession.mockResolvedValue({ user: { id: user.id, email: user.email } })

      const response = await POST_MATCH(
        new Request('http://localhost/api/matches', {
          method: 'POST',
          body: JSON.stringify({}),
        })
      )

      expect(response.status).toBe(400)
    })

    it('should return 400 when challenging yourself', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const user = await createUser('test@test.com', 'Test', city.id)
      const venue = await createVenue('Test Park', city.id)
      const sport = await createSport()

      mockGetSession.mockResolvedValue({ user: { id: user.id, email: user.email } })

      const response = await POST_MATCH(
        new Request('http://localhost/api/matches', {
          method: 'POST',
          body: JSON.stringify({
            opponentId: user.id, // Same as current user
            venueId: venue.id,
            sportId: sport.id,
          }),
        })
      )

      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.error).toContain('yourself')
    })

    it('should create match successfully', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const user1 = await createUser('test1@test.com', 'Player 1', city.id)
      const user2 = await createUser('test2@test.com', 'Player 2', city.id)
      const venue = await createVenue('Test Park', city.id)
      const sport = await createSport()

      mockGetSession.mockResolvedValue({ user: { id: user1.id, email: user1.email } })

      const response = await POST_MATCH(
        new Request('http://localhost/api/matches', {
          method: 'POST',
          body: JSON.stringify({
            opponentId: user2.id,
            venueId: venue.id,
            sportId: sport.id,
          }),
        })
      )

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.matchId).toBeDefined()
    })
  })

  describe('GET /api/matches/[matchId]', () => {
    it('should return 401 when not authenticated', async () => {
      mockGetSession.mockResolvedValue(null)

      const response = await GET_MATCH(new Request('http://localhost/api/matches/123'), {
        params: Promise.resolve({ matchId: '123' }),
      })

      expect(response.status).toBe(401)
    })

    it('should return 404 for non-existent match', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const user = await createUser('test@test.com', 'Test', city.id)

      mockGetSession.mockResolvedValue({ user: { id: user.id, email: user.email } })

      const response = await GET_MATCH(
        new Request('http://localhost/api/matches/00000000-0000-0000-0000-000000000000'),
        { params: Promise.resolve({ matchId: '00000000-0000-0000-0000-000000000000' }) }
      )

      expect(response.status).toBe(404)
    })

    it('should return 403 for non-participant', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const user1 = await createUser('test1@test.com', 'Player 1', city.id)
      const user2 = await createUser('test2@test.com', 'Player 2', city.id)
      const user3 = await createUser('test3@test.com', 'Outsider', city.id)
      const venue = await createVenue('Test Park', city.id)
      const sport = await createSport()

      const match = await createMatch(user1.id, user2.id, venue.id, sport.id)

      // User3 tries to view the match
      mockGetSession.mockResolvedValue({ user: { id: user3.id, email: user3.email } })

      const response = await GET_MATCH(new Request('http://localhost/api/matches/' + match.id), {
        params: Promise.resolve({ matchId: match.id }),
      })

      expect(response.status).toBe(403)
    })

    it('should return match details for participant', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const user1 = await createUser('test1@test.com', 'Player 1', city.id)
      const user2 = await createUser('test2@test.com', 'Player 2', city.id)
      const venue = await createVenue('Test Park', city.id)
      const sport = await createSport()

      const match = await createMatch(user1.id, user2.id, venue.id, sport.id)

      mockGetSession.mockResolvedValue({ user: { id: user1.id, email: user1.email } })

      const response = await GET_MATCH(new Request('http://localhost/api/matches/' + match.id), {
        params: Promise.resolve({ matchId: match.id }),
      })

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.match.id).toBe(match.id)
      expect(body.match.status).toBe('pending')
    })
  })

  describe('POST /api/matches/[matchId]/ready', () => {
    it('should start match when player is ready', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const user1 = await createUser('test1@test.com', 'Player 1', city.id)
      const user2 = await createUser('test2@test.com', 'Player 2', city.id)
      const venue = await createVenue('Test Park', city.id)
      const sport = await createSport()

      const match = await createMatch(user1.id, user2.id, venue.id, sport.id)

      mockGetSession.mockResolvedValue({ user: { id: user1.id, email: user1.email } })

      const response = await POST_READY(
        new Request('http://localhost/api/matches/' + match.id + '/ready', { method: 'POST' }),
        { params: Promise.resolve({ matchId: match.id }) }
      )

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.success).toBe(true)
    })
  })

  describe('POST /api/matches/[matchId]/score', () => {
    it('should submit score for in-progress match', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const user1 = await createUser('test1@test.com', 'Player 1', city.id)
      const user2 = await createUser('test2@test.com', 'Player 2', city.id)
      const venue = await createVenue('Test Park', city.id)
      const sport = await createSport()

      const match = await createMatch(user1.id, user2.id, venue.id, sport.id, 'in_progress')

      mockGetSession.mockResolvedValue({ user: { id: user1.id, email: user1.email } })

      const response = await POST_SCORE(
        new Request('http://localhost/api/matches/' + match.id + '/score', {
          method: 'POST',
          body: JSON.stringify({ player1Score: 12, player2Score: 10 }),
        }),
        { params: Promise.resolve({ matchId: match.id }) }
      )

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.success).toBe(true)
    })

    it('should reject negative scores', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const user1 = await createUser('test1@test.com', 'Player 1', city.id)
      const user2 = await createUser('test2@test.com', 'Player 2', city.id)
      const venue = await createVenue('Test Park', city.id)
      const sport = await createSport()

      const match = await createMatch(user1.id, user2.id, venue.id, sport.id, 'in_progress')

      mockGetSession.mockResolvedValue({ user: { id: user1.id, email: user1.email } })

      const response = await POST_SCORE(
        new Request('http://localhost/api/matches/' + match.id + '/score', {
          method: 'POST',
          body: JSON.stringify({ player1Score: -1, player2Score: 10 }),
        }),
        { params: Promise.resolve({ matchId: match.id }) }
      )

      expect(response.status).toBe(400)
    })
  })

  describe('POST /api/matches/[matchId]/agree', () => {
    it('should agree to match result', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const user1 = await createUser('test1@test.com', 'Player 1', city.id)
      const user2 = await createUser('test2@test.com', 'Player 2', city.id)
      const venue = await createVenue('Test Park', city.id)
      const sport = await createSport()

      // Create match with score already set
      const [match] = await testDb
        .insert(matches)
        .values({
          player1Id: user1.id,
          player2Id: user2.id,
          venueId: venue.id,
          sportId: sport.id,
          status: 'in_progress',
          player1Score: 12,
          player2Score: 10,
          winnerId: user1.id,
        })
        .returning()

      mockGetSession.mockResolvedValue({ user: { id: user1.id, email: user1.email } })

      const response = await POST_AGREE(
        new Request('http://localhost/api/matches/' + match.id + '/agree', { method: 'POST' }),
        { params: Promise.resolve({ matchId: match.id }) }
      )

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.success).toBe(true)
    })
  })

  describe('POST /api/matches/[matchId]/dispute', () => {
    it('should dispute match result', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const user1 = await createUser('test1@test.com', 'Player 1', city.id)
      const user2 = await createUser('test2@test.com', 'Player 2', city.id)
      const venue = await createVenue('Test Park', city.id)
      const sport = await createSport()

      const match = await createMatch(user1.id, user2.id, venue.id, sport.id, 'in_progress')

      mockGetSession.mockResolvedValue({ user: { id: user1.id, email: user1.email } })

      const response = await POST_DISPUTE(
        new Request('http://localhost/api/matches/' + match.id + '/dispute', { method: 'POST' }),
        { params: Promise.resolve({ matchId: match.id }) }
      )

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.success).toBe(true)
      expect(body.message).toContain('disputed')
    })
  })
})
