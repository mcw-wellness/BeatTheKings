// Avatar API helper functions

import { eq } from 'drizzle-orm'
import { getDb } from '@/db'
import { users, avatarItems } from '@/db/schema'
import { generateAvatarImage } from './generator'
import { editAvatarImage } from '@/lib/gemini'
import { uploadAvatar, getAvatarBase64, getProfilePictureBase64 } from '@/lib/azure-storage'
import { logger } from '@/lib/utils/logger'
import { JERSEY_DESIGNS, SHOE_DESIGNS } from '@/lib/gemini/prompts'
import { getAvatar } from './crud'
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
    logger.info({ userId, url }, 'Preview avatar uploaded')
    return url
  } catch (error) {
    logger.warn({ error }, 'Failed to upload preview image')
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
      // Use image editing to modify existing avatar (maintains consistency)
      logger.info({ userId }, 'Editing existing avatar on save')

      imageBuffer = await editAvatarImage(existingAvatarImage, {
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
    } else {
      // No existing avatar - generate from scratch
      logger.info({ userId }, 'Generating new avatar on save (no existing avatar)')

      // Fetch user's avatar record to get stored photo analysis
      const avatar = await getAvatar(db, userId)
      const storedPhotoAnalysis = avatar?.photoAnalysis || undefined

      // Fetch user's profile picture to use as reference
      const referencePhoto = await getProfilePictureBase64(userId)

      imageBuffer = await generateAvatarImage({
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
    }

    const url = await uploadAvatar(userId, imageBuffer)
    logger.info({ userId, url }, 'AI avatar generated and uploaded on save')
    return url
  } catch (error) {
    logger.warn({ error }, 'AI avatar generation skipped, using SVG fallback')
    return undefined
  }
}
