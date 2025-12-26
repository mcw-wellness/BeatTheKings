import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { getDb } from '@/db'
import { users } from '@/db/schema'
import { getSession } from '@/lib/auth'
import {
  validateAvatarInput,
  validateAvatarUpdateInput,
  avatarExists,
  createAvatar,
  updateAvatar,
  getAvatar,
  getAvatarWithStats,
  markAvatarCreated,
  unlockDefaultItems,
  getBasketballSportId,
  createDefaultEquipment,
  getDefaultItems,
} from '@/lib/avatar'
import { generateAvatarImage } from '@/lib/avatar/generator'
import { uploadAvatar } from '@/lib/azure-storage'
import { logger } from '@/lib/logger'

/**
 * Get user's gender from database
 */
async function getUserGender(userId: string): Promise<string> {
  const db = getDb()
  const [user] = await db.select({ gender: users.gender }).from(users).where(eq(users.id, userId))
  return user?.gender || 'Male'
}

/**
 * GET /api/users/avatar
 */
export async function GET(): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = getDb()
    const avatarData = await getAvatarWithStats(db, session.user.id)

    if (!avatarData) {
      return NextResponse.json({ error: 'Avatar not found' }, { status: 404 })
    }

    return NextResponse.json(avatarData)
  } catch (error) {
    logger.error({ error }, 'Failed to get avatar')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/users/avatar
 * Create avatar and optionally generate AI image
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const validation = validateAvatarInput(body)
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      )
    }

    const db = getDb()

    if (await avatarExists(db, session.user.id)) {
      return NextResponse.json(
        { error: 'Avatar already exists. Use PUT to update.' },
        { status: 409 }
      )
    }

    // Get user's gender for AI generation
    const gender = await getUserGender(session.user.id)

    // Try to generate AI avatar image (skip if Gemini not configured or fails)
    let imageUrl: string | undefined
    try {
      const imageBuffer = await generateAvatarImage({
        gender,
        skinTone: validation.data.skinTone,
        hairStyle: validation.data.hairStyle,
        hairColor: validation.data.hairColor,
      })
      imageUrl = await uploadAvatar(session.user.id, imageBuffer)
      logger.info({ userId: session.user.id, imageUrl }, 'AI avatar generated and uploaded')
    } catch (error) {
      // Log but continue without AI image - will use SVG fallback
      logger.warn({ error }, 'AI avatar generation skipped, using SVG fallback')
    }

    // Create avatar with optional image URL
    const avatar = await createAvatar(db, session.user.id, {
      ...validation.data,
      imageUrl,
    })

    // Unlock default items for the user
    await unlockDefaultItems(db, session.user.id)

    // Create default equipment for basketball
    const basketballId = await getBasketballSportId(db)
    if (basketballId) {
      const defaultItems = await getDefaultItems(db)
      if (defaultItems.length > 0) {
        await createDefaultEquipment(db, avatar.id, basketballId, defaultItems)
      }
    }

    await markAvatarCreated(db, session.user.id)

    logger.info({ userId: session.user.id, avatarId: avatar.id }, 'Avatar created')

    return NextResponse.json(
      {
        success: true,
        avatar: {
          id: avatar.id,
          skinTone: avatar.skinTone,
          hairStyle: avatar.hairStyle,
          hairColor: avatar.hairColor,
          imageUrl: avatar.imageUrl,
        },
        redirectTo: '/welcome',
      },
      { status: 201 }
    )
  } catch (error) {
    logger.error({ error }, 'Failed to create avatar')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/users/avatar
 * Update avatar and optionally regenerate AI image
 */
export async function PUT(request: Request): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const validation = validateAvatarUpdateInput(body)
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      )
    }

    const db = getDb()

    const existingAvatar = await getAvatar(db, session.user.id)
    if (!existingAvatar) {
      return NextResponse.json({ error: 'Avatar not found. Use POST to create.' }, { status: 404 })
    }

    // Merge existing values with updates
    const skinTone = validation.data.skinTone || existingAvatar.skinTone || 'medium'
    const hairStyle = validation.data.hairStyle || existingAvatar.hairStyle || 'short'
    const hairColor = validation.data.hairColor || existingAvatar.hairColor || 'black'

    // Get user's gender for AI generation
    const gender = await getUserGender(session.user.id)

    // Try to regenerate AI avatar image
    let imageUrl: string | undefined
    try {
      const imageBuffer = await generateAvatarImage({
        gender,
        skinTone,
        hairStyle,
        hairColor,
      })
      imageUrl = await uploadAvatar(session.user.id, imageBuffer)
      logger.info({ userId: session.user.id, imageUrl }, 'AI avatar regenerated and uploaded')
    } catch (error) {
      // Log but continue - keep existing image or use SVG fallback
      logger.warn({ error }, 'AI avatar regeneration skipped')
    }

    // Update avatar with new values and optional image URL
    const updated = await updateAvatar(db, existingAvatar.id, {
      ...validation.data,
      imageUrl,
    })

    logger.info({ userId: session.user.id, avatarId: updated.id }, 'Avatar updated')

    return NextResponse.json({
      success: true,
      avatar: {
        id: updated.id,
        skinTone: updated.skinTone,
        hairStyle: updated.hairStyle,
        hairColor: updated.hairColor,
        imageUrl: updated.imageUrl,
        updatedAt: updated.updatedAt,
      },
    })
  } catch (error) {
    logger.error({ error }, 'Failed to update avatar')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
