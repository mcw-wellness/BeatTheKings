import { describe, it, expect } from 'vitest'
import {
  validateAvatarInput,
  validateAvatarUpdateInput,
  VALID_SKIN_TONES,
  VALID_HAIR_STYLES,
  VALID_HAIR_COLORS,
} from '@/lib/avatar'

describe('Avatar Unit Tests', () => {
  describe('validateAvatarInput', () => {
    it('should validate correct input', () => {
      const result = validateAvatarInput({
        skinTone: 'medium',
        hairStyle: 'short',
        hairColor: 'black',
      })

      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.data.skinTone).toBe('medium')
        expect(result.data.hairStyle).toBe('short')
        expect(result.data.hairColor).toBe('black')
      }
    })

    it('should reject null/undefined input', () => {
      expect(validateAvatarInput(null).valid).toBe(false)
      expect(validateAvatarInput(undefined).valid).toBe(false)
    })

    it('should reject non-object input', () => {
      expect(validateAvatarInput('string').valid).toBe(false)
      expect(validateAvatarInput(123).valid).toBe(false)
    })

    describe('skinTone validation', () => {
      it('should require skinTone', () => {
        const result = validateAvatarInput({
          hairStyle: 'short',
          hairColor: 'black',
        })
        expect(result.valid).toBe(false)
        if (!result.valid) {
          expect(result.errors.skinTone).toBe('Skin tone is required')
        }
      })

      it('should reject invalid skinTone', () => {
        const result = validateAvatarInput({
          skinTone: 'invalid',
          hairStyle: 'short',
          hairColor: 'black',
        })
        expect(result.valid).toBe(false)
        if (!result.valid) {
          expect(result.errors.skinTone).toContain('Invalid skin tone')
        }
      })

      it.each(VALID_SKIN_TONES)('should accept valid skinTone: %s', (skinTone) => {
        const result = validateAvatarInput({
          skinTone,
          hairStyle: 'short',
          hairColor: 'black',
        })
        expect(result.valid).toBe(true)
      })
    })

    describe('hairStyle validation', () => {
      it('should require hairStyle', () => {
        const result = validateAvatarInput({
          skinTone: 'medium',
          hairColor: 'black',
        })
        expect(result.valid).toBe(false)
        if (!result.valid) {
          expect(result.errors.hairStyle).toBe('Hair style is required')
        }
      })

      it('should reject invalid hairStyle', () => {
        const result = validateAvatarInput({
          skinTone: 'medium',
          hairStyle: 'invalid',
          hairColor: 'black',
        })
        expect(result.valid).toBe(false)
        if (!result.valid) {
          expect(result.errors.hairStyle).toContain('Invalid hair style')
        }
      })

      it.each(VALID_HAIR_STYLES)('should accept valid hairStyle: %s', (hairStyle) => {
        const result = validateAvatarInput({
          skinTone: 'medium',
          hairStyle,
          hairColor: 'black',
        })
        expect(result.valid).toBe(true)
      })
    })

    describe('hairColor validation', () => {
      it('should require hairColor', () => {
        const result = validateAvatarInput({
          skinTone: 'medium',
          hairStyle: 'short',
        })
        expect(result.valid).toBe(false)
        if (!result.valid) {
          expect(result.errors.hairColor).toBe('Hair color is required')
        }
      })

      it('should reject invalid hairColor', () => {
        const result = validateAvatarInput({
          skinTone: 'medium',
          hairStyle: 'short',
          hairColor: 'invalid',
        })
        expect(result.valid).toBe(false)
        if (!result.valid) {
          expect(result.errors.hairColor).toContain('Invalid hair color')
        }
      })

      it.each(VALID_HAIR_COLORS)('should accept valid hairColor: %s', (hairColor) => {
        const result = validateAvatarInput({
          skinTone: 'medium',
          hairStyle: 'short',
          hairColor,
        })
        expect(result.valid).toBe(true)
      })
    })

    it('should return multiple errors for multiple invalid fields', () => {
      const result = validateAvatarInput({
        skinTone: 'invalid',
        hairStyle: 'invalid',
        hairColor: 'invalid',
      })
      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(Object.keys(result.errors)).toHaveLength(3)
        expect(result.errors.skinTone).toBeDefined()
        expect(result.errors.hairStyle).toBeDefined()
        expect(result.errors.hairColor).toBeDefined()
      }
    })
  })

  describe('validateAvatarUpdateInput', () => {
    it('should validate partial update with only skinTone', () => {
      const result = validateAvatarUpdateInput({ skinTone: 'dark' })
      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.data.skinTone).toBe('dark')
        expect(result.data.hairStyle).toBeUndefined()
        expect(result.data.hairColor).toBeUndefined()
      }
    })

    it('should validate partial update with only hairStyle', () => {
      const result = validateAvatarUpdateInput({ hairStyle: 'afro' })
      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.data.hairStyle).toBe('afro')
      }
    })

    it('should validate partial update with only hairColor', () => {
      const result = validateAvatarUpdateInput({ hairColor: 'blonde' })
      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.data.hairColor).toBe('blonde')
      }
    })

    it('should validate full update', () => {
      const result = validateAvatarUpdateInput({
        skinTone: 'light',
        hairStyle: 'long',
        hairColor: 'red',
      })
      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.data.skinTone).toBe('light')
        expect(result.data.hairStyle).toBe('long')
        expect(result.data.hairColor).toBe('red')
      }
    })

    it('should reject empty update', () => {
      const result = validateAvatarUpdateInput({})
      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.errors._form).toBe('At least one field is required')
      }
    })

    it('should reject null/undefined input', () => {
      expect(validateAvatarUpdateInput(null).valid).toBe(false)
      expect(validateAvatarUpdateInput(undefined).valid).toBe(false)
    })

    it('should reject invalid skinTone in update', () => {
      const result = validateAvatarUpdateInput({ skinTone: 'invalid' })
      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.errors.skinTone).toContain('Invalid skin tone')
      }
    })

    it('should reject invalid hairStyle in update', () => {
      const result = validateAvatarUpdateInput({ hairStyle: 'invalid' })
      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.errors.hairStyle).toContain('Invalid hair style')
      }
    })

    it('should reject invalid hairColor in update', () => {
      const result = validateAvatarUpdateInput({ hairColor: 'invalid' })
      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.errors.hairColor).toContain('Invalid hair color')
      }
    })

    it('should reject non-string values', () => {
      const result = validateAvatarUpdateInput({ skinTone: 123 })
      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.errors.skinTone).toBe('Skin tone must be a string')
      }
    })
  })

  describe('Constants', () => {
    it('should have 5 valid skin tones', () => {
      expect(VALID_SKIN_TONES).toHaveLength(5)
      expect(VALID_SKIN_TONES).toContain('light')
      expect(VALID_SKIN_TONES).toContain('medium-light')
      expect(VALID_SKIN_TONES).toContain('medium')
      expect(VALID_SKIN_TONES).toContain('medium-dark')
      expect(VALID_SKIN_TONES).toContain('dark')
    })

    it('should have 8 valid hair styles', () => {
      expect(VALID_HAIR_STYLES).toHaveLength(8)
      expect(VALID_HAIR_STYLES).toContain('short')
      expect(VALID_HAIR_STYLES).toContain('medium')
      expect(VALID_HAIR_STYLES).toContain('long')
      expect(VALID_HAIR_STYLES).toContain('bald')
      expect(VALID_HAIR_STYLES).toContain('afro')
      expect(VALID_HAIR_STYLES).toContain('braids')
      expect(VALID_HAIR_STYLES).toContain('dreads')
      expect(VALID_HAIR_STYLES).toContain('mohawk')
    })

    it('should have 6 valid hair colors', () => {
      expect(VALID_HAIR_COLORS).toHaveLength(6)
      expect(VALID_HAIR_COLORS).toContain('black')
      expect(VALID_HAIR_COLORS).toContain('brown')
      expect(VALID_HAIR_COLORS).toContain('blonde')
      expect(VALID_HAIR_COLORS).toContain('red')
      expect(VALID_HAIR_COLORS).toContain('gray')
      expect(VALID_HAIR_COLORS).toContain('white')
    })
  })
})
