/**
 * Avatar Generation using Gemini 3 Pro Image
 * Uses Gemini 3's advanced character consistency for identity preservation
 */

import * as fs from 'fs'
import * as path from 'path'
import { logger } from '@/lib/utils/logger'
import { imageClient } from './client'
import { buildAvatarPrompt } from './prompts'
import type { AvatarPromptInput } from './types'

// Gemini 3 Pro Image model for best character consistency
const IMAGE_MODEL = 'gemini-3-pro-image-preview'

// Cache the stadium background to avoid reading from disk each time
let stadiumBackgroundBase64: string | null = null

/**
 * Load the stadium background image as base64
 */
function getStadiumBackground(): string {
  if (stadiumBackgroundBase64) {
    return stadiumBackgroundBase64
  }

  const stadiumPath = path.join(process.cwd(), 'public', 'backgrounds', 'stadium.png')
  const imageBuffer = fs.readFileSync(stadiumPath)
  stadiumBackgroundBase64 = imageBuffer.toString('base64')
  logger.info('Stadium background loaded')
  return stadiumBackgroundBase64
}

/**
 * Generate an avatar image using Gemini 3 Pro Image
 * For photo-based avatars, passes the photo directly for identity preservation
 * Returns image buffer
 */
export async function generateAvatarImage(input: AvatarPromptInput): Promise<Buffer> {
  if (!imageClient) {
    throw new Error('Gemini AI is not configured. Set GEMINI_API_KEY.')
  }

  const hasReferencePhoto = !!input.referencePhoto

  try {
    let response
    const stadiumBackground = getStadiumBackground()

    if (hasReferencePhoto && input.referencePhoto) {
      // With reference photo - use Gemini 3's identity preservation
      const base64Data = input.referencePhoto.replace(/^data:image\/\w+;base64,/, '')
      const prompt = buildAvatarPromptWithReference(input)

      logger.info('Generating avatar with reference photo and stadium background')

      response = await imageClient.models.generateContent({
        model: IMAGE_MODEL,
        contents: [
          {
            role: 'user',
            parts: [
              // User's photo for identity
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: base64Data,
                },
              },
              // Stadium background
              {
                inlineData: {
                  mimeType: 'image/png',
                  data: stadiumBackground,
                },
              },
              { text: prompt },
            ],
          },
        ],
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      })
    } else {
      // Without reference photo - generate from description with stadium
      const prompt = buildAvatarPrompt(input)
      logger.info('Generating avatar with stadium background')

      response = await imageClient.models.generateContent({
        model: IMAGE_MODEL,
        contents: [
          {
            role: 'user',
            parts: [
              // Stadium background
              {
                inlineData: {
                  mimeType: 'image/png',
                  data: stadiumBackground,
                },
              },
              { text: prompt + '\n\nUse the provided stadium image as the EXACT background.' },
            ],
          },
        ],
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      })
    }

    const parts = response.candidates?.[0]?.content?.parts || []
    for (const part of parts) {
      if (part.inlineData) {
        const imageData = part.inlineData.data
        if (imageData) {
          const buffer = Buffer.from(imageData, 'base64')
          logger.info({ size: buffer.length }, 'Avatar generated successfully')
          return buffer
        }
      }
    }

    throw new Error('No image data in response')
  } catch (error) {
    logger.error({ error, hasReferencePhoto }, 'Failed to generate avatar')
    throw error
  }
}

/**
 * Convert hex color to descriptive color name for prompts
 */
function hexToColorName(hex?: string): string {
  if (!hex) return 'navy blue'

  const colorMap: Record<string, string> = {
    '#1a1a4e': 'navy blue',
    '#dc2626': 'red',
    '#16a34a': 'green',
    '#ffffff': 'white',
    '#1f2937': 'dark gray',
    '#7c3aed': 'purple',
  }

  return colorMap[hex] || 'navy blue'
}

/**
 * Build outfit description based on sport and jersey color
 */
function buildOutfitDescription(sport: string, jerseyNumber: number, jerseyColor?: string): string {
  const colorName = hexToColorName(jerseyColor)

  if (sport === 'soccer') {
    return `${colorName} soccer jersey with gold trim and number ${jerseyNumber}, matching ${colorName} shorts, black soccer cleats, black socks`
  }

  return `${colorName} basketball jersey with gold trim and number ${jerseyNumber}, matching ${colorName} shorts with gold stripes, ${colorName} and gold high-top sneakers, black socks`
}

/**
 * Build prompt for avatar generation with reference photo
 * Optimized for Gemini 3 Pro Image's identity preservation
 */
function buildAvatarPromptWithReference(input: AvatarPromptInput): string {
  const sport = input.sport || 'basketball'
  const jerseyNumber = input.jerseyNumber ?? 9
  const outfitDetails = buildOutfitDescription(sport, jerseyNumber, input.jerseyColor)

  return `Create a FULL BODY sports avatar illustration of this person while PRESERVING their EXACT facial identity.

IMAGE INPUTS:
- First image: Person's photo (use for facial identity)
- Second image: Stadium background (use as EXACT background)

IDENTITY PRESERVATION (CRITICAL):
- Preserve exact facial features: face shape, eyes, nose, ears, lips, chin, jawline
- Preserve body type and proportions
- Preserve glasses if worn
- Preserve facial hair if present
- The avatar must be RECOGNIZABLE as this specific person

CUSTOMIZATIONS TO APPLY:
- Skin tone: ${input.skinTone}
- Hair style: ${input.hairStyle}
- Hair color: ${input.hairColor}

STYLE:
- Semi-realistic cartoon style (like NBA 2K mobile trading cards)
- FULL BODY from head to feet
- Use the provided STADIUM IMAGE as the EXACT background
- Character fills 80% of image height, centered on the stadium

EXACT POSE (same for ALL avatars):
- Standing straight, facing forward
- Arms relaxed at sides
- Feet shoulder-width apart
- Confident, relaxed posture

OUTFIT:
${outfitDetails}

DO NOT: copy their actual clothes, create only face/bust, use emoji style, change their facial identity, use a different background.`
}

/**
 * Analyze a photo to extract facial features for avatar generation
 * Returns a detailed text description for consistent avatar generation
 */
export async function analyzePhotoForAvatar(referencePhoto: string): Promise<string> {
  if (!imageClient) {
    throw new Error('Gemini AI is not configured.')
  }

  const base64Data = referencePhoto.replace(/^data:image\/\w+;base64,/, '')

  const analysisPrompt = `Analyze this person's PHYSICAL APPEARANCE in detail for creating a sports avatar that looks like them.

Describe these features SPECIFICALLY:

FACE:
- Face shape (oval, round, square, heart, oblong)
- Forehead (high, low, wide, narrow)
- Eyes (shape, size, spacing)
- Nose (shape, size - small, medium, large, wide, narrow, pointed)
- Ears (size, shape if visible)
- Lips (thin, medium, full)
- Chin (pointed, square, round)
- Jawline (defined, soft, angular)

SKIN & COLORING:
- Skin tone (very light, light, medium, olive, tan, brown, dark brown, dark)
- Any distinctive marks or features

HAIR:
- Hair style (short, medium, long, curly, straight, wavy, braids, bald, etc.)
- Hair color (black, brown, blonde, red, gray, etc.)

BODY:
- Body type (slim, lean, average, athletic, muscular, stocky)
- Build (thin, medium, broad shoulders)

ACCESSORIES:
- Glasses? (if yes, describe style)
- Facial hair? (beard style, mustache, clean shaven)

IMPORTANT: Do NOT describe their clothing - we will dress them in a sports uniform.

Provide a detailed description focusing on features that make this person recognizable.`

  try {
    const response = await imageClient.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: base64Data,
              },
            },
            { text: analysisPrompt },
          ],
        },
      ],
    })

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) {
      throw new Error('No description from photo analysis')
    }

    logger.info({ description: text.substring(0, 200) }, 'Photo analyzed for avatar')
    return text
  } catch (error) {
    logger.error({ error }, 'Failed to analyze photo')
    // Return generic description on failure
    return 'adult athlete with medium build'
  }
}

/**
 * Generate a default avatar for a sport/gender combination
 */
export async function generateDefaultAvatar(
  gender: string,
  sport: string = 'basketball'
): Promise<Buffer> {
  return generateAvatarImage({
    gender,
    skinTone: 'medium',
    hairStyle: 'short',
    hairColor: 'black',
    sport,
  })
}

/**
 * Edit an existing avatar image to change specific attributes
 * This maintains consistency by modifying the existing image rather than regenerating
 */
export interface AvatarEditInput {
  skinTone: string
  hairStyle: string
  hairColor: string
  sport?: string
  jerseyNumber?: number
  jerseyColor?: string
}

export async function editAvatarImage(
  existingAvatarBase64: string,
  changes: AvatarEditInput
): Promise<Buffer> {
  if (!imageClient) {
    throw new Error('Gemini AI is not configured. Set GEMINI_API_KEY.')
  }

  const base64Data = existingAvatarBase64.replace(/^data:image\/\w+;base64,/, '')
  const sport = changes.sport || 'basketball'
  const jerseyNumber = changes.jerseyNumber ?? 9
  const outfitDetails = buildOutfitDescription(sport, jerseyNumber, changes.jerseyColor)

  // Load stadium background
  const stadiumBackground = getStadiumBackground()

  // Optimized prompt for Gemini 3 Pro Image's identity preservation
  const editPrompt = `Edit this avatar image while PRESERVING the character's EXACT identity.

IMAGE INPUTS:
- First image: Existing avatar (preserve identity and pose)
- Second image: Stadium background (use as EXACT background)

CHANGES TO APPLY:
- Hair style: ${changes.hairStyle}
- Hair color: ${changes.hairColor}
- Skin tone: ${changes.skinTone}
- Jersey/outfit color: ${hexToColorName(changes.jerseyColor)}

PRESERVE EXACTLY (do not change):
- Face shape, facial features, and identity
- Body type, height, and proportions
- Standing pose (arms at sides, facing forward)
- Art style (semi-realistic cartoon)
- Character position (centered, 80% height)

BACKGROUND:
- Use the provided STADIUM IMAGE as the EXACT background

OUTFIT:
${outfitDetails}

The edited avatar must be the SAME CHARACTER with hair, skin, and outfit color changes applied. Preserve facial identity completely. Use the stadium background.`

  try {
    logger.info('Editing avatar with Gemini 3 Pro Image and stadium background')

    const response = await imageClient.models.generateContent({
      model: IMAGE_MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            // Existing avatar
            {
              inlineData: {
                mimeType: 'image/png',
                data: base64Data,
              },
            },
            // Stadium background
            {
              inlineData: {
                mimeType: 'image/png',
                data: stadiumBackground,
              },
            },
            { text: editPrompt },
          ],
        },
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    })

    const parts = response.candidates?.[0]?.content?.parts || []
    for (const part of parts) {
      if (part.inlineData) {
        const imageData = part.inlineData.data
        if (imageData) {
          const buffer = Buffer.from(imageData, 'base64')
          logger.info({ size: buffer.length }, 'Avatar edited successfully')
          return buffer
        }
      }
    }

    throw new Error('No image data in edit response')
  } catch (error) {
    logger.error({ error }, 'Failed to edit avatar')
    throw error
  }
}
