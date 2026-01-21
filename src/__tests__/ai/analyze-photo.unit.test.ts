/**
 * Photo Analysis Unit Tests
 * Tests for Gemini-based photo analysis for avatar generation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the Gemini client module
vi.mock('@/lib/gemini/client', () => ({
  isGeminiConfigured: vi.fn(),
  getGeminiClient: vi.fn(),
}))

// Mock logger
vi.mock('@/lib/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

import { analyzePhotoForAvatar, type PhotoFeatures } from '@/lib/ai/analyze-photo'
import { isGeminiConfigured, getGeminiClient } from '@/lib/gemini/client'

describe('Photo Analysis Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('analyzePhotoForAvatar', () => {
    const DEFAULT_FEATURES: PhotoFeatures = {
      skinTone: 'medium',
      hairStyle: 'short',
      hairColor: 'black',
      gender: 'male',
    }

    it('should return default features when Gemini is not configured', async () => {
      vi.mocked(isGeminiConfigured).mockReturnValue(false)

      const result = await analyzePhotoForAvatar('base64ImageData')

      expect(result).toEqual(DEFAULT_FEATURES)
      expect(isGeminiConfigured).toHaveBeenCalled()
      expect(getGeminiClient).not.toHaveBeenCalled()
    })

    it('should call Gemini API when configured', async () => {
      vi.mocked(isGeminiConfigured).mockReturnValue(true)
      const mockGenerateContent = vi.fn().mockResolvedValue({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    skinTone: 'dark',
                    hairStyle: 'afro',
                    hairColor: 'black',
                    gender: 'male',
                  }),
                },
              ],
            },
          },
        ],
      })
      vi.mocked(getGeminiClient).mockReturnValue({
        models: { generateContent: mockGenerateContent },
      } as unknown as ReturnType<typeof getGeminiClient>)

      const result = await analyzePhotoForAvatar('base64ImageData')

      expect(result.skinTone).toBe('dark')
      expect(result.hairStyle).toBe('afro')
      expect(result.hairColor).toBe('black')
      expect(result.gender).toBe('male')
    })

    it('should strip data URL prefix from base64 image', async () => {
      vi.mocked(isGeminiConfigured).mockReturnValue(true)
      const mockGenerateContent = vi.fn().mockResolvedValue({
        candidates: [
          {
            content: {
              parts: [{ text: JSON.stringify(DEFAULT_FEATURES) }],
            },
          },
        ],
      })
      vi.mocked(getGeminiClient).mockReturnValue({
        models: { generateContent: mockGenerateContent },
      } as unknown as ReturnType<typeof getGeminiClient>)

      await analyzePhotoForAvatar('data:image/jpeg;base64,actualBase64Data')

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          contents: expect.arrayContaining([
            expect.objectContaining({
              parts: expect.arrayContaining([
                expect.objectContaining({
                  inlineData: expect.objectContaining({
                    data: 'actualBase64Data',
                  }),
                }),
              ]),
            }),
          ]),
        })
      )
    })

    it('should return default features when API returns no text', async () => {
      vi.mocked(isGeminiConfigured).mockReturnValue(true)
      const mockGenerateContent = vi.fn().mockResolvedValue({
        candidates: [{ content: { parts: [] } }],
      })
      vi.mocked(getGeminiClient).mockReturnValue({
        models: { generateContent: mockGenerateContent },
      } as unknown as ReturnType<typeof getGeminiClient>)

      const result = await analyzePhotoForAvatar('base64ImageData')

      expect(result).toEqual(DEFAULT_FEATURES)
    })

    it('should return default features on API error', async () => {
      vi.mocked(isGeminiConfigured).mockReturnValue(true)
      vi.mocked(getGeminiClient).mockReturnValue({
        models: {
          generateContent: vi.fn().mockRejectedValue(new Error('API Error')),
        },
      } as unknown as ReturnType<typeof getGeminiClient>)

      const result = await analyzePhotoForAvatar('base64ImageData')

      expect(result).toEqual(DEFAULT_FEATURES)
    })

    it('should handle JSON wrapped in markdown code blocks', async () => {
      vi.mocked(isGeminiConfigured).mockReturnValue(true)
      const mockGenerateContent = vi.fn().mockResolvedValue({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: '```json\n{"skinTone":"light","hairStyle":"long","hairColor":"blonde","gender":"female"}\n```',
                },
              ],
            },
          },
        ],
      })
      vi.mocked(getGeminiClient).mockReturnValue({
        models: { generateContent: mockGenerateContent },
      } as unknown as ReturnType<typeof getGeminiClient>)

      const result = await analyzePhotoForAvatar('base64ImageData')

      expect(result.skinTone).toBe('light')
      expect(result.hairStyle).toBe('long')
      expect(result.hairColor).toBe('blonde')
      expect(result.gender).toBe('female')
    })

    it('should return default features for invalid JSON response', async () => {
      vi.mocked(isGeminiConfigured).mockReturnValue(true)
      const mockGenerateContent = vi.fn().mockResolvedValue({
        candidates: [
          {
            content: {
              parts: [{ text: 'This is not valid JSON' }],
            },
          },
        ],
      })
      vi.mocked(getGeminiClient).mockReturnValue({
        models: { generateContent: mockGenerateContent },
      } as unknown as ReturnType<typeof getGeminiClient>)

      const result = await analyzePhotoForAvatar('base64ImageData')

      expect(result).toEqual(DEFAULT_FEATURES)
    })
  })

  describe('Feature Validation', () => {
    beforeEach(() => {
      vi.mocked(isGeminiConfigured).mockReturnValue(true)
    })

    it('should validate and normalize invalid skinTone', async () => {
      const mockGenerateContent = vi.fn().mockResolvedValue({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    skinTone: 'invalid',
                    hairStyle: 'short',
                    hairColor: 'black',
                    gender: 'male',
                  }),
                },
              ],
            },
          },
        ],
      })
      vi.mocked(getGeminiClient).mockReturnValue({
        models: { generateContent: mockGenerateContent },
      } as unknown as ReturnType<typeof getGeminiClient>)

      const result = await analyzePhotoForAvatar('base64ImageData')

      expect(result.skinTone).toBe('medium') // Default fallback
    })

    it('should validate and normalize invalid hairStyle', async () => {
      const mockGenerateContent = vi.fn().mockResolvedValue({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    skinTone: 'dark',
                    hairStyle: 'invalid-style',
                    hairColor: 'black',
                    gender: 'male',
                  }),
                },
              ],
            },
          },
        ],
      })
      vi.mocked(getGeminiClient).mockReturnValue({
        models: { generateContent: mockGenerateContent },
      } as unknown as ReturnType<typeof getGeminiClient>)

      const result = await analyzePhotoForAvatar('base64ImageData')

      expect(result.hairStyle).toBe('short') // Default fallback
    })

    it('should validate and normalize invalid hairColor', async () => {
      const mockGenerateContent = vi.fn().mockResolvedValue({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    skinTone: 'medium',
                    hairStyle: 'short',
                    hairColor: 'purple',
                    gender: 'male',
                  }),
                },
              ],
            },
          },
        ],
      })
      vi.mocked(getGeminiClient).mockReturnValue({
        models: { generateContent: mockGenerateContent },
      } as unknown as ReturnType<typeof getGeminiClient>)

      const result = await analyzePhotoForAvatar('base64ImageData')

      expect(result.hairColor).toBe('black') // Default fallback
    })

    it('should validate and normalize invalid gender', async () => {
      const mockGenerateContent = vi.fn().mockResolvedValue({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    skinTone: 'medium',
                    hairStyle: 'short',
                    hairColor: 'black',
                    gender: 'other',
                  }),
                },
              ],
            },
          },
        ],
      })
      vi.mocked(getGeminiClient).mockReturnValue({
        models: { generateContent: mockGenerateContent },
      } as unknown as ReturnType<typeof getGeminiClient>)

      const result = await analyzePhotoForAvatar('base64ImageData')

      expect(result.gender).toBe('male') // Default fallback
    })

    it('should accept all valid skinTone values', async () => {
      const validSkinTones = ['light', 'medium-light', 'medium', 'medium-dark', 'dark']

      for (const skinTone of validSkinTones) {
        vi.mocked(getGeminiClient).mockReturnValue({
          models: {
            generateContent: vi.fn().mockResolvedValue({
              candidates: [
                {
                  content: {
                    parts: [
                      {
                        text: JSON.stringify({
                          skinTone,
                          hairStyle: 'short',
                          hairColor: 'black',
                          gender: 'male',
                        }),
                      },
                    ],
                  },
                },
              ],
            }),
          },
        } as unknown as ReturnType<typeof getGeminiClient>)

        const result = await analyzePhotoForAvatar('base64ImageData')
        expect(result.skinTone).toBe(skinTone)
      }
    })

    it('should accept all valid hairStyle values', async () => {
      const validHairStyles = [
        'short',
        'medium',
        'long',
        'bald',
        'afro',
        'braids',
        'dreads',
        'mohawk',
      ]

      for (const hairStyle of validHairStyles) {
        vi.mocked(getGeminiClient).mockReturnValue({
          models: {
            generateContent: vi.fn().mockResolvedValue({
              candidates: [
                {
                  content: {
                    parts: [
                      {
                        text: JSON.stringify({
                          skinTone: 'medium',
                          hairStyle,
                          hairColor: 'black',
                          gender: 'male',
                        }),
                      },
                    ],
                  },
                },
              ],
            }),
          },
        } as unknown as ReturnType<typeof getGeminiClient>)

        const result = await analyzePhotoForAvatar('base64ImageData')
        expect(result.hairStyle).toBe(hairStyle)
      }
    })

    it('should accept all valid hairColor values', async () => {
      const validHairColors = ['black', 'brown', 'blonde', 'red', 'gray', 'white']

      for (const hairColor of validHairColors) {
        vi.mocked(getGeminiClient).mockReturnValue({
          models: {
            generateContent: vi.fn().mockResolvedValue({
              candidates: [
                {
                  content: {
                    parts: [
                      {
                        text: JSON.stringify({
                          skinTone: 'medium',
                          hairStyle: 'short',
                          hairColor,
                          gender: 'male',
                        }),
                      },
                    ],
                  },
                },
              ],
            }),
          },
        } as unknown as ReturnType<typeof getGeminiClient>)

        const result = await analyzePhotoForAvatar('base64ImageData')
        expect(result.hairColor).toBe(hairColor)
      }
    })

    it('should accept both male and female gender values', async () => {
      for (const gender of ['male', 'female']) {
        vi.mocked(getGeminiClient).mockReturnValue({
          models: {
            generateContent: vi.fn().mockResolvedValue({
              candidates: [
                {
                  content: {
                    parts: [
                      {
                        text: JSON.stringify({
                          skinTone: 'medium',
                          hairStyle: 'short',
                          hairColor: 'black',
                          gender,
                        }),
                      },
                    ],
                  },
                },
              ],
            }),
          },
        } as unknown as ReturnType<typeof getGeminiClient>)

        const result = await analyzePhotoForAvatar('base64ImageData')
        expect(result.gender).toBe(gender)
      }
    })
  })

  describe('PhotoFeatures Type', () => {
    it('should have correct structure', () => {
      const features: PhotoFeatures = {
        skinTone: 'medium',
        hairStyle: 'short',
        hairColor: 'black',
        gender: 'male',
      }

      expect(features).toHaveProperty('skinTone')
      expect(features).toHaveProperty('hairStyle')
      expect(features).toHaveProperty('hairColor')
      expect(features).toHaveProperty('gender')
    })
  })
})
