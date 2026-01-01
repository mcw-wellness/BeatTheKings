/**
 * API Route: POST /api/avatar/preview
 * Generate avatar preview using Gemini AI
 * Returns base64 image data for preview (not saved to storage)
 */

import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { generateAvatarImage } from '@/lib/avatar/generator'
import { logger } from '@/lib/logger'

interface PreviewRequest {
  gender: string
  skinTone: string
  hairStyle: string
  hairColor: string
  sport?: string
  ageGroup?: string
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: PreviewRequest = await request.json()
    const { gender, skinTone, hairStyle, hairColor, sport = 'basketball', ageGroup } = body

    // Validate required fields
    if (!gender || !skinTone || !hairStyle || !hairColor) {
      return NextResponse.json(
        { error: 'Missing required fields: gender, skinTone, hairStyle, hairColor' },
        { status: 400 }
      )
    }

    logger.info({ userId: session.user.id, ...body }, 'Generating avatar preview')

    // Generate avatar with Gemini
    const imageBuffer = await generateAvatarImage({
      gender,
      skinTone,
      hairStyle,
      hairColor,
      sport,
      ageGroup,
    })

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
