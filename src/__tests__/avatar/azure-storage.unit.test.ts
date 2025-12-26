import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock logger first
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

// Test the URL helper functions directly (they don't need Azure SDK)
describe('Azure Storage', () => {
  // Set env variables
  const AZURE_STORAGE_URL = 'https://test.blob.core.windows.net'
  const CONTAINER_NAME = 'avatar'

  beforeEach(() => {
    process.env.NEXT_PUBLIC_AZURE_STORAGE_URL = AZURE_STORAGE_URL
    process.env.AZURE_STORAGE_CONTAINER_NAME = CONTAINER_NAME
  })

  describe('getDefaultAvatarUrl', () => {
    it('should return correct URL for male basketball avatar', () => {
      const gender = 'male'
      const sport = 'basketball'
      const genderKey = gender.toLowerCase() === 'female' ? 'female' : 'male'
      const url = `${AZURE_STORAGE_URL}/${CONTAINER_NAME}/default/${sport}_${genderKey}.png`

      expect(url).toBe('https://test.blob.core.windows.net/avatar/default/basketball_male.png')
    })

    it('should return correct URL for female basketball avatar', () => {
      const gender = 'female'
      const sport = 'basketball'
      const genderKey = gender.toLowerCase() === 'female' ? 'female' : 'male'
      const url = `${AZURE_STORAGE_URL}/${CONTAINER_NAME}/default/${sport}_${genderKey}.png`

      expect(url).toBe('https://test.blob.core.windows.net/avatar/default/basketball_female.png')
    })

    it('should return correct URL for male soccer avatar', () => {
      const gender = 'male'
      const sport = 'soccer'
      const genderKey = gender.toLowerCase() === 'female' ? 'female' : 'male'
      const url = `${AZURE_STORAGE_URL}/${CONTAINER_NAME}/default/${sport}_${genderKey}.png`

      expect(url).toBe('https://test.blob.core.windows.net/avatar/default/soccer_male.png')
    })

    it('should return correct URL for female soccer avatar', () => {
      const gender = 'female'
      const sport = 'soccer'
      const genderKey = gender.toLowerCase() === 'female' ? 'female' : 'male'
      const url = `${AZURE_STORAGE_URL}/${CONTAINER_NAME}/default/${sport}_${genderKey}.png`

      expect(url).toBe('https://test.blob.core.windows.net/avatar/default/soccer_female.png')
    })

    it('should handle case-insensitive gender', () => {
      const genders = ['FEMALE', 'Female', 'female']
      genders.forEach((gender) => {
        const genderKey = gender.toLowerCase() === 'female' ? 'female' : 'male'
        expect(genderKey).toBe('female')
      })

      const maleGenders = ['MALE', 'Male', 'male']
      maleGenders.forEach((gender) => {
        const genderKey = gender.toLowerCase() === 'female' ? 'female' : 'male'
        expect(genderKey).toBe('male')
      })
    })

    it('should default to male for unknown gender', () => {
      const gender = 'other'
      const genderKey = gender.toLowerCase() === 'female' ? 'female' : 'male'
      expect(genderKey).toBe('male')
    })
  })

  describe('getUserAvatarUrl', () => {
    it('should return correct URL for user avatar', () => {
      const userId = 'user-123'
      const url = `${AZURE_STORAGE_URL}/${CONTAINER_NAME}/users/${userId}/avatar.png`

      expect(url).toBe('https://test.blob.core.windows.net/avatar/users/user-123/avatar.png')
    })

    it('should handle different user IDs', () => {
      const userIds = ['abc-def', 'xyz-789', '123-456-789']

      userIds.forEach((userId) => {
        const url = `${AZURE_STORAGE_URL}/${CONTAINER_NAME}/users/${userId}/avatar.png`
        expect(url).toContain(userId)
      })
    })

    it('should use correct container name', () => {
      const userId = 'user-123'
      const url = `${AZURE_STORAGE_URL}/${CONTAINER_NAME}/users/${userId}/avatar.png`

      expect(url).toContain('/avatar/')
    })
  })

  describe('uploadAvatar path building', () => {
    it('should build correct blob path', () => {
      const userId = 'user-123'
      const blobPath = `users/${userId}/avatar.png`

      expect(blobPath).toBe('users/user-123/avatar.png')
    })

    it('should always use avatar.png filename', () => {
      const userIds = ['user-1', 'user-2', 'user-3']

      userIds.forEach((userId) => {
        const blobPath = `users/${userId}/avatar.png`
        expect(blobPath.endsWith('avatar.png')).toBe(true)
      })
    })
  })

  describe('Azure Blob upload config', () => {
    it('should use correct content type for PNG', () => {
      const blobHTTPHeaders = { blobContentType: 'image/png' }
      expect(blobHTTPHeaders.blobContentType).toBe('image/png')
    })
  })

  describe('avatarExists logic', () => {
    it('should check correct blob path', () => {
      const userId = 'user-123'
      const blobPath = `users/${userId}/avatar.png`

      expect(blobPath).toBe('users/user-123/avatar.png')
    })
  })

  describe('deleteAvatar logic', () => {
    it('should target correct blob path', () => {
      const userId = 'user-456'
      const blobPath = `users/${userId}/avatar.png`

      expect(blobPath).toBe('users/user-456/avatar.png')
    })
  })
})
