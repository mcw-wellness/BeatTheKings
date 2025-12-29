import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { POST } from '@/app/api/avatar/preview/route'

// Mock the auth module
vi.mock('@/lib/auth', () => ({
  getSession: vi.fn(),
}))

// Mock the avatar generator
vi.mock('@/lib/avatar/generator', () => ({
  generateAvatarImage: vi.fn(),
}))

import { getSession } from '@/lib/auth'
import { generateAvatarImage } from '@/lib/avatar/generator'

describe('Avatar Preview API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('POST /api/avatar/preview', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(getSession).mockResolvedValue(null)

      const request = new Request('http://localhost/api/avatar/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gender: 'male',
          skinTone: 'medium',
          hairStyle: 'short',
          hairColor: 'black',
        }),
      })

      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(401)
      expect(body.error).toBe('Unauthorized')
    })

    it('should return 400 when missing required fields', async () => {
      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'test-user', email: 'test@example.com', hasCreatedAvatar: true },
        expires: new Date().toISOString(),
      })

      const request = new Request('http://localhost/api/avatar/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gender: 'male',
          // Missing skinTone, hairStyle, hairColor
        }),
      })

      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body.error).toContain('Missing required fields')
    })

    it('should generate preview and return base64 image', async () => {
      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'test-user', email: 'test@example.com', hasCreatedAvatar: true },
        expires: new Date().toISOString(),
      })

      // Mock image buffer
      const mockImageBuffer = Buffer.from('fake-image-data')
      vi.mocked(generateAvatarImage).mockResolvedValue(mockImageBuffer)

      const request = new Request('http://localhost/api/avatar/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gender: 'male',
          skinTone: 'medium',
          hairStyle: 'short',
          hairColor: 'black',
        }),
      })

      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.imageUrl).toContain('data:image/png;base64,')
      expect(generateAvatarImage).toHaveBeenCalledWith({
        gender: 'male',
        skinTone: 'medium',
        hairStyle: 'short',
        hairColor: 'black',
        sport: 'basketball',
      })
    })

    it('should use custom sport when provided', async () => {
      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'test-user', email: 'test@example.com', hasCreatedAvatar: true },
        expires: new Date().toISOString(),
      })

      const mockImageBuffer = Buffer.from('fake-image-data')
      vi.mocked(generateAvatarImage).mockResolvedValue(mockImageBuffer)

      const request = new Request('http://localhost/api/avatar/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gender: 'female',
          skinTone: 'dark',
          hairStyle: 'braids',
          hairColor: 'black',
          sport: 'soccer',
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(generateAvatarImage).toHaveBeenCalledWith({
        gender: 'female',
        skinTone: 'dark',
        hairStyle: 'braids',
        hairColor: 'black',
        sport: 'soccer',
      })
    })

    it('should return 500 when generation fails', async () => {
      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'test-user', email: 'test@example.com', hasCreatedAvatar: true },
        expires: new Date().toISOString(),
      })

      vi.mocked(generateAvatarImage).mockRejectedValue(new Error('Generation failed'))

      const request = new Request('http://localhost/api/avatar/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gender: 'male',
          skinTone: 'medium',
          hairStyle: 'short',
          hairColor: 'black',
        }),
      })

      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(500)
      expect(body.error).toBe('Failed to generate avatar preview')
    })

    it('should handle all skin tones', async () => {
      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'test-user', email: 'test@example.com', hasCreatedAvatar: true },
        expires: new Date().toISOString(),
      })

      const mockImageBuffer = Buffer.from('fake-image-data')
      vi.mocked(generateAvatarImage).mockResolvedValue(mockImageBuffer)

      const skinTones = ['light', 'medium-light', 'medium', 'medium-dark', 'dark']

      for (const skinTone of skinTones) {
        const request = new Request('http://localhost/api/avatar/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gender: 'male',
            skinTone,
            hairStyle: 'short',
            hairColor: 'black',
          }),
        })

        const response = await POST(request)
        expect(response.status).toBe(200)
      }
    })

    it('should handle all hair styles', async () => {
      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'test-user', email: 'test@example.com', hasCreatedAvatar: true },
        expires: new Date().toISOString(),
      })

      const mockImageBuffer = Buffer.from('fake-image-data')
      vi.mocked(generateAvatarImage).mockResolvedValue(mockImageBuffer)

      const hairStyles = ['short', 'medium', 'long', 'bald', 'afro', 'braids', 'dreads', 'mohawk']

      for (const hairStyle of hairStyles) {
        const request = new Request('http://localhost/api/avatar/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gender: 'female',
            skinTone: 'medium',
            hairStyle,
            hairColor: 'brown',
          }),
        })

        const response = await POST(request)
        expect(response.status).toBe(200)
      }
    })
  })
})
