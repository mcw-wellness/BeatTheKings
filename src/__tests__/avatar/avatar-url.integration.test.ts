import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GET } from '@/app/api/avatar/url/route'

// Mock the auth module
vi.mock('@/lib/auth', () => ({
  getSession: vi.fn(),
}))

// Mock azure-storage to avoid needing real credentials
vi.mock('@/lib/azure-storage', () => ({
  getDefaultAvatarSasUrl: vi.fn((gender: string, sport: string = 'basketball') => {
    const genderKey = gender?.toLowerCase() === 'female' ? 'female' : 'male'
    return `https://test.blob.core.windows.net/avatar/default/${sport}_${genderKey}.png?sas=token`
  }),
  getUserAvatarSasUrl: vi.fn((userId: string) => {
    return `https://test.blob.core.windows.net/avatar/users/${userId}/avatar.png?sas=token`
  }),
}))

import { getSession } from '@/lib/auth'

describe('Avatar URL API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('GET /api/avatar/url', () => {
    it('should return default male basketball avatar URL', async () => {
      const request = new Request(
        'http://localhost/api/avatar/url?type=default&gender=male&sport=basketball'
      )

      const response = await GET(request)
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.url).toContain('basketball_male.png')
      expect(body.url).toContain('sas=token')
    })

    it('should return default female basketball avatar URL', async () => {
      const request = new Request(
        'http://localhost/api/avatar/url?type=default&gender=female&sport=basketball'
      )

      const response = await GET(request)
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.url).toContain('basketball_female.png')
    })

    it('should return default soccer avatar URL', async () => {
      const request = new Request(
        'http://localhost/api/avatar/url?type=default&gender=male&sport=soccer'
      )

      const response = await GET(request)
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.url).toContain('soccer_male.png')
    })

    it('should default to male basketball when no params', async () => {
      const request = new Request('http://localhost/api/avatar/url')

      const response = await GET(request)
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.url).toContain('basketball_male.png')
    })

    it('should return user avatar URL when type=user and userId provided', async () => {
      const userId = 'test-user-123'
      const request = new Request(`http://localhost/api/avatar/url?type=user&userId=${userId}`)

      const response = await GET(request)
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.url).toContain(`users/${userId}/avatar.png`)
    })

    it('should handle userId=me by getting session', async () => {
      const mockUserId = 'session-user-456'
      vi.mocked(getSession).mockResolvedValue({
        user: { id: mockUserId, email: 'test@example.com', hasCreatedAvatar: true },
        expires: new Date().toISOString(),
      })

      const request = new Request('http://localhost/api/avatar/url?type=user&userId=me')

      const response = await GET(request)
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.url).toContain(`users/${mockUserId}/avatar.png`)
    })

    it('should return 401 when userId=me but no session', async () => {
      vi.mocked(getSession).mockResolvedValue(null)

      const request = new Request('http://localhost/api/avatar/url?type=user&userId=me')

      const response = await GET(request)
      const body = await response.json()

      expect(response.status).toBe(401)
      expect(body.error).toBe('Unauthorized')
    })

    it('should fall back to default when type=user but no userId', async () => {
      const request = new Request('http://localhost/api/avatar/url?type=user&gender=female')

      const response = await GET(request)
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.url).toContain('basketball_female.png')
    })
  })
})
