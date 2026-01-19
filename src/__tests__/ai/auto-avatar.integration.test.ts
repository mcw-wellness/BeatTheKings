/**
 * Auto Avatar Generation Integration Tests
 * Tests the profile-picture API that auto-generates avatars from photos
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import { createTestDb, closeTestDb, clearTestDb, type TestDatabase } from '@/db/test-utils'
import { users, avatars, sports, avatarItems, userUnlockedItems } from '@/db/schema'
import { eq } from 'drizzle-orm'

// Mock session
const mockGetSession = vi.fn()

vi.mock('@/lib/auth', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/auth')>()
  return {
    ...original,
    getSession: () => mockGetSession(),
    updateUserProfile: original.updateUserProfile,
  }
})

// Mock getDb to use test database
let testDb: TestDatabase

vi.mock('@/db', () => ({
  getDb: () => testDb,
}))

// Mock Azure storage
vi.mock('@/lib/azure-storage', () => ({
  uploadProfilePicture: vi.fn().mockResolvedValue('profiles/test-user/photo.jpeg'),
  getProfilePictureSasUrl: vi.fn().mockReturnValue('https://mock.blob.core/profiles/test-user/photo.jpeg?sas'),
  uploadAvatar: vi.fn().mockResolvedValue('https://mock.blob.core/avatars/test-user.png?sas'),
}))

// Mock photo analysis
vi.mock('@/lib/ai/analyze-photo', () => ({
  analyzePhotoForAvatar: vi.fn().mockResolvedValue({
    skinTone: 'medium',
    hairStyle: 'short',
    hairColor: 'black',
    gender: 'male',
  }),
}))

// Mock avatar generator
vi.mock('@/lib/avatar/generator', () => ({
  generateAvatarImage: vi.fn().mockResolvedValue(Buffer.from('mock-png-data')),
}))

// Mock logger
vi.mock('@/lib/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

// Import route handler after mocking
import { POST } from '@/app/api/users/profile-picture/route'
import { analyzePhotoForAvatar } from '@/lib/ai/analyze-photo'

describe('Auto Avatar Generation Integration Tests', () => {
  beforeAll(async () => {
    testDb = await createTestDb()
  })

  afterAll(async () => {
    await closeTestDb()
  })

  beforeEach(async () => {
    await clearTestDb(testDb)
    vi.clearAllMocks()
    mockGetSession.mockReset()
  })

  describe('POST /api/users/profile-picture', () => {
    it('should return 401 when not authenticated', async () => {
      mockGetSession.mockResolvedValue(null)

      const request = new Request('http://localhost/api/users/profile-picture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: 'base64data' }),
      })

      const response = await POST(request)

      expect(response.status).toBe(401)
      const body = await response.json()
      expect(body.error).toBe('Unauthorized')
    })

    it('should return 400 when image is missing', async () => {
      const [user] = await testDb
        .insert(users)
        .values({ email: 'test@example.com', hasCreatedAvatar: false })
        .returning()

      mockGetSession.mockResolvedValue({
        user: { id: user.id, email: user.email },
      })

      const request = new Request('http://localhost/api/users/profile-picture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.error).toBe('Image data is required')
    })

    it('should create new avatar when user has none', async () => {
      // Create user and basketball sport for default items
      const [user] = await testDb
        .insert(users)
        .values({ email: 'test@example.com', hasCreatedAvatar: false })
        .returning()

      const [sport] = await testDb
        .insert(sports)
        .values({ name: 'Basketball', slug: 'basketball', isActive: true })
        .returning()

      // Create default items for basketball
      await testDb.insert(avatarItems).values([
        { name: 'Default Jersey', itemType: 'jersey', sportId: sport.id, isDefault: true },
        { name: 'Default Shorts', itemType: 'shorts', sportId: sport.id, isDefault: true },
        { name: 'Default Shoes', itemType: 'shoes', sportId: sport.id, isDefault: true },
      ])

      mockGetSession.mockResolvedValue({
        user: { id: user.id, email: user.email },
      })

      const request = new Request('http://localhost/api/users/profile-picture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ==',
          contentType: 'image/jpeg',
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.success).toBe(true)
      expect(body.avatarGenerated).toBe(true)
      expect(body.features).toEqual({
        skinTone: 'medium',
        hairStyle: 'short',
        hairColor: 'black',
        gender: 'male',
      })

      // Verify avatar was created in database
      const [avatar] = await testDb
        .select()
        .from(avatars)
        .where(eq(avatars.userId, user.id))

      expect(avatar).toBeDefined()
      expect(avatar.skinTone).toBe('medium')
      expect(avatar.hairStyle).toBe('short')
      expect(avatar.hairColor).toBe('black')

      // Verify user hasCreatedAvatar was updated
      const [updatedUser] = await testDb
        .select()
        .from(users)
        .where(eq(users.id, user.id))

      expect(updatedUser.hasCreatedAvatar).toBe(true)
      expect(updatedUser.hasUploadedPhoto).toBe(true)
    })

    it('should update existing avatar', async () => {
      // Create user with existing avatar
      const [user] = await testDb
        .insert(users)
        .values({ email: 'test@example.com', hasCreatedAvatar: true })
        .returning()

      const [existingAvatar] = await testDb
        .insert(avatars)
        .values({
          userId: user.id,
          skinTone: 'light',
          hairStyle: 'long',
          hairColor: 'blonde',
        })
        .returning()

      // Create basketball sport
      await testDb
        .insert(sports)
        .values({ name: 'Basketball', slug: 'basketball', isActive: true })
        .returning()

      mockGetSession.mockResolvedValue({
        user: { id: user.id, email: user.email },
      })

      // Mock different analysis result
      vi.mocked(analyzePhotoForAvatar).mockResolvedValueOnce({
        skinTone: 'dark',
        hairStyle: 'afro',
        hairColor: 'black',
        gender: 'male',
      })

      const request = new Request('http://localhost/api/users/profile-picture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ==',
          contentType: 'image/jpeg',
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.success).toBe(true)
      expect(body.features.skinTone).toBe('dark')
      expect(body.features.hairStyle).toBe('afro')

      // Verify avatar was updated (not created new)
      const allAvatars = await testDb
        .select()
        .from(avatars)
        .where(eq(avatars.userId, user.id))

      expect(allAvatars).toHaveLength(1)
      expect(allAvatars[0].id).toBe(existingAvatar.id)
      expect(allAvatars[0].skinTone).toBe('dark')
      expect(allAvatars[0].hairStyle).toBe('afro')
    })

    it('should unlock default items for new avatar', async () => {
      const [user] = await testDb
        .insert(users)
        .values({ email: 'test@example.com', hasCreatedAvatar: false })
        .returning()

      const [sport] = await testDb
        .insert(sports)
        .values({ name: 'Basketball', slug: 'basketball', isActive: true })
        .returning()

      // Create default items
      const defaultItems = await testDb
        .insert(avatarItems)
        .values([
          { name: 'Default Jersey', itemType: 'jersey', sportId: sport.id, isDefault: true },
          { name: 'Default Shorts', itemType: 'shorts', sportId: sport.id, isDefault: true },
          { name: 'Default Shoes', itemType: 'shoes', sportId: sport.id, isDefault: true },
        ])
        .returning()

      mockGetSession.mockResolvedValue({
        user: { id: user.id, email: user.email },
      })

      const request = new Request('http://localhost/api/users/profile-picture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: 'base64data',
          contentType: 'image/jpeg',
        }),
      })

      await POST(request)

      // Verify default items were unlocked
      const unlockedItems = await testDb
        .select()
        .from(userUnlockedItems)
        .where(eq(userUnlockedItems.userId, user.id))

      expect(unlockedItems.length).toBeGreaterThanOrEqual(3)

      const unlockedItemIds = unlockedItems.map((ui) => ui.itemId)
      for (const item of defaultItems) {
        expect(unlockedItemIds).toContain(item.id)
      }
    })

    it('should update user gender from analysis', async () => {
      const [user] = await testDb
        .insert(users)
        .values({ email: 'test@example.com', hasCreatedAvatar: false, gender: null })
        .returning()

      const [sport] = await testDb
        .insert(sports)
        .values({ name: 'Basketball', slug: 'basketball', isActive: true })
        .returning()

      await testDb.insert(avatarItems).values([
        { name: 'Default Jersey', itemType: 'jersey', sportId: sport.id, isDefault: true },
      ])

      mockGetSession.mockResolvedValue({
        user: { id: user.id, email: user.email },
      })

      vi.mocked(analyzePhotoForAvatar).mockResolvedValueOnce({
        skinTone: 'medium',
        hairStyle: 'long',
        hairColor: 'brown',
        gender: 'female',
      })

      const request = new Request('http://localhost/api/users/profile-picture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: 'base64data',
          contentType: 'image/jpeg',
        }),
      })

      await POST(request)

      // Verify user gender was updated
      const [updatedUser] = await testDb
        .select()
        .from(users)
        .where(eq(users.id, user.id))

      expect(updatedUser.gender).toBe('female')
    })

    it('should handle avatar generation failure gracefully', async () => {
      const [user] = await testDb
        .insert(users)
        .values({ email: 'test@example.com', hasCreatedAvatar: false })
        .returning()

      const [sport] = await testDb
        .insert(sports)
        .values({ name: 'Basketball', slug: 'basketball', isActive: true })
        .returning()

      await testDb.insert(avatarItems).values([
        { name: 'Default Jersey', itemType: 'jersey', sportId: sport.id, isDefault: true },
      ])

      mockGetSession.mockResolvedValue({
        user: { id: user.id, email: user.email },
      })

      // Mock avatar generation failure
      const { generateAvatarImage } = await import('@/lib/avatar/generator')
      vi.mocked(generateAvatarImage).mockRejectedValueOnce(new Error('Generation failed'))

      const request = new Request('http://localhost/api/users/profile-picture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: 'base64data',
          contentType: 'image/jpeg',
        }),
      })

      const response = await POST(request)

      // Should still succeed, just without generated avatar image
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.success).toBe(true)
      expect(body.avatarGenerated).toBe(false)

      // Avatar should still be created with features
      const [avatar] = await testDb
        .select()
        .from(avatars)
        .where(eq(avatars.userId, user.id))

      expect(avatar).toBeDefined()
      expect(avatar.skinTone).toBe('medium')
    })

    it('should return SAS URL for uploaded photo', async () => {
      const [user] = await testDb
        .insert(users)
        .values({ email: 'test@example.com', hasCreatedAvatar: false })
        .returning()

      const [sport] = await testDb
        .insert(sports)
        .values({ name: 'Basketball', slug: 'basketball', isActive: true })
        .returning()

      await testDb.insert(avatarItems).values([
        { name: 'Default Jersey', itemType: 'jersey', sportId: sport.id, isDefault: true },
      ])

      mockGetSession.mockResolvedValue({
        user: { id: user.id, email: user.email },
      })

      const request = new Request('http://localhost/api/users/profile-picture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: 'base64data',
          contentType: 'image/png',
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.url).toContain('mock.blob.core')
    })
  })
})
