/**
 * Photo Analysis using Gemini AI
 * Extracts avatar features from user's profile photo
 */

import { getGeminiClient, isGeminiConfigured } from '@/lib/gemini/client'
import { logger } from '@/lib/utils/logger'
import type { SkinTone, HairStyle, HairColor } from '@/lib/avatar'

export interface PhotoFeatures {
  skinTone: SkinTone
  hairStyle: HairStyle
  hairColor: HairColor
  gender: 'male' | 'female'
}

const DEFAULT_FEATURES: PhotoFeatures = {
  skinTone: 'medium',
  hairStyle: 'short',
  hairColor: 'black',
  gender: 'male',
}

const ANALYSIS_PROMPT = `Analyze this photo of a person and extract features for creating an avatar.

Return ONLY valid JSON with these exact fields:
{
  "skinTone": "light" | "medium-light" | "medium" | "medium-dark" | "dark",
  "hairStyle": "short" | "medium" | "long" | "bald" | "afro" | "braids" | "dreads" | "mohawk",
  "hairColor": "black" | "brown" | "blonde" | "red" | "gray" | "white",
  "gender": "male" | "female"
}

Rules:
- skinTone: Based on skin complexion (light=pale, medium-light=fair, medium=olive, medium-dark=tan, dark=deep)
- hairStyle: Based on the hairstyle visible (use "bald" if no hair or very short, "short" for regular short hair)
- hairColor: Based on natural or dyed hair color visible
- gender: Based on appearance (male or female)

Respond with ONLY the JSON object, no other text.`

/**
 * Analyze a photo and extract avatar features using Gemini AI
 */
export async function analyzePhotoForAvatar(imageBase64: string): Promise<PhotoFeatures> {
  if (!isGeminiConfigured()) {
    logger.warn('Gemini not configured, using default features')
    return DEFAULT_FEATURES
  }

  try {
    const client = getGeminiClient()

    // Remove data URL prefix if present
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '')

    const response = await client.models.generateContent({
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
            { text: ANALYSIS_PROMPT },
          ],
        },
      ],
    })

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) {
      logger.warn('No text response from Gemini, using defaults')
      return DEFAULT_FEATURES
    }

    // Parse JSON from response
    const features = parseFeatures(text)
    logger.info({ features }, 'Photo analysis completed')
    return features
  } catch (error) {
    logger.error({ error }, 'Failed to analyze photo with Gemini')
    return DEFAULT_FEATURES
  }
}

/**
 * Parse and validate features from Gemini response
 */
function parseFeatures(text: string): PhotoFeatures {
  try {
    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = text.trim()
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr
        .replace(/```json?\n?/g, '')
        .replace(/```/g, '')
        .trim()
    }

    const parsed = JSON.parse(jsonStr)

    // Validate and normalize each field
    return {
      skinTone: validateSkinTone(parsed.skinTone),
      hairStyle: validateHairStyle(parsed.hairStyle),
      hairColor: validateHairColor(parsed.hairColor),
      gender: validateGender(parsed.gender),
    }
  } catch (error) {
    logger.warn({ error, text }, 'Failed to parse features JSON')
    return DEFAULT_FEATURES
  }
}

function validateSkinTone(value: unknown): SkinTone {
  const valid = ['light', 'medium-light', 'medium', 'medium-dark', 'dark']
  return valid.includes(value as string) ? (value as SkinTone) : 'medium'
}

function validateHairStyle(value: unknown): HairStyle {
  const valid = ['short', 'medium', 'long', 'bald', 'afro', 'braids', 'dreads', 'mohawk']
  return valid.includes(value as string) ? (value as HairStyle) : 'short'
}

function validateHairColor(value: unknown): HairColor {
  const valid = ['black', 'brown', 'blonde', 'red', 'gray', 'white']
  return valid.includes(value as string) ? (value as HairColor) : 'black'
}

function validateGender(value: unknown): 'male' | 'female' {
  const valid = ['male', 'female']
  return valid.includes(value as string) ? (value as 'male' | 'female') : 'male'
}
