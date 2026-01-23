// Avatar API helper functions

import { eq } from 'drizzle-orm'
import { getDb } from '@/db'
import { users } from '@/db/schema'
import { generateAvatarImage } from './generator'
import { uploadAvatar } from '@/lib/azure-storage'
import { logger } from '@/lib/utils/logger'
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

export async function generateAndUploadAvatar(
  userId: string,
  gender: string,
  data: AvatarCreateInput | AvatarUpdateInput,
  jerseyNumber?: number
): Promise<string | undefined> {
  try {
    const imageBuffer = await generateAvatarImage({
      gender,
      skinTone: data.skinTone || 'medium',
      hairStyle: data.hairStyle || 'short',
      hairColor: data.hairColor || 'black',
      jerseyNumber,
    })
    const url = await uploadAvatar(userId, imageBuffer)
    logger.info({ userId, url }, 'AI avatar generated and uploaded')
    return url
  } catch (error) {
    logger.warn({ error }, 'AI avatar generation skipped, using SVG fallback')
    return undefined
  }
}
