import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { analyzePhotoForAvatar } from '@/lib/ai/analyze-photo'
import { logger } from '@/lib/utils/logger'

/**
 * POST /api/photo/analyze
 * Analyzes a photo and extracts avatar features using AI
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { image } = await request.json()

    if (!image) {
      return NextResponse.json({ error: 'Image data is required' }, { status: 400 })
    }

    logger.info({ userId: session.user.id }, 'Analyzing photo for avatar features')

    const features = await analyzePhotoForAvatar(image)

    return NextResponse.json({
      success: true,
      features,
    })
  } catch (error) {
    logger.error({ error }, 'Failed to analyze photo')
    return NextResponse.json({ error: 'Failed to analyze photo' }, { status: 500 })
  }
}
