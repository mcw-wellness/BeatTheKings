import { NextResponse } from 'next/server'
import { getDb } from '@/db'
import { getSession, updateUserProfile } from '@/lib/auth'
import { uploadProfilePicture, getProfilePictureSasUrl, uploadAvatar } from '@/lib/azure-storage'
import { analyzePhotoForAvatar } from '@/lib/ai/analyze-photo'
import { generateAvatarImage } from '@/lib/avatar/generator'
import {
  avatarExists,
  createAvatar,
  updateAvatar,
  getAvatar,
  markAvatarCreated,
  unlockDefaultItems,
  getBasketballSportId,
  createDefaultEquipment,
  getDefaultItems,
  upsertEquipment,
} from '@/lib/avatar'
import { logger } from '@/lib/utils/logger'

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { image, contentType } = await request.json()

    if (!image) {
      return NextResponse.json({ error: 'Image data is required' }, { status: 400 })
    }

    // Remove base64 prefix if present (data:image/jpeg;base64,...)
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '')
    const imageBuffer = Buffer.from(base64Data, 'base64')

    // Step 1: Upload profile picture to Azure Blob Storage
    const blobPath = await uploadProfilePicture(
      session.user.id,
      imageBuffer,
      contentType || 'image/jpeg'
    )

    const db = getDb()

    // Update user record with photo
    await updateUserProfile(db, session.user.id, {
      profilePictureUrl: blobPath,
      hasUploadedPhoto: true,
    })

    logger.info({ userId: session.user.id }, 'Profile picture uploaded')

    // Step 2: Analyze photo to extract avatar features
    logger.info({ userId: session.user.id }, 'Analyzing photo for avatar features')
    const features = await analyzePhotoForAvatar(image)
    logger.info({ userId: session.user.id, features }, 'Photo analysis complete')

    // Step 3: Generate avatar using extracted features AND reference photo
    let avatarImageUrl: string | undefined
    try {
      const avatarBuffer = await generateAvatarImage({
        gender: features.gender,
        skinTone: features.skinTone,
        hairStyle: features.hairStyle,
        hairColor: features.hairColor,
        jerseyNumber: 9, // Default jersey number
        referencePhoto: image, // Pass the original photo for resemblance
      })
      avatarImageUrl = await uploadAvatar(session.user.id, avatarBuffer)
      logger.info({ userId: session.user.id }, 'Avatar generated and uploaded')
    } catch (error) {
      logger.warn({ error }, 'Avatar generation failed, will use defaults on avatar page')
    }

    // Step 4: Save avatar to database
    const hasExistingAvatar = await avatarExists(db, session.user.id)

    if (hasExistingAvatar) {
      // Update existing avatar
      const existingAvatar = await getAvatar(db, session.user.id)
      if (existingAvatar) {
        await updateAvatar(db, existingAvatar.id, {
          skinTone: features.skinTone,
          hairStyle: features.hairStyle,
          hairColor: features.hairColor,
          imageUrl: avatarImageUrl,
        })

        // Update equipment
        const basketballId = await getBasketballSportId(db)
        if (basketballId) {
          const defaultItems = await getDefaultItems(db)
          await upsertEquipment(db, existingAvatar.id, basketballId, defaultItems, 9)
        }
      }
    } else {
      // Create new avatar
      const avatar = await createAvatar(db, session.user.id, {
        skinTone: features.skinTone,
        hairStyle: features.hairStyle,
        hairColor: features.hairColor,
        imageUrl: avatarImageUrl,
      })

      // Unlock default items
      await unlockDefaultItems(db, session.user.id)

      // Create default equipment for basketball
      const basketballId = await getBasketballSportId(db)
      if (basketballId) {
        const defaultItems = await getDefaultItems(db)
        if (defaultItems.length > 0) {
          await createDefaultEquipment(db, avatar.id, basketballId, defaultItems, 9)
        }
      }
    }

    // Mark avatar as created
    await markAvatarCreated(db, session.user.id)

    // Update user gender from analysis if not already set
    await updateUserProfile(db, session.user.id, {
      gender: features.gender,
    })

    logger.info({ userId: session.user.id }, 'Auto-avatar creation complete')

    // Return SAS URL for profile picture display
    const ext = (contentType || 'image/jpeg').split('/')[1] || 'jpeg'
    const sasUrl = getProfilePictureSasUrl(session.user.id, ext)

    return NextResponse.json({
      success: true,
      url: sasUrl,
      avatarGenerated: !!avatarImageUrl,
      features,
    })
  } catch (error) {
    logger.error({ error }, 'Failed to upload profile picture')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
