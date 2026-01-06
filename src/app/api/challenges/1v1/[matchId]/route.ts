import { NextResponse } from 'next/server'
import { getDb } from '@/db'
import { getSession } from '@/lib/auth'
import { getMatchById, startMatch } from '@/lib/matches'
import { logger } from '@/lib/utils/logger'

interface RouteParams {
  params: Promise<{ matchId: string }>
}

/**
 * GET /api/challenges/1v1/[matchId]
 * Get match details
 */
export async function GET(request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { matchId } = await params
    const db = getDb()

    const match = await getMatchById(db, matchId)

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    // Check if user is participant
    const isPlayer1 = match.player1.id === session.user.id
    const isPlayer2 = match.player2.id === session.user.id

    if (!isPlayer1 && !isPlayer2) {
      return NextResponse.json({ error: 'Not a participant in this match' }, { status: 403 })
    }

    return NextResponse.json({
      match,
      isChallenger: isPlayer1,
      isOpponent: isPlayer2,
    })
  } catch (error) {
    logger.error({ error }, 'Failed to get match')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/challenges/1v1/[matchId]
 * Start the match (begin recording)
 */
export async function POST(request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { matchId } = await params
    const db = getDb()

    const result = await startMatch(db, matchId, session.user.id)

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }

    logger.info({ matchId, userId: session.user.id }, 'Match started')

    return NextResponse.json({
      success: true,
      status: 'in_progress',
    })
  } catch (error) {
    logger.error({ error }, 'Failed to start match')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
