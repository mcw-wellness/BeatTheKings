/**
 * Avatar Generation using Gemini AI
 */

import { logger } from '@/lib/utils/logger'
import { imageClient } from './client'
import { buildAvatarPrompt, buildAvatarPromptWithPhoto } from './prompts'
import type { AvatarPromptInput } from './types'

/**
 * Generate an avatar image using Gemini AI
 * If referencePhoto is provided, uses it to create a resembling avatar
 * Returns image buffer
 */
export async function generateAvatarImage(input: AvatarPromptInput): Promise<Buffer> {
  if (!imageClient) {
    throw new Error('Gemini AI is not configured. Set GEMINI_API_KEY.')
  }

  const hasReferencePhoto = !!input.referencePhoto

  // Build contents based on whether we have a reference photo
  let contents: Parameters<typeof imageClient.models.generateContent>[0]['contents']

  if (hasReferencePhoto && input.referencePhoto) {
    const prompt = buildAvatarPromptWithPhoto(input)
    const base64Data = input.referencePhoto.replace(/^data:image\/\w+;base64,/, '')

    contents = [
      {
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Data,
            },
          },
          { text: prompt },
        ],
      },
    ]
    logger.info({ prompt }, 'Generating avatar with reference photo')
  } else {
    const prompt = buildAvatarPrompt(input)
    contents = prompt
    logger.info({ prompt }, 'Generating avatar without reference photo')
  }

  try {
    const response = await imageClient.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents,
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
          logger.info({ size: buffer.length }, 'Avatar image generated successfully')
          return buffer
        }
      }
    }

    throw new Error('No image data in Gemini response')
  } catch (error) {
    logger.error({ error, hasReferencePhoto }, 'Failed to generate avatar with Gemini')
    throw error
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
