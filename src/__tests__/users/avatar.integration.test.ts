import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import { createTestDb, closeTestDb, clearTestDb, type TestDatabase } from '@/db/test-utils'
import {
  users,
  avatars,
  sports,
  avatarItems,
  avatarEquipments,
  userUnlockedItems,
} from '@/db/schema'
import { eq } from 'drizzle-orm'

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
import { GET, POST, PUT } from '@/app/api/users/avatar/route'

describe('Avatar API Integration Tests', () => {
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
  async function createTestUser(email = 'test@example.com') {
    const [user] = await testDb.insert(users).values({ email, hasCreatedAvatar: false }).returning()
    return user
  }

  // Helper to create basketball sport
  async function createBasketballSport() {
    const [sport] = await testDb
      .insert(sports)
      .values({ name: 'Basketball', slug: 'basketball', isActive: true })
      .returning()
    return sport
  }

  // Helper to create default items
  async function createDefaultItems(sportId: string) {
    return testDb
      .insert(avatarItems)
      .values([
        {
          name: 'Default Jersey',
          itemType: 'jersey',
          sportId,
          imageUrl: '/items/jersey.png',
          isDefault: true,
        },
        {
          name: 'Default Shorts',
          itemType: 'shorts',
          sportId,
          imageUrl: '/items/shorts.png',
          isDefault: true,
        },
        {
          name: 'Default Shoes',
          itemType: 'shoes',
          sportId,
          imageUrl: '/items/shoes.png',
          isDefault: true,
        },
      ])
      .returning()
  }

  describe('GET /api/users/avatar', () => {
    it('should return 401 when not authenticated', async () => {
      mockGetSession.mockResolvedValue(null)

      const response = await GET()

      expect(response.status).toBe(401)
      const body = await response.json()
      expect(body.error).toBe('Unauthorized')
    })

    it('should return 404 when avatar not found', async () => {
      const user = await createTestUser()
      mockGetSession.mockResolvedValue({
        user: { id: user.id, email: user.email },
      })

      const response = await GET()

      expect(response.status).toBe(404)
      const body = await response.json()
      expect(body.error).toBe('Avatar not found')
    })

    it('should return avatar when found', async () => {
      const user = await createTestUser()
      await testDb.insert(avatars).values({
        userId: user.id,
        skinTone: 'medium',
        hairStyle: 'short',
        hairColor: 'black',
      })

      mockGetSession.mockResolvedValue({
        user: { id: user.id, email: user.email },
      })

      const response = await GET()

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.avatar.skinTone).toBe('medium')
      expect(body.avatar.hairStyle).toBe('short')
      expect(body.avatar.hairColor).toBe('black')
    })
  })

  describe('POST /api/users/avatar', () => {
    it('should return 401 when not authenticated', async () => {
      mockGetSession.mockResolvedValue(null)

      const request = new Request('http://localhost/api/users/avatar', {
        method: 'POST',
        body: JSON.stringify({
          skinTone: 'medium',
          hairStyle: 'short',
          hairColor: 'black',
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(401)
    })

    it('should return 400 for invalid JSON', async () => {
      const user = await createTestUser()
      mockGetSession.mockResolvedValue({
        user: { id: user.id, email: user.email },
      })

      const request = new Request('http://localhost/api/users/avatar', {
        method: 'POST',
        body: 'invalid json',
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.error).toBe('Invalid JSON body')
    })

    it('should return 400 for validation errors', async () => {
      const user = await createTestUser()
      mockGetSession.mockResolvedValue({
        user: { id: user.id, email: user.email },
      })

      const request = new Request('http://localhost/api/users/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skinTone: 'invalid',
          hairStyle: 'invalid',
          hairColor: 'invalid',
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.error).toBe('Validation failed')
      expect(body.details.skinTone).toBeDefined()
      expect(body.details.hairStyle).toBeDefined()
      expect(body.details.hairColor).toBeDefined()
    })

    it('should create avatar with valid data', async () => {
      const user = await createTestUser()
      mockGetSession.mockResolvedValue({
        user: { id: user.id, email: user.email },
      })

      const request = new Request('http://localhost/api/users/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skinTone: 'medium',
          hairStyle: 'short',
          hairColor: 'black',
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(201)
      const body = await response.json()
      expect(body.success).toBe(true)
      expect(body.avatar.skinTone).toBe('medium')
      expect(body.avatar.hairStyle).toBe('short')
      expect(body.avatar.hairColor).toBe('black')
      expect(body.redirectTo).toBe('/welcome')
    })

    it('should set hasCreatedAvatar to true after creation', async () => {
      const user = await createTestUser()
      mockGetSession.mockResolvedValue({
        user: { id: user.id, email: user.email },
      })

      const request = new Request('http://localhost/api/users/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skinTone: 'dark',
          hairStyle: 'afro',
          hairColor: 'black',
        }),
      })

      await POST(request)

      // Verify user was updated
      const [updatedUser] = await testDb.select().from(users).where(eq(users.id, user.id))
      expect(updatedUser.hasCreatedAvatar).toBe(true)
    })

    it('should return 409 if avatar already exists', async () => {
      const user = await createTestUser()
      await testDb.insert(avatars).values({
        userId: user.id,
        skinTone: 'medium',
        hairStyle: 'short',
        hairColor: 'black',
      })

      mockGetSession.mockResolvedValue({
        user: { id: user.id, email: user.email },
      })

      const request = new Request('http://localhost/api/users/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skinTone: 'dark',
          hairStyle: 'long',
          hairColor: 'brown',
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(409)
      const body = await response.json()
      expect(body.error).toContain('already exists')
    })

    it('should unlock default items on creation', async () => {
      const user = await createTestUser()
      const sport = await createBasketballSport()
      await createDefaultItems(sport.id)

      mockGetSession.mockResolvedValue({
        user: { id: user.id, email: user.email },
      })

      const request = new Request('http://localhost/api/users/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skinTone: 'medium',
          hairStyle: 'short',
          hairColor: 'black',
        }),
      })

      await POST(request)

      // Verify unlocked items
      const unlockedItems = await testDb
        .select()
        .from(userUnlockedItems)
        .where(eq(userUnlockedItems.userId, user.id))

      expect(unlockedItems.length).toBe(3)
      expect(unlockedItems.every((i) => i.unlockedVia === 'default')).toBe(true)
    })

    it('should create default equipment for basketball', async () => {
      const user = await createTestUser()
      const sport = await createBasketballSport()
      const defaultItems = await createDefaultItems(sport.id)

      mockGetSession.mockResolvedValue({
        user: { id: user.id, email: user.email },
      })

      const request = new Request('http://localhost/api/users/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skinTone: 'medium',
          hairStyle: 'short',
          hairColor: 'black',
        }),
      })

      await POST(request)

      // Get avatar
      const [avatar] = await testDb.select().from(avatars).where(eq(avatars.userId, user.id))

      // Verify equipment
      const [equipment] = await testDb
        .select()
        .from(avatarEquipments)
        .where(eq(avatarEquipments.avatarId, avatar.id))

      expect(equipment).toBeDefined()
      expect(equipment.sportId).toBe(sport.id)
      expect(equipment.jerseyItemId).toBe(defaultItems[0].id) // jersey
      expect(equipment.shortsItemId).toBe(defaultItems[1].id) // shorts
      expect(equipment.shoesItemId).toBe(defaultItems[2].id) // shoes
      expect(equipment.jerseyNumber).toBeGreaterThanOrEqual(0)
      expect(equipment.jerseyNumber).toBeLessThan(100)
    })
  })

  describe('PUT /api/users/avatar', () => {
    it('should return 401 when not authenticated', async () => {
      mockGetSession.mockResolvedValue(null)

      const request = new Request('http://localhost/api/users/avatar', {
        method: 'PUT',
        body: JSON.stringify({ skinTone: 'dark' }),
      })

      const response = await PUT(request)

      expect(response.status).toBe(401)
    })

    it('should return 404 when avatar not found', async () => {
      const user = await createTestUser()
      mockGetSession.mockResolvedValue({
        user: { id: user.id, email: user.email },
      })

      const request = new Request('http://localhost/api/users/avatar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skinTone: 'dark' }),
      })

      const response = await PUT(request)

      expect(response.status).toBe(404)
      const body = await response.json()
      expect(body.error).toContain('not found')
    })

    it('should update avatar skinTone only', async () => {
      const user = await createTestUser()
      await testDb.insert(avatars).values({
        userId: user.id,
        skinTone: 'medium',
        hairStyle: 'short',
        hairColor: 'black',
      })

      mockGetSession.mockResolvedValue({
        user: { id: user.id, email: user.email },
      })

      const request = new Request('http://localhost/api/users/avatar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skinTone: 'dark' }),
      })

      const response = await PUT(request)

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.success).toBe(true)
      expect(body.avatar.skinTone).toBe('dark')
      expect(body.avatar.hairStyle).toBe('short') // unchanged
      expect(body.avatar.hairColor).toBe('black') // unchanged
    })

    it('should update multiple fields', async () => {
      const user = await createTestUser()
      await testDb.insert(avatars).values({
        userId: user.id,
        skinTone: 'medium',
        hairStyle: 'short',
        hairColor: 'black',
      })

      mockGetSession.mockResolvedValue({
        user: { id: user.id, email: user.email },
      })

      const request = new Request('http://localhost/api/users/avatar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skinTone: 'light',
          hairStyle: 'afro',
          hairColor: 'brown',
        }),
      })

      const response = await PUT(request)

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.avatar.skinTone).toBe('light')
      expect(body.avatar.hairStyle).toBe('afro')
      expect(body.avatar.hairColor).toBe('brown')
    })

    it('should reject empty update', async () => {
      const user = await createTestUser()
      await testDb.insert(avatars).values({
        userId: user.id,
        skinTone: 'medium',
        hairStyle: 'short',
        hairColor: 'black',
      })

      mockGetSession.mockResolvedValue({
        user: { id: user.id, email: user.email },
      })

      const request = new Request('http://localhost/api/users/avatar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      const response = await PUT(request)

      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.details._form).toBe('At least one field is required')
    })
  })
})
