import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import { createTestDb, closeTestDb, clearTestDb, type TestDatabase } from '@/db/test-utils'
import { users, avatars, sports, playerStats } from '@/db/schema'

// Mock getSession before importing the route handler
const mockGetSession = vi.fn()

vi.mock('@/lib/auth', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/auth')>()
  return {
    ...original,
    getSession: () => mockGetSession(),
  }
})

// Mock getDb to use test database
let testDb: TestDatabase

vi.mock('@/db', () => ({
  getDb: () => testDb,
}))

// Import route handlers after mocking
import { GET } from '@/app/api/players/[userId]/trump-card/route'
import { GET as GET_ME } from '@/app/api/players/me/trump-card/route'

describe('Trump Card API Integration Tests', () => {
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

  // Helper to create test user
  async function createTestUser(email = 'test@example.com', name = 'Test Player') {
    const [user] = await testDb
      .insert(users)
      .values({ email, name, hasCreatedAvatar: true })
      .returning()
    return user
  }

  // Helper to create avatar
  async function createAvatar(userId: string) {
    const [avatar] = await testDb
      .insert(avatars)
      .values({
        userId,
        skinTone: 'medium',
        hairStyle: 'short',
        hairColor: 'black',
      })
      .returning()
    return avatar
  }

  // Helper to create basketball sport
  async function createBasketballSport() {
    const [sport] = await testDb
      .insert(sports)
      .values({ name: 'Basketball', slug: 'basketball', isActive: true })
      .returning()
    return sport
  }

  // Helper to create player stats
  async function createPlayerStats(userId: string, sportId: string, stats = {}) {
    const defaultStats = {
      totalXp: 100,
      totalRp: 50,
      availableRp: 50,
      matchesPlayed: 10,
      matchesWon: 3,
      matchesLost: 7,
      challengesCompleted: 5,
      totalPointsScored: 500,
      threePointMade: 10,
      threePointAttempted: 25,
      freeThrowMade: 15,
      freeThrowAttempted: 20,
      ...stats,
    }

    const [playerStat] = await testDb
      .insert(playerStats)
      .values({
        userId,
        sportId,
        ...defaultStats,
      })
      .returning()
    return playerStat
  }

  describe('GET /api/players/[userId]/trump-card', () => {
    it('should return 401 when not authenticated', async () => {
      mockGetSession.mockResolvedValue(null)

      const response = await GET(new Request('http://localhost/api/players/123/trump-card'), {
        params: Promise.resolve({ userId: '123' }),
      })

      expect(response.status).toBe(401)
    })

    it('should return 400 for invalid UUID format', async () => {
      const user = await createTestUser()
      mockGetSession.mockResolvedValue({ user: { id: user.id, email: user.email } })

      const response = await GET(
        new Request('http://localhost/api/players/invalid-id/trump-card'),
        { params: Promise.resolve({ userId: 'invalid-id' }) }
      )

      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.error).toBe('Invalid user ID format')
    })

    it('should return 404 for non-existent player', async () => {
      const user = await createTestUser()
      mockGetSession.mockResolvedValue({ user: { id: user.id, email: user.email } })

      const fakeUserId = '00000000-0000-0000-0000-000000000000'
      const response = await GET(
        new Request(`http://localhost/api/players/${fakeUserId}/trump-card`),
        { params: Promise.resolve({ userId: fakeUserId }) }
      )

      expect(response.status).toBe(404)
      const body = await response.json()
      expect(body.error).toBe('Player not found')
    })

    it('should return trump card data for valid player', async () => {
      const user = await createTestUser()
      await createAvatar(user.id)
      const sport = await createBasketballSport()
      await createPlayerStats(user.id, sport.id)

      mockGetSession.mockResolvedValue({ user: { id: user.id, email: user.email } })

      const response = await GET(
        new Request(`http://localhost/api/players/${user.id}/trump-card`),
        { params: Promise.resolve({ userId: user.id }) }
      )

      expect(response.status).toBe(200)
      const body = await response.json()

      expect(body.player.id).toBe(user.id)
      expect(body.player.name).toBe('Test Player')
      expect(body.player.avatar).toBeDefined()
      expect(body.stats.xp).toBe(100)
      expect(body.stats.rp).toBe(50)
      expect(body.stats.matchesPlayed).toBe(10)
      expect(body.stats.winRate).toBe(30) // 3/10 = 30%
    })

    it('should return correct rank', async () => {
      const user1 = await createTestUser('user1@test.com', 'User 1')
      const user2 = await createTestUser('user2@test.com', 'User 2')
      const sport = await createBasketballSport()

      // User1 has more XP, should be rank 1
      await createPlayerStats(user1.id, sport.id, { totalXp: 500 })
      // User2 has less XP, should be rank 2
      await createPlayerStats(user2.id, sport.id, { totalXp: 100 })

      mockGetSession.mockResolvedValue({ user: { id: user1.id, email: user1.email } })

      // Check user1's rank (should be 1)
      const response1 = await GET(
        new Request(`http://localhost/api/players/${user1.id}/trump-card`),
        { params: Promise.resolve({ userId: user1.id }) }
      )
      const body1 = await response1.json()
      expect(body1.stats.rank).toBe(1)
      expect(body1.crowns.isKingOfCourt).toBe(true)

      // Check user2's rank (should be 2)
      const response2 = await GET(
        new Request(`http://localhost/api/players/${user2.id}/trump-card`),
        { params: Promise.resolve({ userId: user2.id }) }
      )
      const body2 = await response2.json()
      expect(body2.stats.rank).toBe(2)
      expect(body2.crowns.isKingOfCourt).toBe(false)
    })

    it('should calculate accuracies correctly', async () => {
      const user = await createTestUser()
      const sport = await createBasketballSport()
      await createPlayerStats(user.id, sport.id, {
        threePointMade: 10,
        threePointAttempted: 20, // 50%
        freeThrowMade: 18,
        freeThrowAttempted: 20, // 90%
      })

      mockGetSession.mockResolvedValue({ user: { id: user.id, email: user.email } })

      const response = await GET(
        new Request(`http://localhost/api/players/${user.id}/trump-card`),
        { params: Promise.resolve({ userId: user.id }) }
      )
      const body = await response.json()

      expect(body.detailedStats.threePointAccuracy).toBe(50)
      expect(body.detailedStats.freeThrowAccuracy).toBe(90)
    })

    it('should return empty stats for player without stats', async () => {
      const user = await createTestUser()
      await createBasketballSport()

      mockGetSession.mockResolvedValue({ user: { id: user.id, email: user.email } })

      const response = await GET(
        new Request(`http://localhost/api/players/${user.id}/trump-card`),
        { params: Promise.resolve({ userId: user.id }) }
      )
      const body = await response.json()

      expect(body.stats.xp).toBe(0)
      expect(body.stats.rp).toBe(0)
      expect(body.stats.winRate).toBe(0)
      expect(body.stats.rank).toBe(0)
    })
  })

  describe('GET /api/players/me/trump-card', () => {
    it('should return 401 when not authenticated', async () => {
      mockGetSession.mockResolvedValue(null)

      const response = await GET_ME(new Request('http://localhost/api/players/me/trump-card'))

      expect(response.status).toBe(401)
    })

    it('should return current user trump card', async () => {
      const user = await createTestUser()
      await createAvatar(user.id)
      const sport = await createBasketballSport()
      await createPlayerStats(user.id, sport.id, { totalXp: 200, availableRp: 100 })

      mockGetSession.mockResolvedValue({ user: { id: user.id, email: user.email } })

      const response = await GET_ME(new Request('http://localhost/api/players/me/trump-card'))

      expect(response.status).toBe(200)
      const body = await response.json()

      expect(body.player.id).toBe(user.id)
      expect(body.stats.xp).toBe(200)
      expect(body.stats.rp).toBe(100)
    })

    it('should support sport query parameter', async () => {
      const user = await createTestUser()
      const sport = await createBasketballSport()
      await createPlayerStats(user.id, sport.id)

      mockGetSession.mockResolvedValue({ user: { id: user.id, email: user.email } })

      const response = await GET_ME(
        new Request('http://localhost/api/players/me/trump-card?sport=basketball')
      )

      expect(response.status).toBe(200)
    })
  })
})
