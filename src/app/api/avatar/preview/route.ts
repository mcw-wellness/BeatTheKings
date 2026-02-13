/**
 * API Route: POST /api/avatar/preview
 * Generate avatar preview using Gemini AI
 * Uses image editing for consistency when an existing avatar exists
 */

import { NextResponse } from 'next/server'
import { getDb } from '@/db'
import { avatarItems } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getSession } from '@/lib/auth'
import { generateAvatarImage } from '@/lib/avatar/generator'
import { editAvatarImage } from '@/lib/gemini'
import { getProfilePictureBase64, getAvatarBase64 } from '@/lib/azure-storage'
import { getAvatar } from '@/lib/avatar'
import { logger } from '@/lib/utils/logger'
import { JERSEY_DESIGNS, SHOE_DESIGNS } from '@/lib/gemini/prompts'

interface PreviewRequest {
  gender: string
  skinTone: string
  hairStyle: string
  hairColor: string
  sport?: string
  ageGroup?: string
  jerseyNumber?: number
  jerseyColor?: string
  jerseyItemId?: string
  shoesItemId?: string
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: PreviewRequest = await request.json()
    const {
      gender,
      skinTone,
      hairStyle,
      hairColor,
      sport = 'basketball',
      ageGroup,
      jerseyNumber,
      jerseyColor,
      jerseyItemId,
      shoesItemId,
    } = body

    // Validate required fields
    if (!gender || !skinTone || !hairStyle || !hairColor) {
      return NextResponse.json(
        { error: 'Missing required fields: gender, skinTone, hairStyle, hairColor' },
        { status: 400 }
      )
    }

    const db = getDb()

    // Look up jersey and shoes designs + images from item IDs
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
    const existingAvatarImage = await getAvatarBase64(session.user.id)

    let imageBuffer: Buffer

    if (existingAvatarImage) {
      // Use image editing to modify existing avatar (maintains consistency)
      logger.info({ userId: session.user.id, ...body }, 'Editing existing avatar for preview')

      imageBuffer = await editAvatarImage(existingAvatarImage, {
        skinTone,
        hairStyle,
        hairColor,
        sport,
        jerseyNumber,
        jerseyColor,
        jerseyDesign,
        shoesDesign,
        jerseyImageUrl,
        shoesImageUrl,
      })
    } else {
      // No existing avatar - generate from scratch using photo analysis
      logger.info(
        { userId: session.user.id, ...body },
        'Generating new avatar for preview (no existing avatar)'
      )

      // Fetch user's avatar record to get stored photo analysis
      const avatar = await getAvatar(db, session.user.id)
      const storedPhotoAnalysis = avatar?.photoAnalysis || undefined

      // Fetch user's profile picture to use as reference
      const referencePhoto = await getProfilePictureBase64(session.user.id)

      imageBuffer = await generateAvatarImage({
        gender,
        skinTone,
        hairStyle,
        hairColor,
        sport,
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

    // Return as base64 data URL for preview
    const base64 = imageBuffer.toString('base64')
    const dataUrl = `data:image/png;base64,${base64}`

    logger.info({ userId: session.user.id }, 'Avatar preview generated successfully')

    return NextResponse.json({ imageUrl: dataUrl })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    logger.error({ error: errorMsg }, 'Failed to generate avatar preview')
    return NextResponse.json({ error: 'Failed to generate avatar preview' }, { status: 500 })
  }
}
