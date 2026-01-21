/**
 * API Route: POST /api/avatar/preview
 * Generate avatar preview using Gemini AI
 * Uses image editing for consistency when an existing avatar exists
 */

import { NextResponse } from 'next/server'
import { getDb } from '@/db'
import { getSession } from '@/lib/auth'
import { generateAvatarImage } from '@/lib/avatar/generator'
import { editAvatarImage } from '@/lib/gemini'
import { getProfilePictureBase64, getAvatarBase64 } from '@/lib/azure-storage'
import { getAvatar } from '@/lib/avatar'
import { logger } from '@/lib/utils/logger'

interface PreviewRequest {
  gender: string
  skinTone: string
  hairStyle: string
  hairColor: string
  sport?: string
  ageGroup?: string
  jerseyNumber?: number
  jerseyColor?: string
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
    } = body

    // Validate required fields
    if (!gender || !skinTone || !hairStyle || !hairColor) {
      return NextResponse.json(
        { error: 'Missing required fields: gender, skinTone, hairStyle, hairColor' },
        { status: 400 }
      )
    }

    const db = getDb()

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
      })
    }

    // Return as base64 data URL for preview
    const base64 = imageBuffer.toString('base64')
    const dataUrl = `data:image/png;base64,${base64}`

    logger.info({ userId: session.user.id }, 'Avatar preview generated successfully')

    return NextResponse.json({ imageUrl: dataUrl })
  } catch (error) {
    logger.error({ error }, 'Failed to generate avatar preview')
    return NextResponse.json({ error: 'Failed to generate avatar preview' }, { status: 500 })
  }
}
