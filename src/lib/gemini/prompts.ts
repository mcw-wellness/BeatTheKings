/**
 * All Gemini AI Prompts
 * Centralized location for easy editing and maintenance
 */

import type { AvatarPromptInput, AgeGroup } from './types'

// =============================================================================
// AVATAR PROMPTS
// =============================================================================

/**
 * Base style for all avatar generations
 * Matches the Trump Card design - cartoon sports card style
 */
const AVATAR_BASE_STYLE = `
High quality cartoon sports avatar illustration in mobile game trading card style,
vibrant warm golden lighting, clean vector-like art with smooth gradients,
full body standing pose in basketball arena/stadium background with crowd,
similar to NBA 2K mobile card art, detailed character design,
golden frame aesthetic, warm amber tones in background
`.trim()

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
 * Get outfit description based on sport
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
export function buildAvatarPrompt(input: AvatarPromptInput): string {
  const sport = input.sport || 'basketball'
  const ageDesc = getAgeDescription(input.ageGroup)

  const character = `
    ${input.gender} ${ageDesc} with ${input.skinTone} skin tone,
    ${input.hairStyle} ${input.hairColor} hair
  `.trim()

  const outfit = getOutfitDescription(sport, input.jerseyNumber)

  return `${AVATAR_BASE_STYLE}. ${character}. ${outfit}.`
}

/**
 * Build prompt for avatar generation WITH reference photo
 * Creates an avatar that resembles the person in the photo
 */
export function buildAvatarPromptWithPhoto(input: AvatarPromptInput): string {
  const sport = input.sport || 'basketball'
  const outfit = getOutfitDescription(sport, input.jerseyNumber)

  return `Create a high-quality cartoon sports avatar illustration based on the person in this photo.

CRITICAL REQUIREMENTS:
1. The avatar MUST closely resemble the person's facial features, face shape, and overall appearance
2. Keep the same hairstyle, hair color, and skin tone as the person in the photo
3. Maintain recognizable likeness while converting to cartoon/illustrated style

STYLE:
- Mobile game trading card style (like NBA 2K cards)
- Vibrant warm golden lighting
- Clean vector-like art with smooth gradients
- Full body standing pose
- Basketball arena/stadium background with crowd
- Golden frame aesthetic, warm amber tones

OUTFIT:
${outfit}

Generate an avatar that someone would immediately recognize as the person in the photo, but in an illustrated sports card style.`
}

/**
 * Build prompt for default avatars (used in setup script)
 */
export function buildDefaultAvatarPrompt(gender: string, sport: string): string {
  const facialHair = gender === 'male' ? ', well-groomed short beard' : ''
  const character = `${gender} athlete with medium brown skin tone, athletic muscular build, short black hair${facialHair}, friendly confident expression`
  const outfit = getOutfitDescription(sport)

  return `${AVATAR_BASE_STYLE}. ${character}. ${outfit}.`
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

// =============================================================================
// VIDEO ANALYSIS PROMPTS
// =============================================================================

/**
 * Prompt for analyzing 1v1 basketball match videos
 * Based on client feedback - uses multimodal analysis (audio + video)
 */
export const MATCH_ANALYSIS_PROMPT = `Role:
You are a high-precision Sports Video Analyst specializing in basketball. Your task is to audit a video file frame-by-frame to count shot attempts and made baskets with 100% accuracy for a 1v1 basketball match.

Critical Instructions for Accuracy:

1. MULTIMODAL ANALYSIS (AUDIO & VIDEO):
   - You MUST listen to the audio track and you MUST analyze the video track.
   - Listen specifically for the "swish" sound (ball hitting the net only) vs. the "clank" sound (ball hitting the rim).
   - A "swish" sound is a strong indicator of a MADE basket, even if the visual angle is tricky.

2. PHYSICS & NET MOVEMENT:
   - Watch the net closely. If the net "splashes" upwards or expands outwards, the ball has passed through it.
   - Do not confuse a ball bouncing off the rim (Miss) with a ball passing through the net quickly (Make).

3. PLAYER IDENTIFICATION:
   - There are 2 players in this 1v1 match.
   - Player 1 is the one who appears first or starts with the ball.
   - Player 2 is the opponent.
   - Track shots separately for each player.

4. SHOT COUNT:
   - Analyze each shot attempt individually.
   - Count both 2-point shots (inside the arc) and 3-point shots (outside the arc) if visible.
   - Each made shot inside = 2 points, outside = 3 points.

Task:
Analyze the entire video and count all shot attempts and makes for both players.

Output Format:
Return ONLY a JSON object with this exact structure, no additional text:

{
  "player1Score": <total points for player 1>,
  "player2Score": <total points for player 2>,
  "player1ShotsMade": <number of successful shots by player 1>,
  "player1ShotsAttempted": <total shot attempts by player 1>,
  "player2ShotsMade": <number of successful shots by player 2>,
  "player2ShotsAttempted": <total shot attempts by player 2>,
  "durationSeconds": <approximate video duration in seconds>,
  "confidence": <number between 0 and 1 indicating analysis confidence>
}`
