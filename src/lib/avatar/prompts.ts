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
}

/**
 * Base style for all avatar generations
 */
const BASE_STYLE = `
Cartoon sports avatar illustration, mobile game card style,
vibrant colors, clean vector-like art, full body standing pose,
stadium background, similar to NBA 2K or FIFA mobile card art style,
high quality, detailed, white background
`.trim()

/**
 * Get outfit description based on sport
 */
function getOutfitDescription(sport: string): string {
  switch (sport) {
    case 'soccer':
      return 'wearing red soccer jersey with number 10, white shorts, black cleats, foot on soccer ball, confident pose'
    case 'basketball':
    default:
      return 'wearing blue basketball jersey with number 23, blue shorts, white high-top basketball shoes, holding basketball, confident pose'
  }
}

/**
 * Build prompt for user's custom avatar
 */
export function buildUserAvatarPrompt(input: AvatarPromptInput): string {
  const sport = input.sport || 'basketball'

  const character = `
    ${input.gender} athlete with ${input.skinTone} skin tone,
    athletic build,
    ${input.hairStyle} ${input.hairColor} hair
  `.trim()

  const outfit = getOutfitDescription(sport)

  return `${BASE_STYLE}. ${character}. ${outfit}.`
}

/**
 * Build prompt for default avatars (used in setup script)
 */
export function buildDefaultAvatarPrompt(gender: string, sport: string): string {
  const character = `${gender} athlete with medium skin tone, athletic build, short black hair`
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
