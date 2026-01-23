import { NextResponse } from 'next/server'
import { getDb } from '@/db'
import { users, avatars, avatarEquipments } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getSession } from '@/lib/auth'
import { logger } from '@/lib/utils/logger'

/**
 * POST /api/users/reset
 * Reset current user's account for testing
 */
export async function POST(): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = getDb()
    const userId = session.user.id

    // Get avatar to delete equipment
    const avatar = await db.query.avatars.findFirst({
      where: eq(avatars.userId, userId),
    })

    if (avatar) {
      // Delete avatar equipment first (foreign key constraint)
      await db.delete(avatarEquipments).where(eq(avatarEquipments.avatarId, avatar.id))
      logger.info({ userId }, 'Deleted avatar equipment')

      // Delete avatar
      await db.delete(avatars).where(eq(avatars.id, avatar.id))
      logger.info({ userId }, 'Deleted avatar')
    }

    // Reset user flags
    await db
      .update(users)
      .set({
        hasCreatedAvatar: false,
        hasCompletedProfile: false,
        hasUploadedPhoto: false,
        profilePictureUrl: null,
      })
      .where(eq(users.id, userId))

    logger.info({ userId }, 'User reset successfully')

    return NextResponse.json({ success: true, message: 'Account reset successfully' })
  } catch (error) {
    logger.error({ error }, 'Failed to reset user')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
