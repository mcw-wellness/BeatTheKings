import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import { createTestDb, closeTestDb, clearTestDb, type TestDatabase } from '@/db/test-utils'
import { users, venues, cities, countries, activePlayers, challenges, sports } from '@/db/schema'

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
import { GET } from '@/app/api/venues/route'
import { GET as GET_VENUE } from '@/app/api/venues/[id]/route'
import { POST as CHECK_IN, DELETE as CHECK_OUT } from '@/app/api/venues/[id]/check-in/route'

describe('Venues API Integration Tests', () => {
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
      .values({ email, name, cityId, hasCreatedAvatar: true })
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

  async function createChallenge(venueId: string, sportId: string, name: string) {
    const [challenge] = await testDb
      .insert(challenges)
      .values({
        venueId,
        sportId,
        name,
        description: 'Test challenge',
        instructions: 'Do the thing',
        challengeType: 'test',
        xpReward: 50,
        rpReward: 10,
        difficulty: 'medium',
        isActive: true,
      })
      .returning()
    return challenge
  }

  async function createActivePlayer(userId: string, venueId: string) {
    const [active] = await testDb
      .insert(activePlayers)
      .values({
        userId,
        venueId,
        latitude: 48.2082,
        longitude: 16.3738,
        lastSeenAt: new Date(),
      })
      .returning()
    return active
  }

  describe('GET /api/venues', () => {
    it('should return 401 when not authenticated', async () => {
      mockGetSession.mockResolvedValue(null)

      const response = await GET(new Request('http://localhost/api/venues'))

      expect(response.status).toBe(401)
    })

    it('should return list of venues', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const user = await createUser('test@test.com', 'Test', city.id)

      await createVenue('Esterhazy Park', city.id)
      await createVenue('Schönborn Park', city.id)

      mockGetSession.mockResolvedValue({ user: { id: user.id, email: user.email } })

      const response = await GET(new Request('http://localhost/api/venues'))

      expect(response.status).toBe(200)
      const body = await response.json()

      expect(body.venues).toHaveLength(2)
      expect(body.totalVenues).toBe(2)
    })

    it('should sort venues by distance when location provided', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const user = await createUser('test@test.com', 'Test', city.id)

      // User is at lat=48.20, lng=16.37
      // Venue 1 is closer (48.21, 16.37) - ~1.1km
      // Venue 2 is farther (48.25, 16.40) - ~6km
      await createVenue('Close Venue', city.id, 48.21, 16.37)
      await createVenue('Far Venue', city.id, 48.25, 16.4)

      mockGetSession.mockResolvedValue({ user: { id: user.id, email: user.email } })

      const response = await GET(new Request('http://localhost/api/venues?lat=48.20&lng=16.37'))

      expect(response.status).toBe(200)
      const body = await response.json()

      expect(body.venues).toHaveLength(2)
      expect(body.venues[0].name).toBe('Close Venue')
      expect(body.venues[1].name).toBe('Far Venue')
      expect(body.venues[0].distance).toBeLessThan(body.venues[1].distance)
    })

    it('should include active player count', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const user = await createUser('test@test.com', 'Test', city.id)
      const user2 = await createUser('test2@test.com', 'Test2', city.id)

      const venue = await createVenue('Esterhazy Park', city.id)

      // Add active players
      await createActivePlayer(user.id, venue.id)
      await createActivePlayer(user2.id, venue.id)

      mockGetSession.mockResolvedValue({ user: { id: user.id, email: user.email } })

      const response = await GET(new Request('http://localhost/api/venues'))

      expect(response.status).toBe(200)
      const body = await response.json()

      expect(body.venues[0].activePlayerCount).toBe(2)
    })

    it('should include challenge count', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const user = await createUser('test@test.com', 'Test', city.id)
      const sport = await createSport()

      const venue = await createVenue('Esterhazy Park', city.id)

      // Add challenges
      await createChallenge(venue.id, sport.id, '3-Point Shot')
      await createChallenge(venue.id, sport.id, 'Free Throw')

      mockGetSession.mockResolvedValue({ user: { id: user.id, email: user.email } })

      const response = await GET(new Request('http://localhost/api/venues'))

      expect(response.status).toBe(200)
      const body = await response.json()

      expect(body.venues[0].challengeCount).toBe(2)
    })

    it('should filter by city', async () => {
      const country = await createCountry()
      const city1 = await createCity('Vienna', country.id)
      const city2 = await createCity('Salzburg', country.id)
      const user = await createUser('test@test.com', 'Test', city1.id)

      await createVenue('Vienna Park', city1.id)
      await createVenue('Salzburg Park', city2.id)

      mockGetSession.mockResolvedValue({ user: { id: user.id, email: user.email } })

      const response = await GET(new Request(`http://localhost/api/venues?cityId=${city1.id}`))

      expect(response.status).toBe(200)
      const body = await response.json()

      expect(body.venues).toHaveLength(1)
      expect(body.venues[0].name).toBe('Vienna Park')
    })
  })

  describe('GET /api/venues/:id', () => {
    it('should return 401 when not authenticated', async () => {
      mockGetSession.mockResolvedValue(null)

      const response = await GET_VENUE(new Request('http://localhost/api/venues/123'), {
        params: Promise.resolve({ id: '123' }),
      })

      expect(response.status).toBe(401)
    })

    it('should return 404 for non-existent venue', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const user = await createUser('test@test.com', 'Test', city.id)

      mockGetSession.mockResolvedValue({ user: { id: user.id, email: user.email } })

      const response = await GET_VENUE(
        new Request('http://localhost/api/venues/00000000-0000-0000-0000-000000000000'),
        { params: Promise.resolve({ id: '00000000-0000-0000-0000-000000000000' }) }
      )

      expect(response.status).toBe(404)
    })

    it('should return venue details with challenges', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const user = await createUser('test@test.com', 'Test', city.id)
      const sport = await createSport()

      const venue = await createVenue('Esterhazy Park', city.id, 48.2082, 16.3738)
      await createChallenge(venue.id, sport.id, '3-Point Shot')

      mockGetSession.mockResolvedValue({ user: { id: user.id, email: user.email } })

      const response = await GET_VENUE(new Request('http://localhost/api/venues/' + venue.id), {
        params: Promise.resolve({ id: venue.id }),
      })

      expect(response.status).toBe(200)
      const body = await response.json()

      expect(body.venue.name).toBe('Esterhazy Park')
      expect(body.challenges).toHaveLength(1)
      expect(body.challenges[0].name).toBe('3-Point Shot')
    })

    it('should return active players', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const user = await createUser('test@test.com', 'Test', city.id)
      const user2 = await createUser('test2@test.com', 'Test2', city.id)

      const venue = await createVenue('Esterhazy Park', city.id)
      await createActivePlayer(user2.id, venue.id)

      mockGetSession.mockResolvedValue({ user: { id: user.id, email: user.email } })

      const response = await GET_VENUE(new Request('http://localhost/api/venues/' + venue.id), {
        params: Promise.resolve({ id: venue.id }),
      })

      expect(response.status).toBe(200)
      const body = await response.json()

      expect(body.activePlayers).toHaveLength(1)
    })
  })

  describe('POST /api/venues/:id/check-in', () => {
    it('should return 401 when not authenticated', async () => {
      mockGetSession.mockResolvedValue(null)

      const response = await CHECK_IN(
        new Request('http://localhost/api/venues/123/check-in', {
          method: 'POST',
          body: JSON.stringify({ latitude: 48.2082, longitude: 16.3738 }),
        }),
        { params: Promise.resolve({ id: '123' }) }
      )

      expect(response.status).toBe(401)
    })

    it('should return 400 for missing coordinates', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const user = await createUser('test@test.com', 'Test', city.id)

      mockGetSession.mockResolvedValue({ user: { id: user.id, email: user.email } })

      const response = await CHECK_IN(
        new Request('http://localhost/api/venues/123/check-in', {
          method: 'POST',
          body: JSON.stringify({}),
        }),
        { params: Promise.resolve({ id: '123' }) }
      )

      expect(response.status).toBe(400)
    })

    it('should check in user to venue', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const user = await createUser('test@test.com', 'Test', city.id)
      const venue = await createVenue('Esterhazy Park', city.id)

      mockGetSession.mockResolvedValue({ user: { id: user.id, email: user.email } })

      const response = await CHECK_IN(
        new Request('http://localhost/api/venues/' + venue.id + '/check-in', {
          method: 'POST',
          body: JSON.stringify({ latitude: 48.2082, longitude: 16.3738 }),
        }),
        { params: Promise.resolve({ id: venue.id }) }
      )

      expect(response.status).toBe(200)
      const body = await response.json()

      expect(body.success).toBe(true)
      expect(body.message).toContain('Esterhazy Park')
    })

    it('should update check-in if already checked in', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const user = await createUser('test@test.com', 'Test', city.id)
      const venue = await createVenue('Esterhazy Park', city.id)

      // First check-in
      await createActivePlayer(user.id, venue.id)

      mockGetSession.mockResolvedValue({ user: { id: user.id, email: user.email } })

      // Second check-in should update
      const response = await CHECK_IN(
        new Request('http://localhost/api/venues/' + venue.id + '/check-in', {
          method: 'POST',
          body: JSON.stringify({ latitude: 48.21, longitude: 16.38 }),
        }),
        { params: Promise.resolve({ id: venue.id }) }
      )

      expect(response.status).toBe(200)
    })
  })

  describe('DELETE /api/venues/:id/check-in', () => {
    it('should check out user from venue', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const user = await createUser('test@test.com', 'Test', city.id)
      const venue = await createVenue('Esterhazy Park', city.id)

      await createActivePlayer(user.id, venue.id)

      mockGetSession.mockResolvedValue({ user: { id: user.id, email: user.email } })

      const response = await CHECK_OUT(
        new Request('http://localhost/api/venues/' + venue.id + '/check-in', {
          method: 'DELETE',
        }),
        { params: Promise.resolve({ id: venue.id }) }
      )

      expect(response.status).toBe(200)
      const body = await response.json()

      expect(body.success).toBe(true)
    })
  })
})
