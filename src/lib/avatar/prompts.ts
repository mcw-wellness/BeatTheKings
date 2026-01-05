/**
 * Avatar Generation Prompts
 * All AI prompts for avatar generation in one place for easy editing
 */

export interface AvatarPromptInput {
  gender: string
  skinTone: string
  hairStyle: string
  hairColor: string
  sport?: string
  ageGroup?: string
  jerseyNumber?: number
}

/**
 * Age groups for avatar styling
 */
export type AgeGroup = 'under-18' | '18-30' | '31+'

/**
 * Calculate age group from date of birth
 */
export function calculateAgeGroup(dateOfBirth: Date | string): AgeGroup {
  const dob = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth
  const today = new Date()
  let age = today.getFullYear() - dob.getFullYear()
  const monthDiff = today.getMonth() - dob.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--
  }

  if (age < 18) return 'under-18'
  if (age <= 30) return '18-30'
  return '31+'
}

/**
 * Get age-based description for avatar
 */
function getAgeDescription(ageGroup?: string): string {
  switch (ageGroup) {
    case 'under-18':
      return 'young teenage athlete, youthful energetic appearance, lean athletic build'
    case '31+':
      return 'mature experienced athlete, confident seasoned appearance, strong athletic build'
    case '18-30':
    default:
      return 'young adult athlete in prime athletic form, fit muscular build'
  }
}

/**
 * Base style for all avatar generations
 * Matches the Trump Card design - cartoon sports card style
 */
const BASE_STYLE = `
High quality cartoon sports avatar illustration in mobile game trading card style,
vibrant warm golden lighting, clean vector-like art with smooth gradients,
full body standing pose in basketball arena/stadium background with crowd,
similar to NBA 2K mobile card art, detailed character design,
golden frame aesthetic, warm amber tones in background
`.trim()

/**
 * Get outfit description based on sport
 * Basketball: Warriors-style blue/gold, Soccer: Classic kit
 */
function getOutfitDescription(sport: string, jerseyNumber?: number): string {
  const number = jerseyNumber ?? 10
  switch (sport) {
    case 'soccer':
      return `wearing red soccer jersey with gold trim and number ${number} clearly visible on back and front,
        white shorts with red stripe, black soccer cleats with gold accents,
        one foot on soccer ball, confident athletic pose, arms crossed`
    case 'basketball':
    default:
      return `wearing royal blue basketball jersey with gold/yellow trim and number ${number} clearly visible on back and front,
        matching blue shorts with gold stripe, white and blue high-top basketball shoes,
        doing shaka hand gesture with one hand, spinning basketball on finger with other hand,
        confident playful pose, wristbands on both wrists`
  }
}

/**
 * Build prompt for user's custom avatar
 */
export function buildUserAvatarPrompt(input: AvatarPromptInput): string {
  const sport = input.sport || 'basketball'
  const ageDesc = getAgeDescription(input.ageGroup)

  const character = `
    ${input.gender} ${ageDesc} with ${input.skinTone} skin tone,
    ${input.hairStyle} ${input.hairColor} hair
  `.trim()

  const outfit = getOutfitDescription(sport, input.jerseyNumber)

  return `${BASE_STYLE}. ${character}. ${outfit}.`
}

/**
 * Build prompt for default avatars (used in setup script)
 */
export function buildDefaultAvatarPrompt(gender: string, sport: string): string {
  const facialHair = gender === 'male' ? ', well-groomed short beard' : ''
  const character = `${gender} athlete with medium brown skin tone, athletic muscular build, short black hair${facialHair}, friendly confident expression`
  const outfit = getOutfitDescription(sport)

  return `${BASE_STYLE}. ${character}. ${outfit}.`
}

/**
 * Default avatar configurations
 */
export const DEFAULT_AVATARS = [
  { gender: 'male', sport: 'basketball', fileName: 'basketball_male.png' },
  { gender: 'female', sport: 'basketball', fileName: 'basketball_female.png' },
  { gender: 'male', sport: 'soccer', fileName: 'soccer_male.png' },
  { gender: 'female', sport: 'soccer', fileName: 'soccer_female.png' },
] as const
