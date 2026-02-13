/**
 * Avatar Generation using Gemini 3 Pro Image
 * Uses Gemini 3's advanced character consistency for identity preservation
 */

import * as fs from 'fs'
import * as path from 'path'
import sharp from 'sharp'
import { logger } from '@/lib/utils/logger'
import { imageClient } from './client'
import type { AvatarPromptInput } from './types'

// Max dimensions for reference photos sent to Gemini (keeps under API size limits)
const MAX_REFERENCE_WIDTH = 1024
const MAX_REFERENCE_HEIGHT = 1024
const REFERENCE_JPEG_QUALITY = 80

// Gemini 3 Pro Image model for best character consistency
const IMAGE_MODEL = 'gemini-3-pro-image-preview'

// Cache images to avoid reading from disk each time
const imageCache: Record<string, string> = {}

/**
 * Serialize error for logging (Gemini SDK errors are not standard Error objects)
 */
function serializeError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return { message: error.message, name: error.name, stack: error.stack }
  }
  if (typeof error === 'object' && error !== null) {
    try {
      return { raw: JSON.stringify(error) }
    } catch {
      return { raw: String(error) }
    }
  }
  return { raw: String(error) }
}

/**
 * Resize a base64 image to fit within max dimensions
 * Returns resized base64 string (without data URL prefix)
 */
async function resizeBase64Image(base64Data: string): Promise<string> {
  const inputBuffer = Buffer.from(base64Data, 'base64')
  const metadata = await sharp(inputBuffer).metadata()

  const width = metadata.width || 0
  const height = metadata.height || 0

  if (width <= MAX_REFERENCE_WIDTH && height <= MAX_REFERENCE_HEIGHT) {
    return base64Data // Already small enough
  }

  const resizedBuffer = await sharp(inputBuffer)
    .resize(MAX_REFERENCE_WIDTH, MAX_REFERENCE_HEIGHT, { fit: 'inside' })
    .jpeg({ quality: REFERENCE_JPEG_QUALITY })
    .toBuffer()

  logger.info(
    { originalSize: inputBuffer.length, resizedSize: resizedBuffer.length, originalDims: `${width}x${height}` },
    'Resized reference photo for Gemini'
  )

  return resizedBuffer.toString('base64')
}

/**
 * Load an image from public folder as base64
 */
function loadPublicImage(relativePath: string): string | null {
  if (imageCache[relativePath]) {
    return imageCache[relativePath]
  }

  try {
    const fullPath = path.join(process.cwd(), 'public', relativePath.replace(/^\//, ''))
    if (!fs.existsSync(fullPath)) {
      logger.warn({ path: fullPath }, 'Image not found')
      return null
    }
    const imageBuffer = fs.readFileSync(fullPath)
    imageCache[relativePath] = imageBuffer.toString('base64')
    logger.info({ path: relativePath }, 'Image loaded')
    return imageCache[relativePath]
  } catch (error) {
    logger.warn({ error, path: relativePath }, 'Failed to load image')
    return null
  }
}

/**
 * Load the stadium background image as base64
 */
function getStadiumBackground(): string {
  const cached = loadPublicImage('/backgrounds/stadium.png')
  if (!cached) {
    throw new Error('Stadium background not found')
  }
  return cached
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

    // Load item reference images if provided
    const jerseyImage = input.jerseyImageUrl ? loadPublicImage(input.jerseyImageUrl) : null
    const shoesImage = input.shoesImageUrl ? loadPublicImage(input.shoesImageUrl) : null

    // Build the parts array with all reference images
    const buildParts = (prompt: string, userPhotoBase64?: string) => {
      const parts: Array<{ inlineData?: { mimeType: string; data: string }; text?: string }> = []

      // User's photo for identity (if provided)
      if (userPhotoBase64) {
        parts.push({
          inlineData: { mimeType: 'image/jpeg', data: userPhotoBase64 },
        })
      }

      // Stadium background
      parts.push({
        inlineData: { mimeType: 'image/png', data: stadiumBackground },
      })

      // Jersey reference (if provided)
      if (jerseyImage) {
        parts.push({
          inlineData: { mimeType: 'image/png', data: jerseyImage },
        })
      }

      // Shoes reference (if provided)
      if (shoesImage) {
        parts.push({
          inlineData: { mimeType: 'image/png', data: shoesImage },
        })
      }

      // Prompt text
      parts.push({ text: prompt })

      return parts
    }

    if (hasReferencePhoto && input.referencePhoto) {
      // With reference photo - use Gemini 3's identity preservation
      const rawBase64 = input.referencePhoto.replace(/^data:image\/\w+;base64,/, '')
      const base64Data = await resizeBase64Image(rawBase64)
      const prompt = buildAvatarPromptWithReference(input, !!jerseyImage, !!shoesImage)

      logger.info(
        { hasJerseyRef: !!jerseyImage, hasShoesRef: !!shoesImage },
        'Generating avatar with reference photo and item references'
      )

      response = await imageClient.models.generateContent({
        model: IMAGE_MODEL,
        contents: [{ role: 'user', parts: buildParts(prompt, base64Data) }],
        config: { responseModalities: ['TEXT', 'IMAGE'] },
      })
    } else {
      // Without reference photo - generate from description with stadium
      const prompt = buildAvatarPromptWithItems(input, !!jerseyImage, !!shoesImage)

      logger.info(
        { hasJerseyRef: !!jerseyImage, hasShoesRef: !!shoesImage },
        'Generating avatar with item references'
      )

      response = await imageClient.models.generateContent({
        model: IMAGE_MODEL,
        contents: [{ role: 'user', parts: buildParts(prompt) }],
        config: { responseModalities: ['TEXT', 'IMAGE'] },
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
    logger.error({ error: serializeError(error), hasReferencePhoto }, 'Failed to generate avatar')
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
 * Build prompt for avatar generation WITHOUT reference photo but WITH item references
 */
function buildAvatarPromptWithItems(
  input: AvatarPromptInput,
  hasJerseyRef: boolean,
  hasShoesRef: boolean
): string {
  const sport = input.sport || 'basketball'
  const jerseyNumber = input.jerseyNumber ?? 9

  let imageInputDesc = 'IMAGE INPUTS:\n- Image 1: Stadium background (use as EXACT background)'
  let outfitDesc = ''

  if (hasJerseyRef && hasShoesRef) {
    imageInputDesc += '\n- Image 2: Jersey reference (copy this EXACT jersey design)'
    imageInputDesc += '\n- Image 3: Shoes reference (copy this EXACT shoe design)'
    outfitDesc = `OUTFIT:
- Jersey: Copy the EXACT design from the jersey reference image, add number ${jerseyNumber} on front
- Shorts: Matching color to the jersey
- Shoes: Copy the EXACT design from the shoes reference image
- Black athletic socks`
  } else if (hasJerseyRef) {
    imageInputDesc += '\n- Image 2: Jersey reference (copy this EXACT jersey design)'
    outfitDesc = `OUTFIT:
- Jersey: Copy the EXACT design from the jersey reference image, add number ${jerseyNumber} on front
- Shorts: Matching color to the jersey
- Shoes: ${sport === 'basketball' ? 'Navy blue high-top basketball sneakers' : 'Black soccer cleats'}
- Black athletic socks`
  } else if (hasShoesRef) {
    imageInputDesc += '\n- Image 2: Shoes reference (copy this EXACT shoe design)'
    outfitDesc = `OUTFIT:
- Jersey: Navy blue ${sport} jersey with gold trim, number ${jerseyNumber} on front
- Shorts: Matching navy blue with gold stripes
- Shoes: Copy the EXACT design from the shoes reference image
- Black athletic socks`
  } else {
    outfitDesc = buildOutfitDescription(sport, jerseyNumber, input.jerseyColor)
  }

  return `Create a FULL BODY sports athlete illustration.

OUTPUT DIMENSIONS (CRITICAL):
- Generate a tall PORTRAIT image (9:16 aspect ratio)
- Image must be exactly 576x1024 pixels (width x height)
- Character must be vertically centered and fill 95% of image height

${imageInputDesc}

STYLE:
- Semi-realistic cartoon style (like NBA 2K mobile trading cards)
- FULL BODY from head to feet visible
- Use the stadium image as EXACT background
- Character centered horizontally and vertically

CHARACTER:
- Gender: ${input.gender}
- Skin tone: ${input.skinTone}
- Hair style: ${input.hairStyle}
- Hair color: ${input.hairColor}

EXACT POSE:
- Standing straight, facing forward
- Arms relaxed at sides
- Feet shoulder-width apart
- Confident, relaxed posture

${outfitDesc}

CRITICAL: If jersey/shoes reference images are provided, copy their EXACT design, colors, and patterns.
CRITICAL: Output MUST be a 576x1024 tall portrait image with character filling most of the frame.`
}

/**
 * Build prompt for avatar generation with reference photo
 * Optimized for Gemini 3 Pro Image's identity preservation
 */
function buildAvatarPromptWithReference(
  input: AvatarPromptInput,
  hasJerseyRef: boolean,
  hasShoesRef: boolean
): string {
  const sport = input.sport || 'basketball'
  const jerseyNumber = input.jerseyNumber ?? 9

  // Build image inputs description based on what references are provided
  let imageInputDesc = `IMAGE INPUTS:
- Image 1: Person's photo (use for facial identity)
- Image 2: Stadium background (use as EXACT background)`

  let outfitDesc = ''
  let imageIndex = 3

  if (hasJerseyRef && hasShoesRef) {
    imageInputDesc += `\n- Image ${imageIndex}: Jersey reference (copy this EXACT jersey design)`
    imageIndex++
    imageInputDesc += `\n- Image ${imageIndex}: Shoes reference (copy this EXACT shoe design)`
    outfitDesc = `OUTFIT:
- Jersey: Copy the EXACT design from the jersey reference image, add number ${jerseyNumber} on front
- Shorts: Matching color to the jersey
- Shoes: Copy the EXACT design from the shoes reference image
- Black athletic socks`
  } else if (hasJerseyRef) {
    imageInputDesc += `\n- Image ${imageIndex}: Jersey reference (copy this EXACT jersey design)`
    outfitDesc = `OUTFIT:
- Jersey: Copy the EXACT design from the jersey reference image, add number ${jerseyNumber} on front
- Shorts: Matching color to the jersey
- Shoes: ${sport === 'basketball' ? 'Navy blue high-top basketball sneakers' : 'Black soccer cleats'}
- Black athletic socks`
  } else if (hasShoesRef) {
    imageInputDesc += `\n- Image ${imageIndex}: Shoes reference (copy this EXACT shoe design)`
    outfitDesc = `OUTFIT:
- Jersey: Navy blue ${sport} jersey with gold trim, number ${jerseyNumber} on front
- Shorts: Matching navy blue with gold stripes
- Shoes: Copy the EXACT design from the shoes reference image
- Black athletic socks`
  } else {
    outfitDesc = `OUTFIT:\n${buildOutfitDescription(sport, jerseyNumber, input.jerseyColor)}`
  }

  return `Create a FULL BODY sports avatar illustration of this person while PRESERVING their EXACT facial identity.

OUTPUT DIMENSIONS (CRITICAL):
- Generate a tall PORTRAIT image (9:16 aspect ratio)
- Image must be exactly 576x1024 pixels (width x height)
- Character must be vertically centered and fill 95% of image height

${imageInputDesc}

IDENTITY PRESERVATION (CRITICAL):
- Preserve exact facial features: face shape, eyes, nose, ears, lips, chin, jawline
- Preserve body type and proportions
- Preserve glasses if worn
- Preserve facial hair if present
- Preserve HEAD ACCESSORIES if worn: hats, caps, beanies, headbands, headphones, bandanas, durags, sunglasses on head
- Preserve FACE/BODY JEWELRY if worn: earrings, nose rings, lip piercings, chains, necklaces
- Preserve visible TATTOOS (face, neck, arms)
- These accessories are part of the person's identity, NOT clothing
- The avatar must be RECOGNIZABLE as this specific person

CUSTOMIZATIONS TO APPLY:
- Skin tone: ${input.skinTone}
- Hair style: ${input.hairStyle}
- Hair color: ${input.hairColor}

STYLE:
- Semi-realistic cartoon style (like NBA 2K mobile trading cards)
- FULL BODY from head to feet visible
- Use the stadium image as EXACT background
- Character centered horizontally and vertically

EXACT POSE:
- Standing straight, facing forward
- Arms relaxed at sides
- Feet shoulder-width apart
- Confident, relaxed posture

${outfitDesc}

CRITICAL: If jersey/shoes reference images are provided, copy their EXACT design, colors, and patterns.
CRITICAL: Output MUST be a 576x1024 tall portrait image with character filling most of the frame.
DO NOT: copy their actual body clothes (shirt/pants/jacket), create only face/bust, use emoji style, change their facial identity.
KEEP: all personal accessories (hats, headphones, earrings, piercings, chains, tattoos) - these are part of their identity!`
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
- Glasses? (if yes, describe style - frame shape, color)
- Facial hair? (beard style, mustache, clean shaven)
- Head accessories? (hat, cap, beanie, headband, headphones, bandana, durag, sunglasses on head - describe style and color)
- Jewelry? (earrings, nose ring, lip piercing, chains, necklaces - describe style)
- Visible tattoos? (face, neck, arms - describe location and style)

IMPORTANT: Do NOT describe their body clothing (shirt, pants, etc.) - we will dress them in a sports uniform.
IMPORTANT: DO describe all accessories (head, face, jewelry, tattoos) - these will be PRESERVED in the avatar.

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
    logger.error({ error: serializeError(error) }, 'Failed to analyze photo')
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
  jerseyDesign?: string
  shoesDesign?: string
  jerseyImageUrl?: string
  shoesImageUrl?: string
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

  // Build outfit details - use custom designs if provided
  let outfitDetails: string
  if (changes.jerseyDesign || changes.shoesDesign) {
    const jerseyDesc = changes.jerseyDesign
      ? changes.jerseyDesign.replace('number 00', `number ${jerseyNumber}`)
      : `${hexToColorName(changes.jerseyColor)} ${sport} jersey with gold trim and number ${jerseyNumber}`
    const shoesDesc = changes.shoesDesign || `${hexToColorName(changes.jerseyColor)} high-top basketball sneakers`
    outfitDetails = `- Jersey: ${jerseyDesc}\n- Matching shorts\n- Shoes: ${shoesDesc}\n- Black athletic socks`
  } else {
    outfitDetails = buildOutfitDescription(sport, jerseyNumber, changes.jerseyColor)
  }

  // Load stadium background
  const stadiumBackground = getStadiumBackground()

  // Load item reference images if provided
  const jerseyImage = changes.jerseyImageUrl ? loadPublicImage(changes.jerseyImageUrl) : null
  const shoesImage = changes.shoesImageUrl ? loadPublicImage(changes.shoesImageUrl) : null

  // Build image inputs description based on what references are provided
  let imageInputDesc = `IMAGE INPUTS:
- Image 1: Existing avatar (preserve identity and pose)
- Image 2: Stadium background (use as EXACT background)`

  let imageIndex = 3
  if (jerseyImage) {
    imageInputDesc += `\n- Image ${imageIndex}: Jersey reference (copy this EXACT jersey design)`
    imageIndex++
  }
  if (shoesImage) {
    imageInputDesc += `\n- Image ${imageIndex}: Shoes reference (copy this EXACT shoe design)`
  }

  // Update outfit details if we have reference images
  if (jerseyImage || shoesImage) {
    const jerseyDesc = jerseyImage
      ? `Copy the EXACT design from the jersey reference image, add number ${jerseyNumber}`
      : changes.jerseyDesign
        ? changes.jerseyDesign.replace('number 00', `number ${jerseyNumber}`)
        : `${hexToColorName(changes.jerseyColor)} ${sport} jersey with gold trim and number ${jerseyNumber}`
    const shoesDesc = shoesImage
      ? 'Copy the EXACT design from the shoes reference image'
      : changes.shoesDesign || `${hexToColorName(changes.jerseyColor)} high-top basketball sneakers`
    outfitDetails = `- Jersey: ${jerseyDesc}\n- Matching shorts\n- Shoes: ${shoesDesc}\n- Black athletic socks`
  }

  // Optimized prompt for Gemini 3 Pro Image's identity preservation
  const editPrompt = `Edit this avatar image while PRESERVING the character's EXACT identity.

OUTPUT DIMENSIONS (CRITICAL):
- Generate a tall PORTRAIT image (9:16 aspect ratio)
- Image must be exactly 576x1024 pixels (width x height)
- Character must be vertically centered and fill 95% of image height

${imageInputDesc}

CHANGES TO APPLY:
- Hair style: ${changes.hairStyle}
- Hair color: ${changes.hairColor}
- Skin tone: ${changes.skinTone}

PRESERVE EXACTLY (do not change):
- Face shape, facial features, and identity
- Body type, height, and proportions
- Standing pose (arms at sides, facing forward)
- Art style (semi-realistic cartoon)
- Character centered horizontally and vertically

BACKGROUND:
- Use the provided STADIUM IMAGE as the EXACT background

OUTFIT:
${outfitDetails}

CRITICAL: If jersey/shoes reference images are provided, copy their EXACT design, colors, and patterns.
CRITICAL: Output MUST be a 576x1024 tall portrait image with character filling most of the frame.
The edited avatar must be the SAME CHARACTER with the changes applied. Preserve facial identity completely.`

  try {
    logger.info(
      { hasJerseyRef: !!jerseyImage, hasShoesRef: !!shoesImage },
      'Editing avatar with Gemini 3 Pro Image'
    )

    // Build parts array with all reference images
    const parts: Array<{ inlineData?: { mimeType: string; data: string }; text?: string }> = [
      // Existing avatar
      { inlineData: { mimeType: 'image/png', data: base64Data } },
      // Stadium background
      { inlineData: { mimeType: 'image/png', data: stadiumBackground } },
    ]

    // Add jersey reference if provided
    if (jerseyImage) {
      parts.push({ inlineData: { mimeType: 'image/png', data: jerseyImage } })
    }

    // Add shoes reference if provided
    if (shoesImage) {
      parts.push({ inlineData: { mimeType: 'image/png', data: shoesImage } })
    }

    // Add prompt text
    parts.push({ text: editPrompt })

    const response = await imageClient.models.generateContent({
      model: IMAGE_MODEL,
      contents: [{ role: 'user', parts }],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    })

    const responseParts = response.candidates?.[0]?.content?.parts || []
    for (const part of responseParts) {
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
    logger.error({ error: serializeError(error) }, 'Failed to edit avatar')
    throw error
  }
}
