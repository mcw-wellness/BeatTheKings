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
 * Dark gradient background matching app theme
 */
const AVATAR_BASE_STYLE = `
CRITICAL: Generate a FULL BODY sports athlete illustration showing the ENTIRE person from HEAD TO FEET.

STYLE REQUIREMENTS:
- Semi-realistic cartoon style (like NBA 2K mobile trading cards)
- NOT emoji style, NOT chibi, NOT cute cartoon, NOT just a face/bust
- Professional sports game character art quality
- Clean digital illustration with smooth shading
- Dark purple/navy gradient background (#1a1a2e to #16213e)
- Character should fill 80% of the image height
- Character centered in frame

EXACT POSE (MUST follow this exactly):
- Standing straight, facing directly forward (front view)
- Arms relaxed at sides, hands slightly away from body (not touching thighs)
- Feet shoulder-width apart, both feet flat on ground
- Confident but relaxed posture
- Head facing forward, looking at camera
- NO action poses, NO dynamic movement, NO holding balls
- This is a static character portrait pose

PHYSICAL FEATURES TO INCLUDE:
- Realistic athletic body type (lean, fit, muscular as appropriate)
- Natural athletic proportions
- Glasses if specified
- Facial hair if specified

ALWAYS WEAR SPORTS OUTFIT - never copy person's actual clothing

DO NOT generate:
- Just a face or head shot
- Emoji-style art
- Chibi or cute style
- The person's actual clothes (always sports uniform)
- Only upper body
- Action poses or dynamic movement
- Hands in pockets or crossed arms
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
  const number = jerseyNumber ?? 9
  switch (sport) {
    case 'soccer':
      return `FULL OUTFIT (must show all):
        - Red soccer jersey with gold trim, number ${number} on front
        - White shorts with red stripe down the sides
        - Black soccer cleats with gold accents
        - Black athletic socks`
    case 'basketball':
    default:
      return `FULL OUTFIT (must show all):
        - Navy blue basketball jersey with gold/yellow trim, number ${number} on front
        - Matching navy blue basketball shorts with gold stripes down the sides
        - Navy blue and gold high-top basketball sneakers
        - Black athletic socks`
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

  return `Create a FULL BODY sports athlete illustration that LOOKS LIKE this specific person.

CRITICAL - MATCH THESE FACIAL FEATURES EXACTLY:
- Face shape (oval, round, square, heart, oblong) - MUST match
- Forehead shape and size - MUST match
- Eye shape, size, and spacing - MUST match
- Nose shape and size - MUST match
- Ear shape and size - MUST match
- Lip shape (thin, medium, full) - MUST match
- Chin shape (pointed, square, round) - MUST match
- Jawline (defined, soft, angular) - MUST match
- Skin tone - MUST match
- Hair style and color - MUST match
- Body type and build - MUST match
- Glasses (if worn) - MUST include
- Facial hair (if any) - MUST include

STYLE REQUIREMENTS:
- MUST show FULL BODY from head to feet
- Semi-realistic cartoon style (like NBA 2K mobile cards)
- Professional sports game character art quality
- Dark purple/navy gradient background (#1a1a2e to #16213e)
- Character should fill 80% of the image height
- Character centered in frame

EXACT POSE (MUST follow this exactly for ALL avatars):
- Standing straight, facing directly forward (front view)
- Arms relaxed at sides, hands slightly away from body (not touching thighs)
- Feet shoulder-width apart, both feet flat on ground
- Confident but relaxed posture
- Head facing forward, looking at camera
- NO action poses, NO dynamic movement, NO holding balls
- This is a static character portrait pose

OUTFIT (always use this, ignore person's actual clothes):
${outfit}

DO NOT generate:
- Just a face or head shot
- Emoji-style art
- The person's actual clothing
- Only upper body
- Generic face that doesn't match the person
- Action poses or dynamic movement
- Hands in pockets or crossed arms

The avatar MUST be recognizable as the same person from the photo, just in cartoon sports style.`
}

/**
 * Build prompt for default avatars (used in setup script)
 */
export function buildDefaultAvatarPrompt(gender: string, sport: string): string {
  const facialHair = gender === 'male' ? ', well-groomed short beard' : ''
  const character = `${gender} athlete with medium brown skin tone, athletic muscular build, short black hair${facialHair}, friendly confident expression`
  const outfit = getOutfitDescription(sport)

  return `${AVATAR_BASE_STYLE}

CHARACTER: ${character}

${outfit}`
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
