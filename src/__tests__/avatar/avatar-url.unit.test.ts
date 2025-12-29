import { describe, it, expect } from 'vitest'
import { getDefaultAvatarSasUrl, getUserAvatarSasUrl } from '@/lib/azure-storage'

describe('Avatar URL Functions', () => {
  describe('getDefaultAvatarSasUrl', () => {
    it('should return URL for male basketball player', () => {
      const url = getDefaultAvatarSasUrl('male', 'basketball')

      expect(url).toContain('basketball_male.png')
      expect(url).toContain('avatar')
    })

    it('should return URL for female basketball player', () => {
      const url = getDefaultAvatarSasUrl('female', 'basketball')

      expect(url).toContain('basketball_female.png')
    })

    it('should return URL for male soccer player', () => {
      const url = getDefaultAvatarSasUrl('male', 'soccer')

      expect(url).toContain('soccer_male.png')
    })

    it('should return URL for female soccer player', () => {
      const url = getDefaultAvatarSasUrl('female', 'soccer')

      expect(url).toContain('soccer_female.png')
    })

    it('should default to basketball when sport not specified', () => {
      const url = getDefaultAvatarSasUrl('male')

      expect(url).toContain('basketball_male.png')
    })

    it('should default to male when gender is null', () => {
      const url = getDefaultAvatarSasUrl(null as unknown as string)

      expect(url).toContain('_male.png')
    })

    it('should handle uppercase gender', () => {
      const url = getDefaultAvatarSasUrl('FEMALE', 'basketball')

      expect(url).toContain('basketball_female.png')
    })
  })

  describe('getUserAvatarSasUrl', () => {
    it('should return URL with user ID in path', () => {
      const userId = 'test-user-123'
      const url = getUserAvatarSasUrl(userId)

      expect(url).toContain(`users/${userId}/avatar.png`)
    })

    it('should return URL for different user IDs', () => {
      const userId1 = 'user-abc'
      const userId2 = 'user-xyz'

      const url1 = getUserAvatarSasUrl(userId1)
      const url2 = getUserAvatarSasUrl(userId2)

      expect(url1).toContain(userId1)
      expect(url2).toContain(userId2)
      expect(url1).not.toBe(url2)
    })

    it('should include avatar container in path', () => {
      const url = getUserAvatarSasUrl('test-user')

      expect(url).toContain('avatar')
    })
  })
})
