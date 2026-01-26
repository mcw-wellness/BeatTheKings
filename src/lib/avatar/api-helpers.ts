// Avatar API helper functions

import { eq } from 'drizzle-orm'
import { getDb } from '@/db'
import { users, avatarItems } from '@/db/schema'
import { generateAvatarImage } from './generator'
import { editAvatarImage } from '@/lib/gemini'
import { uploadAvatar, getAvatarBase64, getProfilePictureBase64 } from '@/lib/azure-storage'
import { avatarLogger } from './avatar-logger'
import { JERSEY_DESIGNS, SHOE_DESIGNS } from '@/lib/gemini/prompts'
import { getAvatar, updateAvatarImageUrl } from './crud'
import type { AvatarCreateInput, AvatarUpdateInput } from './validation'

export async function getUserGender(userId: string): Promise<string> {
  const db = getDb()
  const [user] = await db.select({ gender: users.gender }).from(users).where(eq(users.id, userId))
  return user?.gender || 'Male'
}

export async function processPreviewImage(
  userId: string,
  previewImage?: string
): Promise<string | undefined> {
  if (!previewImage || !previewImage.startsWith('data:image/')) return undefined
  try {
    const base64Data = previewImage.replace(/^data:image\/\w+;base64,/, '')
    const imageBuffer = Buffer.from(base64Data, 'base64')
    const url = await uploadAvatar(userId, imageBuffer)
    return url
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    avatarLogger.error('Failed to upload preview image', { userId, error: errorMessage })
    return undefined
  }
}

interface GenerateAvatarOptions {
  gender: string
  data: AvatarCreateInput | AvatarUpdateInput
  jerseyNumber?: number
  jerseyColor?: string
  jerseyItemId?: string
  shoesItemId?: string
  ageGroup?: string
}

/**
 * Retry wrapper for Gemini API calls
 * Retries up to maxRetries times with delay between attempts
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt))
      }
    }
  }
  throw lastError
}

export async function generateAndUploadAvatar(
  userId: string,
  options: GenerateAvatarOptions
): Promise<string | undefined> {
  const { gender, data, jerseyNumber, jerseyColor, jerseyItemId, shoesItemId, ageGroup } = options
  const db = getDb()

  try {
    // Look up jersey and shoes designs from item IDs
    let jerseyDesign: string | undefined
    let shoesDesign: string | undefined
    let jerseyImageUrl: string | undefined
    let shoesImageUrl: string | undefined

    if (jerseyItemId) {
      const [jerseyItem] = await db
        .select({ name: avatarItems.name, imageUrl: avatarItems.imageUrl })
        .from(avatarItems)
        .where(eq(avatarItems.id, jerseyItemId))
        .limit(1)
      if (jerseyItem?.name && JERSEY_DESIGNS[jerseyItem.name]) {
        jerseyDesign = JERSEY_DESIGNS[jerseyItem.name]
      }
      if (jerseyItem?.imageUrl) {
        jerseyImageUrl = jerseyItem.imageUrl
      }
    }

    if (shoesItemId) {
      const [shoesItem] = await db
        .select({ name: avatarItems.name, imageUrl: avatarItems.imageUrl })
        .from(avatarItems)
        .where(eq(avatarItems.id, shoesItemId))
        .limit(1)
      if (shoesItem?.name && SHOE_DESIGNS[shoesItem.name]) {
        shoesDesign = SHOE_DESIGNS[shoesItem.name]
      }
      if (shoesItem?.imageUrl) {
        shoesImageUrl = shoesItem.imageUrl
      }
    }

    // Check if user has an existing avatar image
    const existingAvatarImage = await getAvatarBase64(userId)

    let imageBuffer: Buffer

    if (existingAvatarImage) {
      // Use image editing with retry (maintains consistency)
      imageBuffer = await withRetry(() =>
        editAvatarImage(existingAvatarImage, {
          skinTone: data.skinTone || 'medium',
          hairStyle: data.hairStyle || 'short',
          hairColor: data.hairColor || 'black',
          sport: 'basketball',
          jerseyNumber,
          jerseyColor,
          jerseyDesign,
          shoesDesign,
          jerseyImageUrl,
          shoesImageUrl,
        })
      )
    } else {
      // No existing avatar - generate from scratch with retry
      const avatar = await getAvatar(db, userId)
      const storedPhotoAnalysis = avatar?.photoAnalysis || undefined
      const referencePhoto = await getProfilePictureBase64(userId)

      imageBuffer = await withRetry(() =>
        generateAvatarImage({
          gender,
          skinTone: data.skinTone || 'medium',
          hairStyle: data.hairStyle || 'short',
          hairColor: data.hairColor || 'black',
          sport: 'basketball',
          ageGroup,
          jerseyNumber,
          jerseyColor,
          referencePhoto: referencePhoto || undefined,
          storedPhotoAnalysis,
          jerseyDesign,
          shoesDesign,
          jerseyImageUrl,
          shoesImageUrl,
        })
      )
    }

    // Upload to Azure
    const url = await uploadAvatar(userId, imageBuffer)
    return url
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    avatarLogger.error('Avatar generation FAILED after retries', {
      userId,
      error: errorMessage,
      stack: errorStack,
    })
    return undefined
  }
}

/**
 * Generate avatar in background and update the database when done
 * This is fire-and-forget - doesn't block the caller
 */
export function generateAvatarInBackground(
  userId: string,
  avatarId: string,
  options: GenerateAvatarOptions
): void {
  // Fire and forget - don't await
  ;(async () => {
    try {
      const imageUrl = await generateAndUploadAvatar(userId, options)
      if (imageUrl) {
        const db = getDb()
        await updateAvatarImageUrl(db, avatarId, imageUrl)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      avatarLogger.error('Background avatar generation FAILED', {
        userId,
        avatarId,
        error: errorMessage,
      })
    }
  })()
}
