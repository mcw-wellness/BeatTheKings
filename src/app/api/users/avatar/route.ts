import { NextResponse } from 'next/server'
import { getDb } from '@/db'
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
  upsertEquipment,
} from '@/lib/avatar'
import {
  getUserGender,
  processPreviewImage,
  generateAndUploadAvatar,
  generateAvatarInBackground,
} from '@/lib/avatar/api-helpers'
import { logger } from '@/lib/utils/logger'

export async function GET(): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const db = getDb()
    const avatarData = await getAvatarWithStats(db, session.user.id)
    if (!avatarData) return NextResponse.json({ error: 'Avatar not found' }, { status: 404 })
    return NextResponse.json(avatarData)
  } catch (error) {
    logger.error({ error }, 'Failed to get avatar')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const validation = validateAvatarInput(body)
    if (!validation.valid)
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      )

    const db = getDb()
    if (await avatarExists(db, session.user.id))
      return NextResponse.json(
        { error: 'Avatar already exists. Use PUT to update.' },
        { status: 409 }
      )

    const gender = await getUserGender(session.user.id)
    const previewImage = (body as { previewImage?: string }).previewImage
    const jerseyNumber = (body as { jerseyNumber?: number }).jerseyNumber
    const jerseyColor = (body as { jerseyColor?: string }).jerseyColor
    const jerseyItemId = (body as { jerseyItemId?: string }).jerseyItemId
    const shoesItemId = (body as { shoesItemId?: string }).shoesItemId
    const ageGroup = (body as { ageGroup?: string }).ageGroup

    let imageUrl = await processPreviewImage(session.user.id, previewImage)
    if (!imageUrl)
      imageUrl = await generateAndUploadAvatar(session.user.id, {
        gender,
        data: validation.data,
        jerseyNumber,
        jerseyColor,
        jerseyItemId,
        shoesItemId,
        ageGroup,
      })

    const avatar = await createAvatar(db, session.user.id, { ...validation.data, imageUrl })
    await unlockDefaultItems(db, session.user.id)

    const basketballId = await getBasketballSportId(db)
    if (basketballId) {
      const defaultItems = await getDefaultItems(db)
      if (defaultItems.length > 0)
        await createDefaultEquipment(db, avatar.id, basketballId, defaultItems, jerseyNumber)
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

export async function PUT(request: Request): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const validation = validateAvatarUpdateInput(body)
    if (!validation.valid)
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      )

    const db = getDb()
    const existingAvatar = await getAvatar(db, session.user.id)
    if (!existingAvatar)
      return NextResponse.json({ error: 'Avatar not found. Use POST to create.' }, { status: 404 })

    const previewImage = (body as { previewImage?: string }).previewImage
    const jerseyNumber = (body as { jerseyNumber?: number }).jerseyNumber
    const jerseyColor = (body as { jerseyColor?: string }).jerseyColor
    const shoesItemId = (body as { shoesItemId?: string }).shoesItemId
    const jerseyItemId = (body as { jerseyItemId?: string }).jerseyItemId
    const ageGroup = (body as { ageGroup?: string }).ageGroup

    // Process preview image if provided (instant)
    const imageUrl = await processPreviewImage(session.user.id, previewImage)
    let generatingInBackground = false

    if (!imageUrl) {
      // No preview provided - trigger background generation (instant return)
      const gender = await getUserGender(session.user.id)
      generateAvatarInBackground(session.user.id, existingAvatar.id, {
        gender,
        data: validation.data,
        jerseyNumber,
        jerseyColor,
        jerseyItemId,
        shoesItemId,
        ageGroup,
      })
      generatingInBackground = true
    }

    // Update avatar data immediately (image will be updated in background if needed)
    const updateData = imageUrl ? { ...validation.data, imageUrl } : validation.data
    const updated = await updateAvatar(db, existingAvatar.id, updateData)

    const basketballId = await getBasketballSportId(db)
    if (basketballId) {
      const defaultItems = await getDefaultItems(db)
      await unlockDefaultItems(db, session.user.id)
      await upsertEquipment(
        db,
        existingAvatar.id,
        basketballId,
        defaultItems,
        jerseyNumber,
        shoesItemId,
        jerseyItemId
      )
    }

    await markAvatarCreated(db, session.user.id)

    return NextResponse.json({
      success: true,
      generatingInBackground,
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
