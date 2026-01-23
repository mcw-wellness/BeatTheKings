// Avatar CRUD operations

import { eq } from 'drizzle-orm'
import { avatars, users } from '@/db/schema'
import type { Database } from '@/db'
import type { AvatarCreateInput, AvatarUpdateInput } from './validation'

export async function avatarExists(db: Database, userId: string): Promise<boolean> {
  const [avatar] = await db
    .select({ id: avatars.id })
    .from(avatars)
    .where(eq(avatars.userId, userId))
    .limit(1)
  return !!avatar
}

export async function getAvatar(db: Database, userId: string) {
  const [avatar] = await db.select().from(avatars).where(eq(avatars.userId, userId)).limit(1)
  return avatar || null
}

export async function createAvatar(db: Database, userId: string, data: AvatarCreateInput) {
  const [avatar] = await db
    .insert(avatars)
    .values({
      userId,
      skinTone: data.skinTone,
      hairStyle: data.hairStyle,
      hairColor: data.hairColor,
      imageUrl: data.imageUrl,
      photoAnalysis: data.photoAnalysis,
    })
    .returning()
  return avatar
}

export async function updateAvatarImageUrl(db: Database, avatarId: string, imageUrl: string) {
  const [updated] = await db
    .update(avatars)
    .set({ imageUrl, updatedAt: new Date() })
    .where(eq(avatars.id, avatarId))
    .returning()
  return updated
}

export async function updateAvatar(db: Database, avatarId: string, data: AvatarUpdateInput) {
  const [updated] = await db
    .update(avatars)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(avatars.id, avatarId))
    .returning()
  return updated
}

export async function updateAvatarPhotoAnalysis(
  db: Database,
  avatarId: string,
  photoAnalysis: string
) {
  const [updated] = await db
    .update(avatars)
    .set({ photoAnalysis, updatedAt: new Date() })
    .where(eq(avatars.id, avatarId))
    .returning()
  return updated
}

export async function markAvatarCreated(db: Database, userId: string) {
  const [updated] = await db
    .update(users)
    .set({ hasCreatedAvatar: true, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning()
  return updated
}
