/**
 * Item Unlock API Integration Tests
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import { createTestDb, closeTestDb, clearTestDb, type TestDatabase } from '@/db/test-utils'
import {
  users,
  avatarItems,
  userUnlockedItems,
  playerStats,
  sports,
  cities,
  countries,
} from '@/db/schema'
import { eq } from 'drizzle-orm'

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
import { GET as GET_ITEMS } from '@/app/api/items/route'
import { POST as POST_UNLOCK } from '@/app/api/items/[itemId]/unlock/route'
import { POST as POST_CHECK_UNLOCKS } from '@/app/api/items/check-unlocks/route'

function createMockRequest(url: string = 'http://localhost/api/items'): NextRequest {
  return new NextRequest(url)
}

describe('Item Unlock API Integration Tests', () => {
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

  async function createSport(name = 'Basketball', slug = 'basketball') {
    const [sport] = await testDb.insert(sports).values({ name, slug, isActive: true }).returning()
    return sport
  }

  async function createItem(overrides: Partial<typeof avatarItems.$inferInsert> = {}) {
    const [item] = await testDb
      .insert(avatarItems)
      .values({
        name: 'Test Jersey',
        itemType: 'jersey',
        isDefault: false,
        isActive: true,
        ...overrides,
      })
      .returning()
    return item
  }

  async function createPlayerStats(
    userId: string,
    sportId: string,
    overrides: Partial<typeof playerStats.$inferInsert> = {}
  ) {
    const [stats] = await testDb
      .insert(playerStats)
      .values({
        userId,
        sportId,
        totalXp: 0,
        totalRp: 0,
        availableRp: 0,
        matchesPlayed: 0,
        matchesWon: 0,
        matchesLost: 0,
        challengesCompleted: 0,
        totalPointsScored: 0,
        usersInvited: 0,
        ...overrides,
      })
      .returning()
    return stats
  }

  describe('GET /api/items', () => {
    it('should return 401 when not authenticated', async () => {
      mockGetSession.mockResolvedValue(null)

      const response = await GET_ITEMS(createMockRequest())

      expect(response.status).toBe(401)
    })

    it('should return empty items list when no items exist', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const user = await createUser('test@test.com', 'Test', city.id)

      mockGetSession.mockResolvedValue({ user: { id: user.id, email: user.email } })

      const response = await GET_ITEMS(createMockRequest())

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.items).toHaveLength(0)
    })

    it('should return items with unlock status', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const user = await createUser('test@test.com', 'Test', city.id)
      const sport = await createSport()

      // Create items
      const defaultItem = await createItem({ name: 'Default Jersey', isDefault: true })
      await createItem({ name: 'Pro Jersey', requiredMatches: 10 })

      // Create stats
      await createPlayerStats(user.id, sport.id, { matchesPlayed: 5 })

      // Unlock default item
      await testDb.insert(userUnlockedItems).values({
        userId: user.id,
        itemId: defaultItem.id,
        unlockedVia: 'default',
      })

      mockGetSession.mockResolvedValue({ user: { id: user.id, email: user.email } })

      const response = await GET_ITEMS(createMockRequest())

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.items).toHaveLength(2)

      const returnedDefault = body.items.find((i: { name: string }) => i.name === 'Default Jersey')
      const returnedLocked = body.items.find((i: { name: string }) => i.name === 'Pro Jersey')

      expect(returnedDefault.isUnlocked).toBe(true)
      expect(returnedDefault.unlockedVia).toBe('default')

      expect(returnedLocked.isUnlocked).toBe(false)
      expect(returnedLocked.canUnlock).toBe(false) // Only 5/10 matches
      expect(returnedLocked.progress.matches).toEqual({ current: 5, required: 10 })
    })

    it('should show canUnlock=true when requirements met', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const user = await createUser('test@test.com', 'Test', city.id)
      const sport = await createSport()

      await createItem({ requiredMatches: 10 })
      await createPlayerStats(user.id, sport.id, { matchesPlayed: 15 })

      mockGetSession.mockResolvedValue({ user: { id: user.id, email: user.email } })

      const response = await GET_ITEMS(createMockRequest())

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.items[0].canUnlock).toBe(true)
    })

    it('should show canPurchase=true when enough RP', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const user = await createUser('test@test.com', 'Test', city.id)
      const sport = await createSport()

      await createItem({ rpCost: 50 })
      await createPlayerStats(user.id, sport.id, { availableRp: 100 })

      mockGetSession.mockResolvedValue({ user: { id: user.id, email: user.email } })

      const response = await GET_ITEMS(createMockRequest())

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.items[0].canPurchase).toBe(true)
    })
  })

  describe('POST /api/items/[itemId]/unlock', () => {
    it('should return 401 when not authenticated', async () => {
      mockGetSession.mockResolvedValue(null)

      const response = await POST_UNLOCK(
        new Request('http://localhost/api/items/123/unlock', {
          method: 'POST',
          body: JSON.stringify({ method: 'achievement' }),
        }),
        { params: Promise.resolve({ itemId: '123' }) }
      )

      expect(response.status).toBe(401)
    })

    it('should return 400 for invalid method', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const user = await createUser('test@test.com', 'Test', city.id)

      mockGetSession.mockResolvedValue({ user: { id: user.id, email: user.email } })

      const response = await POST_UNLOCK(
        new Request('http://localhost/api/items/123/unlock', {
          method: 'POST',
          body: JSON.stringify({ method: 'invalid' }),
        }),
        { params: Promise.resolve({ itemId: '123' }) }
      )

      expect(response.status).toBe(400)
    })

    it('should return 400 when item not found', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const user = await createUser('test@test.com', 'Test', city.id)

      mockGetSession.mockResolvedValue({ user: { id: user.id, email: user.email } })

      const response = await POST_UNLOCK(
        new Request('http://localhost/api/items/00000000-0000-0000-0000-000000000000/unlock', {
          method: 'POST',
          body: JSON.stringify({ method: 'achievement' }),
        }),
        { params: Promise.resolve({ itemId: '00000000-0000-0000-0000-000000000000' }) }
      )

      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.error).toContain('not found')
    })

    it('should unlock item via achievement when requirements met', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const user = await createUser('test@test.com', 'Test', city.id)
      const sport = await createSport()

      const item = await createItem({ requiredMatches: 10 })
      await createPlayerStats(user.id, sport.id, { matchesPlayed: 15 })

      mockGetSession.mockResolvedValue({ user: { id: user.id, email: user.email } })

      const response = await POST_UNLOCK(
        new Request(`http://localhost/api/items/${item.id}/unlock`, {
          method: 'POST',
          body: JSON.stringify({ method: 'achievement' }),
        }),
        { params: Promise.resolve({ itemId: item.id }) }
      )

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.success).toBe(true)
      expect(body.unlockedItem.id).toBe(item.id)

      // Verify item is unlocked in DB
      const [unlocked] = await testDb
        .select()
        .from(userUnlockedItems)
        .where(eq(userUnlockedItems.userId, user.id))

      expect(unlocked.itemId).toBe(item.id)
      expect(unlocked.unlockedVia).toBe('achievement')
    })

    it('should return 400 when requirements not met', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const user = await createUser('test@test.com', 'Test', city.id)
      const sport = await createSport()

      const item = await createItem({ requiredMatches: 10 })
      await createPlayerStats(user.id, sport.id, { matchesPlayed: 5 }) // Not enough

      mockGetSession.mockResolvedValue({ user: { id: user.id, email: user.email } })

      const response = await POST_UNLOCK(
        new Request(`http://localhost/api/items/${item.id}/unlock`, {
          method: 'POST',
          body: JSON.stringify({ method: 'achievement' }),
        }),
        { params: Promise.resolve({ itemId: item.id }) }
      )

      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.error).toContain('Requirements not met')
    })

    it('should unlock item via purchase and deduct RP', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const user = await createUser('test@test.com', 'Test', city.id)
      const sport = await createSport()

      const item = await createItem({ rpCost: 50 })
      await createPlayerStats(user.id, sport.id, { availableRp: 100 })

      mockGetSession.mockResolvedValue({ user: { id: user.id, email: user.email } })

      const response = await POST_UNLOCK(
        new Request(`http://localhost/api/items/${item.id}/unlock`, {
          method: 'POST',
          body: JSON.stringify({ method: 'purchase' }),
        }),
        { params: Promise.resolve({ itemId: item.id }) }
      )

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.success).toBe(true)
      expect(body.remainingRp).toBe(50) // 100 - 50
    })

    it('should return 400 for insufficient RP', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const user = await createUser('test@test.com', 'Test', city.id)
      const sport = await createSport()

      const item = await createItem({ rpCost: 50 })
      await createPlayerStats(user.id, sport.id, { availableRp: 30 }) // Not enough

      mockGetSession.mockResolvedValue({ user: { id: user.id, email: user.email } })

      const response = await POST_UNLOCK(
        new Request(`http://localhost/api/items/${item.id}/unlock`, {
          method: 'POST',
          body: JSON.stringify({ method: 'purchase' }),
        }),
        { params: Promise.resolve({ itemId: item.id }) }
      )

      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.error).toContain('Insufficient RP')
    })

    it('should return 400 for already unlocked item', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const user = await createUser('test@test.com', 'Test', city.id)
      const sport = await createSport()

      const item = await createItem({ requiredMatches: 10 })
      await createPlayerStats(user.id, sport.id, { matchesPlayed: 15 })

      // Already unlocked
      await testDb.insert(userUnlockedItems).values({
        userId: user.id,
        itemId: item.id,
        unlockedVia: 'achievement',
      })

      mockGetSession.mockResolvedValue({ user: { id: user.id, email: user.email } })

      const response = await POST_UNLOCK(
        new Request(`http://localhost/api/items/${item.id}/unlock`, {
          method: 'POST',
          body: JSON.stringify({ method: 'achievement' }),
        }),
        { params: Promise.resolve({ itemId: item.id }) }
      )

      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.error).toContain('already unlocked')
    })
  })

  describe('POST /api/items/check-unlocks', () => {
    it('should return 401 when not authenticated', async () => {
      mockGetSession.mockResolvedValue(null)

      const response = await POST_CHECK_UNLOCKS(
        createMockRequest('http://localhost/api/items/check-unlocks')
      )

      expect(response.status).toBe(401)
    })

    it('should auto-unlock eligible items', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const user = await createUser('test@test.com', 'Test', city.id)
      const sport = await createSport()

      // Create items with different requirements
      await createItem({ name: 'Item 1', requiredMatches: 5 })
      await createItem({ name: 'Item 2', requiredMatches: 10 })
      await createItem({ name: 'Item 3', requiredChallenges: 5 })

      // User has 7 matches and 5 challenges - should unlock item1 and item3
      await createPlayerStats(user.id, sport.id, {
        matchesPlayed: 7,
        challengesCompleted: 5,
      })

      mockGetSession.mockResolvedValue({ user: { id: user.id, email: user.email } })

      const response = await POST_CHECK_UNLOCKS(
        new NextRequest('http://localhost/api/items/check-unlocks')
      )

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.newlyUnlocked).toHaveLength(2)

      const unlockedNames = body.newlyUnlocked.map((i: { name: string }) => i.name)
      expect(unlockedNames).toContain('Item 1')
      expect(unlockedNames).toContain('Item 3')
      expect(unlockedNames).not.toContain('Item 2')
    })

    it('should return empty array when no items to unlock', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const user = await createUser('test@test.com', 'Test', city.id)
      const sport = await createSport()

      await createItem({ requiredMatches: 10 })
      await createPlayerStats(user.id, sport.id, { matchesPlayed: 5 }) // Not enough

      mockGetSession.mockResolvedValue({ user: { id: user.id, email: user.email } })

      const response = await POST_CHECK_UNLOCKS(
        new NextRequest('http://localhost/api/items/check-unlocks')
      )

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.newlyUnlocked).toHaveLength(0)
    })
  })
})
