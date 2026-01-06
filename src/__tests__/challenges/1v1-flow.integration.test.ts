/**
 * 1v1 Challenge Flow Integration Tests
 * Tests for the new 1v1 challenge API endpoints
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

// Mock Azure storage
vi.mock('@/lib/azure-storage', () => ({
  uploadMatchVideo: vi.fn().mockResolvedValue('https://test.blob.core.windows.net/match-video.mp4'),
  getUserAvatarSasUrl: (userId: string) => `https://test.blob.core.windows.net/avatar/${userId}`,
  getDefaultAvatarSasUrl: (gender: string) =>
    `https://test.blob.core.windows.net/default/${gender}`,
}))

// Mock Gemini analysis
vi.mock('@/lib/gemini', () => ({
  analyzeMatchVideo: vi.fn().mockResolvedValue({
    player1Score: 12,
    player2Score: 10,
    player1ShotsMade: 6,
    player1ShotsAttempted: 10,
    player2ShotsMade: 5,
    player2ShotsAttempted: 9,
    durationSeconds: 600,
    confidence: 0.9,
  }),
  calculateRewards: vi.fn().mockReturnValue({
    winnerXp: 150,
    winnerRp: 30,
    loserXp: 50,
  }),
}))

// Mock getDb
let testDb: TestDatabase

vi.mock('@/db', () => ({
  getDb: () => testDb,
}))

// Import after mocking
import { POST as POST_REQUEST } from '@/app/api/challenges/1v1/request/route'
import { GET as GET_MATCH, POST as POST_START } from '@/app/api/challenges/1v1/[matchId]/route'
import { POST as POST_RESPOND } from '@/app/api/challenges/1v1/[matchId]/respond/route'
import { POST as POST_UPLOAD } from '@/app/api/challenges/1v1/[matchId]/upload/route'
import { GET as GET_RESULTS } from '@/app/api/challenges/1v1/[matchId]/results/route'
import { POST as POST_AGREE } from '@/app/api/challenges/1v1/[matchId]/agree/route'

describe('1v1 Challenge Flow Integration Tests', () => {
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

  function createRequest(body: object) {
    return new Request('http://localhost/api/challenges/1v1/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  describe('POST /api/challenges/1v1/request', () => {
    it('should return 401 when not authenticated', async () => {
      mockGetSession.mockResolvedValue(null)

      const request = createRequest({ opponentId: 'test', venueId: 'test' })
      const response = await POST_REQUEST(request)

      expect(response.status).toBe(401)
    })

    it('should return 400 when missing required fields', async () => {
      mockGetSession.mockResolvedValue({ user: { id: 'user-1' } })

      const request = createRequest({})
      const response = await POST_REQUEST(request)

      expect(response.status).toBe(400)
    })

    it('should return 400 when challenging yourself', async () => {
      mockGetSession.mockResolvedValue({ user: { id: 'user-1' } })

      const request = createRequest({ opponentId: 'user-1', venueId: 'venue-1' })
      const response = await POST_REQUEST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('yourself')
    })

    it('should create challenge successfully', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const challenger = await createUser('challenger@test.com', 'Challenger', city.id)
      const opponent = await createUser('opponent@test.com', 'Opponent', city.id)
      const venue = await createVenue('Test Venue', city.id)
      await createSport()

      mockGetSession.mockResolvedValue({ user: { id: challenger.id } })

      const request = createRequest({ opponentId: opponent.id, venueId: venue.id })
      const response = await POST_REQUEST(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.matchId).toBeDefined()
      expect(data.status).toBe('pending')
    })
  })

  describe('POST /api/challenges/1v1/[matchId]/respond', () => {
    it('should accept challenge', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const challenger = await createUser('challenger@test.com', 'Challenger', city.id)
      const opponent = await createUser('opponent@test.com', 'Opponent', city.id)
      const venue = await createVenue('Test Venue', city.id)
      const sport = await createSport()
      const match = await createMatch(challenger.id, opponent.id, venue.id, sport.id)

      mockGetSession.mockResolvedValue({ user: { id: opponent.id } })

      const request = new Request(`http://localhost/api/challenges/1v1/${match.id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accept: true }),
      })

      const response = await POST_RESPOND(request, {
        params: Promise.resolve({ matchId: match.id }),
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.status).toBe('accepted')
    })

    it('should decline challenge', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const challenger = await createUser('challenger@test.com', 'Challenger', city.id)
      const opponent = await createUser('opponent@test.com', 'Opponent', city.id)
      const venue = await createVenue('Test Venue', city.id)
      const sport = await createSport()
      const match = await createMatch(challenger.id, opponent.id, venue.id, sport.id)

      mockGetSession.mockResolvedValue({ user: { id: opponent.id } })

      const request = new Request(`http://localhost/api/challenges/1v1/${match.id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accept: false }),
      })

      const response = await POST_RESPOND(request, {
        params: Promise.resolve({ matchId: match.id }),
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.status).toBe('declined')
    })

    it('should reject non-opponent response', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const challenger = await createUser('challenger@test.com', 'Challenger', city.id)
      const opponent = await createUser('opponent@test.com', 'Opponent', city.id)
      const randomUser = await createUser('random@test.com', 'Random', city.id)
      const venue = await createVenue('Test Venue', city.id)
      const sport = await createSport()
      const match = await createMatch(challenger.id, opponent.id, venue.id, sport.id)

      mockGetSession.mockResolvedValue({ user: { id: randomUser.id } })

      const request = new Request(`http://localhost/api/challenges/1v1/${match.id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accept: true }),
      })

      const response = await POST_RESPOND(request, {
        params: Promise.resolve({ matchId: match.id }),
      })

      expect(response.status).toBe(400)
    })
  })

  describe('GET /api/challenges/1v1/[matchId]', () => {
    it('should return match details for participant', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const challenger = await createUser('challenger@test.com', 'Challenger', city.id)
      const opponent = await createUser('opponent@test.com', 'Opponent', city.id)
      const venue = await createVenue('Test Venue', city.id)
      const sport = await createSport()
      const match = await createMatch(challenger.id, opponent.id, venue.id, sport.id)

      mockGetSession.mockResolvedValue({ user: { id: challenger.id } })

      const request = new Request(`http://localhost/api/challenges/1v1/${match.id}`)
      const response = await GET_MATCH(request, { params: Promise.resolve({ matchId: match.id }) })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.match).toBeDefined()
      expect(data.isChallenger).toBe(true)
    })

    it('should reject non-participant', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const challenger = await createUser('challenger@test.com', 'Challenger', city.id)
      const opponent = await createUser('opponent@test.com', 'Opponent', city.id)
      const randomUser = await createUser('random@test.com', 'Random', city.id)
      const venue = await createVenue('Test Venue', city.id)
      const sport = await createSport()
      const match = await createMatch(challenger.id, opponent.id, venue.id, sport.id)

      mockGetSession.mockResolvedValue({ user: { id: randomUser.id } })

      const request = new Request(`http://localhost/api/challenges/1v1/${match.id}`)
      const response = await GET_MATCH(request, { params: Promise.resolve({ matchId: match.id }) })

      expect(response.status).toBe(403)
    })
  })

  describe('POST /api/challenges/1v1/[matchId] (Start Match)', () => {
    it('should start accepted match', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const challenger = await createUser('challenger@test.com', 'Challenger', city.id)
      const opponent = await createUser('opponent@test.com', 'Opponent', city.id)
      const venue = await createVenue('Test Venue', city.id)
      const sport = await createSport()
      const match = await createMatch(challenger.id, opponent.id, venue.id, sport.id, 'accepted')

      mockGetSession.mockResolvedValue({ user: { id: challenger.id } })

      const request = new Request(`http://localhost/api/challenges/1v1/${match.id}`, {
        method: 'POST',
      })
      const response = await POST_START(request, { params: Promise.resolve({ matchId: match.id }) })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.status).toBe('in_progress')
    })

    it('should not start pending match', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const challenger = await createUser('challenger@test.com', 'Challenger', city.id)
      const opponent = await createUser('opponent@test.com', 'Opponent', city.id)
      const venue = await createVenue('Test Venue', city.id)
      const sport = await createSport()
      const match = await createMatch(challenger.id, opponent.id, venue.id, sport.id, 'pending')

      mockGetSession.mockResolvedValue({ user: { id: challenger.id } })

      const request = new Request(`http://localhost/api/challenges/1v1/${match.id}`, {
        method: 'POST',
      })
      const response = await POST_START(request, { params: Promise.resolve({ matchId: match.id }) })

      expect(response.status).toBe(400)
    })
  })

  describe('POST /api/challenges/1v1/[matchId]/upload', () => {
    it('should return 401 when not authenticated', async () => {
      mockGetSession.mockResolvedValue(null)

      const formData = new FormData()
      formData.append('video', new Blob(['test'], { type: 'video/mp4' }), 'test.mp4')

      const request = new Request('http://localhost/api/challenges/1v1/test-id/upload', {
        method: 'POST',
        body: formData,
      })

      const response = await POST_UPLOAD(request, {
        params: Promise.resolve({ matchId: 'test-id' }),
      })

      expect(response.status).toBe(401)
    })

    it('should handle non-existent match', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const user = await createUser('user@test.com', 'User', city.id)

      mockGetSession.mockResolvedValue({ user: { id: user.id } })

      const formData = new FormData()
      formData.append('video', new Blob(['test'], { type: 'video/mp4' }), 'test.mp4')

      const request = new Request('http://localhost/api/challenges/1v1/non-existent/upload', {
        method: 'POST',
        body: formData,
      })

      const response = await POST_UPLOAD(request, {
        params: Promise.resolve({ matchId: 'non-existent' }),
      })

      // Should return 404 or 500 depending on implementation
      expect([404, 500]).toContain(response.status)
    })

    it('should return 403 for non-participant', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const challenger = await createUser('challenger@test.com', 'Challenger', city.id)
      const opponent = await createUser('opponent@test.com', 'Opponent', city.id)
      const randomUser = await createUser('random@test.com', 'Random', city.id)
      const venue = await createVenue('Test Venue', city.id)
      const sport = await createSport()
      const match = await createMatch(challenger.id, opponent.id, venue.id, sport.id, 'in_progress')

      mockGetSession.mockResolvedValue({ user: { id: randomUser.id } })

      const formData = new FormData()
      formData.append('video', new Blob(['test'], { type: 'video/mp4' }), 'test.mp4')

      const request = new Request(`http://localhost/api/challenges/1v1/${match.id}/upload`, {
        method: 'POST',
        body: formData,
      })

      const response = await POST_UPLOAD(request, {
        params: Promise.resolve({ matchId: match.id }),
      })

      expect(response.status).toBe(403)
    })

    it('should return 400 when match not in progress', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const challenger = await createUser('challenger@test.com', 'Challenger', city.id)
      const opponent = await createUser('opponent@test.com', 'Opponent', city.id)
      const venue = await createVenue('Test Venue', city.id)
      const sport = await createSport()
      const match = await createMatch(challenger.id, opponent.id, venue.id, sport.id, 'pending')

      mockGetSession.mockResolvedValue({ user: { id: challenger.id } })

      const formData = new FormData()
      formData.append('video', new Blob(['test'], { type: 'video/mp4' }), 'test.mp4')

      const request = new Request(`http://localhost/api/challenges/1v1/${match.id}/upload`, {
        method: 'POST',
        body: formData,
      })

      const response = await POST_UPLOAD(request, {
        params: Promise.resolve({ matchId: match.id }),
      })

      expect(response.status).toBe(400)
    })

    it('should return 400 when no video provided', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const challenger = await createUser('challenger@test.com', 'Challenger', city.id)
      const opponent = await createUser('opponent@test.com', 'Opponent', city.id)
      const venue = await createVenue('Test Venue', city.id)
      const sport = await createSport()
      const match = await createMatch(challenger.id, opponent.id, venue.id, sport.id, 'in_progress')

      mockGetSession.mockResolvedValue({ user: { id: challenger.id } })

      const formData = new FormData()

      const request = new Request(`http://localhost/api/challenges/1v1/${match.id}/upload`, {
        method: 'POST',
        body: formData,
      })

      const response = await POST_UPLOAD(request, {
        params: Promise.resolve({ matchId: match.id }),
      })

      expect(response.status).toBe(400)
    })

    it('should upload video successfully', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const challenger = await createUser('challenger@test.com', 'Challenger', city.id)
      const opponent = await createUser('opponent@test.com', 'Opponent', city.id)
      const venue = await createVenue('Test Venue', city.id)
      const sport = await createSport()
      const match = await createMatch(challenger.id, opponent.id, venue.id, sport.id, 'in_progress')

      mockGetSession.mockResolvedValue({ user: { id: challenger.id } })

      const formData = new FormData()
      formData.append('video', new Blob(['test video content'], { type: 'video/mp4' }), 'test.mp4')

      const request = new Request(`http://localhost/api/challenges/1v1/${match.id}/upload`, {
        method: 'POST',
        body: formData,
      })

      const response = await POST_UPLOAD(request, {
        params: Promise.resolve({ matchId: match.id }),
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.status).toBe('analyzing')
      expect(data.videoUrl).toBeDefined()
    })
  })

  describe('GET /api/challenges/1v1/[matchId]/results', () => {
    it('should return 401 when not authenticated', async () => {
      mockGetSession.mockResolvedValue(null)

      const request = new Request('http://localhost/api/challenges/1v1/test-id/results')
      const response = await GET_RESULTS(request, {
        params: Promise.resolve({ matchId: 'test-id' }),
      })

      expect(response.status).toBe(401)
    })

    it('should handle non-existent match', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const user = await createUser('user@test.com', 'User', city.id)

      mockGetSession.mockResolvedValue({ user: { id: user.id } })

      const request = new Request('http://localhost/api/challenges/1v1/non-existent/results')
      const response = await GET_RESULTS(request, {
        params: Promise.resolve({ matchId: 'non-existent' }),
      })

      // Should return 404 or 500 depending on implementation
      expect([404, 500]).toContain(response.status)
    })

    it('should return 403 for non-participant', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const challenger = await createUser('challenger@test.com', 'Challenger', city.id)
      const opponent = await createUser('opponent@test.com', 'Opponent', city.id)
      const randomUser = await createUser('random@test.com', 'Random', city.id)
      const venue = await createVenue('Test Venue', city.id)
      const sport = await createSport()
      const match = await createMatch(challenger.id, opponent.id, venue.id, sport.id, 'completed')

      mockGetSession.mockResolvedValue({ user: { id: randomUser.id } })

      const request = new Request(`http://localhost/api/challenges/1v1/${match.id}/results`)
      const response = await GET_RESULTS(request, {
        params: Promise.resolve({ matchId: match.id }),
      })

      expect(response.status).toBe(403)
    })

    it('should return results for completed match', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const challenger = await createUser('challenger@test.com', 'Challenger', city.id)
      const opponent = await createUser('opponent@test.com', 'Opponent', city.id)
      const venue = await createVenue('Test Venue', city.id)
      const sport = await createSport()

      const [match] = await testDb
        .insert(matches)
        .values({
          player1Id: challenger.id,
          player2Id: opponent.id,
          venueId: venue.id,
          sportId: sport.id,
          status: 'completed',
          player1Score: 12,
          player2Score: 10,
          winnerId: challenger.id,
        })
        .returning()

      mockGetSession.mockResolvedValue({ user: { id: challenger.id } })

      const request = new Request(`http://localhost/api/challenges/1v1/${match.id}/results`)
      const response = await GET_RESULTS(request, {
        params: Promise.resolve({ matchId: match.id }),
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.analyzing).toBe(false)
      expect(data.result).toBeDefined()
      expect(data.result.isWinner).toBe(true)
      expect(data.result.userScore).toBe(12)
      expect(data.result.opponentScore).toBe(10)
    })

    it('should return analyzing status for in-progress match', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const challenger = await createUser('challenger@test.com', 'Challenger', city.id)
      const opponent = await createUser('opponent@test.com', 'Opponent', city.id)
      const venue = await createVenue('Test Venue', city.id)
      const sport = await createSport()
      const match = await createMatch(challenger.id, opponent.id, venue.id, sport.id, 'analyzing')

      mockGetSession.mockResolvedValue({ user: { id: challenger.id } })

      const request = new Request(`http://localhost/api/challenges/1v1/${match.id}/results`)
      const response = await GET_RESULTS(request, {
        params: Promise.resolve({ matchId: match.id }),
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.analyzing).toBe(true)
    })
  })

  describe('POST /api/challenges/1v1/[matchId]/agree', () => {
    it('should record agreement', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const challenger = await createUser('challenger@test.com', 'Challenger', city.id)
      const opponent = await createUser('opponent@test.com', 'Opponent', city.id)
      const venue = await createVenue('Test Venue', city.id)
      const sport = await createSport()

      // Create completed match with scores
      const [match] = await testDb
        .insert(matches)
        .values({
          player1Id: challenger.id,
          player2Id: opponent.id,
          venueId: venue.id,
          sportId: sport.id,
          status: 'completed',
          player1Score: 12,
          player2Score: 10,
          winnerId: challenger.id,
        })
        .returning()

      mockGetSession.mockResolvedValue({ user: { id: challenger.id } })

      const request = new Request(`http://localhost/api/challenges/1v1/${match.id}/agree`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agree: true }),
      })

      const response = await POST_AGREE(request, { params: Promise.resolve({ matchId: match.id }) })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
    })

    it('should handle dispute', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const challenger = await createUser('challenger@test.com', 'Challenger', city.id)
      const opponent = await createUser('opponent@test.com', 'Opponent', city.id)
      const venue = await createVenue('Test Venue', city.id)
      const sport = await createSport()

      const [match] = await testDb
        .insert(matches)
        .values({
          player1Id: challenger.id,
          player2Id: opponent.id,
          venueId: venue.id,
          sportId: sport.id,
          status: 'completed',
          player1Score: 12,
          player2Score: 10,
          winnerId: challenger.id,
        })
        .returning()

      mockGetSession.mockResolvedValue({ user: { id: opponent.id } })

      const request = new Request(`http://localhost/api/challenges/1v1/${match.id}/agree`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agree: false }),
      })

      const response = await POST_AGREE(request, { params: Promise.resolve({ matchId: match.id }) })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.status).toBe('disputed')
    })
  })
})
