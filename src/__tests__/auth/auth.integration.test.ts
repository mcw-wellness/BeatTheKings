import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { createTestDb, closeTestDb, clearTestDb, type TestDatabase } from '@/db/test-utils'
import {
  findUserByEmail,
  findUserById,
  createUserFromOAuth,
  getOrCreateUser,
  updateUserAvatarStatus,
} from '@/lib/auth/drizzle-adapter'
import { getPostLoginRedirect } from '@/lib/auth'

describe('Auth Integration Tests', () => {
  let db: TestDatabase

  beforeAll(async () => {
    db = await createTestDb()
  })

  afterAll(async () => {
    await closeTestDb()
  })

  beforeEach(async () => {
    await clearTestDb(db)
  })

  describe('findUserByEmail', () => {
    it('should return null when user does not exist', async () => {
      const user = await findUserByEmail(db, 'nonexistent@example.com')
      expect(user).toBeNull()
    })

    it('should return user when found', async () => {
      await createUserFromOAuth(db, { email: 'test@example.com', name: 'Test User' })
      const user = await findUserByEmail(db, 'test@example.com')

      expect(user).not.toBeNull()
      expect(user?.email).toBe('test@example.com')
      expect(user?.name).toBe('Test User')
    })
  })

  describe('findUserById', () => {
    it('should return null when user does not exist', async () => {
      const user = await findUserById(db, '00000000-0000-0000-0000-000000000000')
      expect(user).toBeNull()
    })

    it('should return user when found', async () => {
      const created = await createUserFromOAuth(db, { email: 'test@example.com' })
      const user = await findUserById(db, created.id)

      expect(user).not.toBeNull()
      expect(user?.id).toBe(created.id)
      expect(user?.email).toBe('test@example.com')
    })
  })

  describe('createUserFromOAuth', () => {
    it('should create user with email and name', async () => {
      const user = await createUserFromOAuth(db, {
        email: 'newuser@example.com',
        name: 'New User',
      })

      expect(user.id).toBeDefined()
      expect(user.email).toBe('newuser@example.com')
      expect(user.name).toBe('New User')
      expect(user.hasCreatedAvatar).toBe(false)
    })

    it('should create user with email only', async () => {
      const user = await createUserFromOAuth(db, {
        email: 'emailonly@example.com',
      })

      expect(user.id).toBeDefined()
      expect(user.email).toBe('emailonly@example.com')
      expect(user.name).toBeNull()
      expect(user.hasCreatedAvatar).toBe(false)
    })

    it('should handle null name', async () => {
      const user = await createUserFromOAuth(db, {
        email: 'nullname@example.com',
        name: null,
      })

      expect(user.name).toBeNull()
    })

    it('should fail on duplicate email', async () => {
      await createUserFromOAuth(db, { email: 'duplicate@example.com' })

      await expect(createUserFromOAuth(db, { email: 'duplicate@example.com' })).rejects.toThrow()
    })
  })

  describe('getOrCreateUser', () => {
    it('should create new user when not exists', async () => {
      const { user, isNewUser } = await getOrCreateUser(db, {
        email: 'brand-new@example.com',
        name: 'Brand New',
      })

      expect(isNewUser).toBe(true)
      expect(user.email).toBe('brand-new@example.com')
      expect(user.name).toBe('Brand New')
      expect(user.hasCreatedAvatar).toBe(false)
    })

    it('should return existing user when already exists', async () => {
      const original = await createUserFromOAuth(db, {
        email: 'existing@example.com',
        name: 'Original Name',
      })

      const { user, isNewUser } = await getOrCreateUser(db, {
        email: 'existing@example.com',
        name: 'Different Name',
      })

      expect(isNewUser).toBe(false)
      expect(user.id).toBe(original.id)
      expect(user.email).toBe('existing@example.com')
      expect(user.name).toBe('Original Name')
    })

    it('should be case-sensitive for email lookup', async () => {
      await createUserFromOAuth(db, { email: 'case@example.com' })

      const { isNewUser } = await getOrCreateUser(db, {
        email: 'CASE@example.com',
      })

      expect(isNewUser).toBe(true)
    })
  })

  describe('updateUserAvatarStatus', () => {
    it('should update hasCreatedAvatar to true', async () => {
      const user = await createUserFromOAuth(db, { email: 'avatar@example.com' })
      expect(user.hasCreatedAvatar).toBe(false)

      const updated = await updateUserAvatarStatus(db, user.id, true)

      expect(updated.hasCreatedAvatar).toBe(true)
      expect(updated.id).toBe(user.id)
    })

    it('should update hasCreatedAvatar to false', async () => {
      const user = await createUserFromOAuth(db, { email: 'avatar2@example.com' })
      await updateUserAvatarStatus(db, user.id, true)

      const updated = await updateUserAvatarStatus(db, user.id, false)

      expect(updated.hasCreatedAvatar).toBe(false)
    })

    it('should update the updatedAt timestamp', async () => {
      const user = await createUserFromOAuth(db, { email: 'timestamp@example.com' })
      expect(user.updatedAt).toBeNull()

      await new Promise((resolve) => setTimeout(resolve, 10))

      const updated = await updateUserAvatarStatus(db, user.id, true)

      expect(updated.updatedAt).not.toBeNull()
      expect(updated.updatedAt!.getTime()).toBeGreaterThan(user.createdAt.getTime())
    })
  })

  describe('OAuth Flow - New User', () => {
    it('should create user and redirect to avatar creation', async () => {
      const oauthData = {
        email: 'newuser@gmail.com',
        name: 'New Google User',
      }

      const { user, isNewUser } = await getOrCreateUser(db, oauthData)

      expect(isNewUser).toBe(true)
      expect(user.email).toBe(oauthData.email)
      expect(user.hasCreatedAvatar).toBe(false)

      const redirectPath = getPostLoginRedirect(user.hasCreatedAvatar)
      expect(redirectPath).toBe('/avatar')
    })

    it('should handle OAuth user without name', async () => {
      const { user, isNewUser } = await getOrCreateUser(db, {
        email: 'noname@gmail.com',
        name: null,
      })

      expect(isNewUser).toBe(true)
      expect(user.name).toBeNull()
    })
  })

  describe('OAuth Flow - Returning User', () => {
    it('should recognize existing user without avatar', async () => {
      await getOrCreateUser(db, { email: 'existing@gmail.com', name: 'Existing User' })

      const { user, isNewUser } = await getOrCreateUser(db, {
        email: 'existing@gmail.com',
        name: 'Different Name',
      })

      expect(isNewUser).toBe(false)
      expect(user.name).toBe('Existing User')

      const redirectPath = getPostLoginRedirect(user.hasCreatedAvatar)
      expect(redirectPath).toBe('/avatar')
    })

    it('should recognize existing user with avatar and redirect to welcome', async () => {
      const { user: newUser } = await getOrCreateUser(db, {
        email: 'withavatar@gmail.com',
        name: 'User With Avatar',
      })
      await updateUserAvatarStatus(db, newUser.id, true)

      const freshUser = await findUserByEmail(db, 'withavatar@gmail.com')
      expect(freshUser?.hasCreatedAvatar).toBe(true)

      const redirectPath = getPostLoginRedirect(freshUser!.hasCreatedAvatar)
      expect(redirectPath).toBe('/welcome')
    })
  })

  describe('Database Constraints', () => {
    it('should generate unique UUIDs for each user', async () => {
      const user1 = await getOrCreateUser(db, { email: 'user1@example.com' })
      const user2 = await getOrCreateUser(db, { email: 'user2@example.com' })
      const user3 = await getOrCreateUser(db, { email: 'user3@example.com' })

      const ids = [user1.user.id, user2.user.id, user3.user.id]
      const uniqueIds = new Set(ids)

      expect(uniqueIds.size).toBe(3)
    })

    it('should set timestamps correctly', async () => {
      const before = new Date()
      const { user } = await getOrCreateUser(db, { email: 'timestamp@example.com' })
      const after = new Date()

      expect(user.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(user.createdAt.getTime()).toBeLessThanOrEqual(after.getTime())
    })
  })
})
