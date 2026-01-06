import { NextResponse } from 'next/server'
import { getDb } from '@/db'
import { getSession } from '@/lib/auth'
import { getTrumpCardData } from '@/lib/trump-card'
import { logger } from '@/lib/utils/logger'

/**
 * GET /api/players/me/trump-card
 * Get current user's own Trump Card data (shorthand)
 */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = getDb()

    // Get sport from query params (default: basketball)
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get('sport') || 'basketball'

    // Get Trump Card data for current user
    const trumpCard = await getTrumpCardData(db, session.user.id, sport)

    if (!trumpCard) {
      return NextResponse.json({ error: 'Failed to load Trump Card' }, { status: 500 })
    }

    logger.info({ userId: session.user.id, sport }, 'Own Trump Card fetched')

    return NextResponse.json(trumpCard)
  } catch (error) {
    logger.error({ error }, 'Failed to get own Trump Card')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
