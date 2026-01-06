import { describe, it, expect } from 'vitest'
import {
  buildAvatarPrompt,
  buildDefaultAvatarPrompt,
  DEFAULT_AVATARS,
  type AvatarPromptInput,
} from '@/lib/avatar/prompts'

describe('Avatar Prompts', () => {
  describe('buildAvatarPrompt', () => {
    it('should build prompt with all required fields', () => {
      const input: AvatarPromptInput = {
        gender: 'male',
        skinTone: 'medium',
        hairStyle: 'short',
        hairColor: 'black',
      }

      const prompt = buildAvatarPrompt(input)

      expect(prompt).toContain('male')
      expect(prompt).toContain('athlete')
      expect(prompt).toContain('medium skin tone')
      expect(prompt).toContain('short black hair')
      expect(prompt).toContain('basketball') // default sport
    })

    it('should include basketball outfit by default', () => {
      const input: AvatarPromptInput = {
        gender: 'female',
        skinTone: 'dark',
        hairStyle: 'braids',
        hairColor: 'black',
      }

      const prompt = buildAvatarPrompt(input)

      expect(prompt).toContain('basketball jersey')
      expect(prompt).toContain('basketball shoes')
      expect(prompt).toContain('spinning basketball')
    })

    it('should include soccer outfit when sport is soccer', () => {
      const input: AvatarPromptInput = {
        gender: 'male',
        skinTone: 'light',
        hairStyle: 'short',
        hairColor: 'blonde',
        sport: 'soccer',
      }

      const prompt = buildAvatarPrompt(input)

      expect(prompt).toContain('soccer jersey')
      expect(prompt).toContain('cleats')
      expect(prompt).toContain('soccer ball')
    })

    it('should include base style keywords', () => {
      const input: AvatarPromptInput = {
        gender: 'male',
        skinTone: 'medium',
        hairStyle: 'afro',
        hairColor: 'black',
      }

      const prompt = buildAvatarPrompt(input)

      expect(prompt.toLowerCase()).toContain('cartoon')
      expect(prompt).toContain('card style')
      expect(prompt).toContain('full body')
      expect(prompt).toContain('stadium background')
    })

    it('should handle different skin tones', () => {
      const skinTones = ['light', 'medium-light', 'medium', 'medium-dark', 'dark']

      skinTones.forEach((skinTone) => {
        const prompt = buildAvatarPrompt({
          gender: 'male',
          skinTone,
          hairStyle: 'short',
          hairColor: 'black',
        })

        expect(prompt).toContain(`${skinTone} skin tone`)
      })
    })

    it('should handle different hair styles', () => {
      const hairStyles = ['short', 'medium', 'long', 'bald', 'afro', 'braids', 'dreads', 'mohawk']

      hairStyles.forEach((hairStyle) => {
        const prompt = buildAvatarPrompt({
          gender: 'female',
          skinTone: 'medium',
          hairStyle,
          hairColor: 'brown',
        })

        expect(prompt).toContain(hairStyle)
      })
    })

    it('should handle different hair colors', () => {
      const hairColors = ['black', 'brown', 'blonde', 'red', 'gray', 'white']

      hairColors.forEach((hairColor) => {
        const prompt = buildAvatarPrompt({
          gender: 'male',
          skinTone: 'medium',
          hairStyle: 'short',
          hairColor,
        })

        expect(prompt).toContain(hairColor)
      })
    })
  })

  describe('buildDefaultAvatarPrompt', () => {
    it('should build prompt for male basketball player', () => {
      const prompt = buildDefaultAvatarPrompt('male', 'basketball')

      expect(prompt).toContain('male athlete')
      expect(prompt).toContain('medium brown skin tone')
      expect(prompt).toContain('short black hair')
      expect(prompt).toContain('basketball jersey')
    })

    it('should build prompt for female basketball player', () => {
      const prompt = buildDefaultAvatarPrompt('female', 'basketball')

      expect(prompt).toContain('female athlete')
      expect(prompt).toContain('basketball jersey')
    })

    it('should build prompt for male soccer player', () => {
      const prompt = buildDefaultAvatarPrompt('male', 'soccer')

      expect(prompt).toContain('male athlete')
      expect(prompt).toContain('soccer jersey')
      expect(prompt).toContain('cleats')
    })

    it('should build prompt for female soccer player', () => {
      const prompt = buildDefaultAvatarPrompt('female', 'soccer')

      expect(prompt).toContain('female athlete')
      expect(prompt).toContain('soccer jersey')
    })

    it('should include base style keywords', () => {
      const prompt = buildDefaultAvatarPrompt('male', 'basketball')

      expect(prompt.toLowerCase()).toContain('cartoon')
      expect(prompt).toContain('card style')
      expect(prompt).toContain('stadium background')
    })
  })

  describe('DEFAULT_AVATARS', () => {
    it('should have 4 default avatar configurations', () => {
      expect(DEFAULT_AVATARS).toHaveLength(4)
    })

    it('should have basketball male avatar', () => {
      const avatar = DEFAULT_AVATARS.find((a) => a.gender === 'male' && a.sport === 'basketball')
      expect(avatar).toBeDefined()
      expect(avatar?.fileName).toBe('basketball_male.png')
    })

    it('should have basketball female avatar', () => {
      const avatar = DEFAULT_AVATARS.find((a) => a.gender === 'female' && a.sport === 'basketball')
      expect(avatar).toBeDefined()
      expect(avatar?.fileName).toBe('basketball_female.png')
    })

    it('should have soccer male avatar', () => {
      const avatar = DEFAULT_AVATARS.find((a) => a.gender === 'male' && a.sport === 'soccer')
      expect(avatar).toBeDefined()
      expect(avatar?.fileName).toBe('soccer_male.png')
    })

    it('should have soccer female avatar', () => {
      const avatar = DEFAULT_AVATARS.find((a) => a.gender === 'female' && a.sport === 'soccer')
      expect(avatar).toBeDefined()
      expect(avatar?.fileName).toBe('soccer_female.png')
    })

    it('should have valid file names for all avatars', () => {
      DEFAULT_AVATARS.forEach((avatar) => {
        expect(avatar.fileName).toMatch(/^(basketball|soccer)_(male|female)\.png$/)
      })
    })
  })
})
