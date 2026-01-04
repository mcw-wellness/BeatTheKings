import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import { createTestDb, closeTestDb, clearTestDb, type TestDatabase } from '@/db/test-utils'
import { users, sports, playerStats, cities, countries } from '@/db/schema'

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
import { GET } from '@/app/api/rankings/route'

describe('Rankings API Integration Tests', () => {
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

  async function createUser(
    email: string,
    name: string,
    cityId: string,
    ageGroup: string = '18-30'
  ) {
    const [user] = await testDb
      .insert(users)
      .values({ email, name, cityId, hasCreatedAvatar: true, ageGroup })
      .returning()
    return user
  }

  async function createSport(name = 'Basketball', slug = 'basketball') {
    const [sport] = await testDb.insert(sports).values({ name, slug, isActive: true }).returning()
    return sport
  }

  async function createPlayerStats(userId: string, sportId: string, xp: number) {
    const [stats] = await testDb
      .insert(playerStats)
      .values({
        userId,
        sportId,
        totalXp: xp,
        totalRp: 0,
        availableRp: 0,
        matchesPlayed: 0,
        matchesWon: 0,
        matchesLost: 0,
        challengesCompleted: 0,
        totalPointsScored: 0,
      })
      .returning()
    return stats
  }

  describe('GET /api/rankings', () => {
    it('should return 401 when not authenticated', async () => {
      mockGetSession.mockResolvedValue(null)

      const response = await GET(new Request('http://localhost/api/rankings'))

      expect(response.status).toBe(401)
    })

    it('should return 404 for invalid sport', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const user = await createUser('test@test.com', 'Test', city.id)

      mockGetSession.mockResolvedValue({ user: { id: user.id, email: user.email } })

      const response = await GET(new Request('http://localhost/api/rankings?sport=invalid'))

      expect(response.status).toBe(404)
      const body = await response.json()
      expect(body.error).toBe('Sport not found')
    })

    it('should return 400 for invalid level', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const user = await createUser('test@test.com', 'Test', city.id)
      await createSport()

      mockGetSession.mockResolvedValue({ user: { id: user.id, email: user.email } })

      const response = await GET(new Request('http://localhost/api/rankings?level=invalid'))

      expect(response.status).toBe(400)
    })

    it('should return city rankings sorted by XP', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const sport = await createSport()

      // Create users with different XP
      const user1 = await createUser('user1@test.com', 'Player 1', city.id)
      const user2 = await createUser('user2@test.com', 'Player 2', city.id)
      const user3 = await createUser('user3@test.com', 'Player 3', city.id)

      await createPlayerStats(user1.id, sport.id, 500) // King
      await createPlayerStats(user2.id, sport.id, 300)
      await createPlayerStats(user3.id, sport.id, 100)

      mockGetSession.mockResolvedValue({ user: { id: user3.id, email: user3.email } })

      const response = await GET(
        new Request(`http://localhost/api/rankings?level=city&cityId=${city.id}`)
      )

      expect(response.status).toBe(200)
      const body = await response.json()

      expect(body.level).toBe('city')
      expect(body.rankings).toHaveLength(3)
      expect(body.rankings[0].xp).toBe(500)
      expect(body.rankings[1].xp).toBe(300)
      expect(body.rankings[2].xp).toBe(100)
    })

    it('should identify king correctly', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const sport = await createSport()

      const king = await createUser('king@test.com', 'The King', city.id)
      const player = await createUser('player@test.com', 'Regular Player', city.id)

      await createPlayerStats(king.id, sport.id, 1000)
      await createPlayerStats(player.id, sport.id, 100)

      mockGetSession.mockResolvedValue({ user: { id: player.id, email: player.email } })

      const response = await GET(
        new Request(`http://localhost/api/rankings?level=city&cityId=${city.id}`)
      )

      expect(response.status).toBe(200)
      const body = await response.json()

      expect(body.king).not.toBeNull()
      expect(body.king.name).toBe('The King')
      expect(body.king.rank).toBe(1)
      expect(body.king.isKing).toBe(true)
    })

    it('should return current user rank', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const sport = await createSport()

      // Create 5 players
      for (let i = 1; i <= 4; i++) {
        const u = await createUser(`user${i}@test.com`, `Player ${i}`, city.id)
        await createPlayerStats(u.id, sport.id, 1000 - i * 100)
      }

      // Current user is last
      const currentUser = await createUser('me@test.com', 'Me', city.id)
      await createPlayerStats(currentUser.id, sport.id, 50)

      mockGetSession.mockResolvedValue({ user: { id: currentUser.id, email: currentUser.email } })

      const response = await GET(
        new Request(`http://localhost/api/rankings?level=city&cityId=${city.id}`)
      )

      expect(response.status).toBe(200)
      const body = await response.json()

      expect(body.currentUser).not.toBeNull()
      expect(body.currentUser.name).toBe('Me')
      expect(body.currentUser.rank).toBe(5)
      expect(body.currentUser.isKing).toBe(false)
    })

    it('should handle ties correctly', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const sport = await createSport()

      const user1 = await createUser('user1@test.com', 'Player 1', city.id)
      const user2 = await createUser('user2@test.com', 'Player 2', city.id)
      const user3 = await createUser('user3@test.com', 'Player 3', city.id)

      // Tie for first place
      await createPlayerStats(user1.id, sport.id, 500)
      await createPlayerStats(user2.id, sport.id, 500)
      await createPlayerStats(user3.id, sport.id, 300)

      mockGetSession.mockResolvedValue({ user: { id: user3.id, email: user3.email } })

      const response = await GET(
        new Request(`http://localhost/api/rankings?level=city&cityId=${city.id}`)
      )

      expect(response.status).toBe(200)
      const body = await response.json()

      // Both should be rank 1
      expect(body.rankings[0].rank).toBe(1)
      expect(body.rankings[1].rank).toBe(1)
      expect(body.rankings[2].rank).toBe(3) // Skips rank 2
    })

    it('should return country rankings', async () => {
      const country = await createCountry()
      const city1 = await createCity('Vienna', country.id)
      const city2 = await createCity('Salzburg', country.id)
      const sport = await createSport()

      const user1 = await createUser('user1@test.com', 'Vienna Player', city1.id)
      const user2 = await createUser('user2@test.com', 'Salzburg Player', city2.id)

      await createPlayerStats(user1.id, sport.id, 500)
      await createPlayerStats(user2.id, sport.id, 300)

      mockGetSession.mockResolvedValue({ user: { id: user1.id, email: user1.email } })

      const response = await GET(
        new Request(`http://localhost/api/rankings?level=country&countryId=${country.id}`)
      )

      expect(response.status).toBe(200)
      const body = await response.json()

      expect(body.level).toBe('country')
      expect(body.rankings).toHaveLength(2)
      expect(body.totalPlayers).toBe(2)
    })

    it('should limit results', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const sport = await createSport()

      // Create 15 players
      for (let i = 1; i <= 15; i++) {
        const u = await createUser(`user${i}@test.com`, `Player ${i}`, city.id)
        await createPlayerStats(u.id, sport.id, 1000 - i * 10)
      }

      const currentUser = await createUser('me@test.com', 'Me', city.id)
      await createPlayerStats(currentUser.id, sport.id, 1)

      mockGetSession.mockResolvedValue({ user: { id: currentUser.id, email: currentUser.email } })

      const response = await GET(
        new Request(`http://localhost/api/rankings?level=city&cityId=${city.id}&limit=5`)
      )

      expect(response.status).toBe(200)
      const body = await response.json()

      expect(body.rankings).toHaveLength(5)
      expect(body.totalPlayers).toBe(16)
    })

    it('should use user city by default', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const sport = await createSport()

      const user = await createUser('user@test.com', 'Player', city.id)
      await createPlayerStats(user.id, sport.id, 100)

      mockGetSession.mockResolvedValue({ user: { id: user.id, email: user.email } })

      // No cityId provided - should use user's city
      const response = await GET(new Request('http://localhost/api/rankings?level=city'))

      expect(response.status).toBe(200)
      const body = await response.json()

      expect(body.location.name).toBe('Vienna')
    })
  })
})
