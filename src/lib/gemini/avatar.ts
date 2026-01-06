/**
 * Avatar Generation using Gemini AI
 */

import { logger } from '@/lib/utils/logger'
import { imageClient } from './client'
import { buildAvatarPrompt } from './prompts'
import type { AvatarPromptInput } from './types'

/**
 * Generate an avatar image using Gemini AI
 * Returns image buffer
 */
export async function generateAvatarImage(input: AvatarPromptInput): Promise<Buffer> {
  if (!imageClient) {
    throw new Error('Gemini AI is not configured. Set GEMINI_API_KEY.')
  }

  const prompt = buildAvatarPrompt(input)

  logger.info({ prompt }, 'Generating avatar with Gemini')

  try {
    const response = await imageClient.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: prompt,
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
    logger.error({ error, input }, 'Failed to generate avatar with Gemini')
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
