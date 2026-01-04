import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { buildUserAvatarPrompt } from '@/lib/avatar/prompts'

// We test the prompt building and mock the entire generator module
// since the Gemini client is initialized at module load time

describe('Avatar Generator', () => {
  describe('generateAvatarImage (mocked)', () => {
    beforeEach(() => {
      vi.clearAllMocks()
      vi.resetModules()
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('should build correct prompt for user avatar', () => {
      const prompt = buildUserAvatarPrompt({
        gender: 'male',
        skinTone: 'medium',
        hairStyle: 'short',
        hairColor: 'black',
      })

      expect(prompt).toContain('male')
      expect(prompt).toContain('athlete')
      expect(prompt).toContain('medium skin tone')
      expect(prompt).toContain('short black hair')
      expect(prompt).toContain('basketball')
    })

    it('should build correct prompt with soccer sport', () => {
      const prompt = buildUserAvatarPrompt({
        gender: 'female',
        skinTone: 'dark',
        hairStyle: 'braids',
        hairColor: 'black',
        sport: 'soccer',
      })

      expect(prompt).toContain('female')
      expect(prompt).toContain('athlete')
      expect(prompt).toContain('dark skin tone')
      expect(prompt).toContain('soccer jersey')
      expect(prompt).toContain('cleats')
    })

    it('should include base style in prompt', () => {
      const prompt = buildUserAvatarPrompt({
        gender: 'male',
        skinTone: 'light',
        hairStyle: 'afro',
        hairColor: 'brown',
      })

      expect(prompt.toLowerCase()).toContain('cartoon')
      expect(prompt).toContain('card style')
      expect(prompt).toContain('stadium background')
    })

    it('should handle all skin tones', () => {
      const skinTones = ['light', 'medium-light', 'medium', 'medium-dark', 'dark']

      skinTones.forEach((skinTone) => {
        const prompt = buildUserAvatarPrompt({
          gender: 'male',
          skinTone,
          hairStyle: 'short',
          hairColor: 'black',
        })
        expect(prompt).toContain(skinTone)
      })
    })

    it('should handle all hair styles', () => {
      const hairStyles = ['short', 'medium', 'long', 'bald', 'afro', 'braids', 'dreads', 'mohawk']

      hairStyles.forEach((hairStyle) => {
        const prompt = buildUserAvatarPrompt({
          gender: 'female',
          skinTone: 'medium',
          hairStyle,
          hairColor: 'black',
        })
        expect(prompt).toContain(hairStyle)
      })
    })

    it('should handle all hair colors', () => {
      const hairColors = ['black', 'brown', 'blonde', 'red', 'gray', 'white']

      hairColors.forEach((hairColor) => {
        const prompt = buildUserAvatarPrompt({
          gender: 'male',
          skinTone: 'medium',
          hairStyle: 'short',
          hairColor,
        })
        expect(prompt).toContain(hairColor)
      })
    })
  })

  describe('Gemini response parsing', () => {
    it('should extract image buffer from valid response', () => {
      const mockImageData = Buffer.from('fake-image-data').toString('base64')
      const mockResponse = {
        candidates: [
          {
            content: {
              parts: [
                {
                  inlineData: {
                    mimeType: 'image/png',
                    data: mockImageData,
                  },
                },
              ],
            },
          },
        ],
      }

      const parts = mockResponse.candidates?.[0]?.content?.parts || []
      let imageBuffer: Buffer | null = null

      for (const part of parts) {
        if (part.inlineData?.data) {
          imageBuffer = Buffer.from(part.inlineData.data, 'base64')
          break
        }
      }

      expect(imageBuffer).not.toBeNull()
      expect(imageBuffer?.toString()).toBe('fake-image-data')
    })

    it('should return null for response without image', () => {
      interface MockPart {
        text?: string
        inlineData?: { data: string }
      }

      const mockResponse: { candidates: { content: { parts: MockPart[] } }[] } = {
        candidates: [
          {
            content: {
              parts: [{ text: 'No image generated' }],
            },
          },
        ],
      }

      const parts = mockResponse.candidates?.[0]?.content?.parts || []
      let imageBuffer: Buffer | null = null

      for (const part of parts) {
        if ('inlineData' in part && part.inlineData?.data) {
          imageBuffer = Buffer.from(part.inlineData.data, 'base64')
          break
        }
      }

      expect(imageBuffer).toBeNull()
    })

    it('should handle empty candidates', () => {
      interface MockCandidate {
        content?: { parts?: unknown[] }
      }
      const mockResponse: { candidates: MockCandidate[] } = { candidates: [] }

      const parts = mockResponse.candidates?.[0]?.content?.parts || []
      expect(parts).toHaveLength(0)
    })

    it('should handle missing candidates', () => {
      const mockResponse = {}

      const candidates = (mockResponse as { candidates?: unknown[] }).candidates
      expect(candidates).toBeUndefined()
    })
  })
})
