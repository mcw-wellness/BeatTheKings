import { NextResponse } from 'next/server'
import { getDb } from '@/db'
import { getSession } from '@/lib/auth'
import { getTrumpCardData, userExists } from '@/lib/trump-card'
import { logger } from '@/lib/utils/logger'

interface RouteParams {
  params: Promise<{ userId: string }>
}

/**
 * GET /api/players/[userId]/trump-card
 * Get a player's Trump Card data
 */
export async function GET(request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId } = await params

    // Validate userId format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(userId)) {
      return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 })
    }

    const db = getDb()

    // Check if user exists
    if (!(await userExists(db, userId))) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    }

    // Get sport from query params (default: basketball)
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get('sport') || 'basketball'

    // Get Trump Card data
    const trumpCard = await getTrumpCardData(db, userId, sport)

    if (!trumpCard) {
      return NextResponse.json({ error: 'Failed to load Trump Card' }, { status: 500 })
    }

    logger.info({ userId, sport }, 'Trump Card fetched')

    return NextResponse.json(trumpCard)
  } catch (error) {
    logger.error({ error }, 'Failed to get Trump Card')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
