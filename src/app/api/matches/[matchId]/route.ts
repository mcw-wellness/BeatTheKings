/**
 * GET /api/matches/[matchId]
 * Get match details
 */

import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/db'
import { getMatchById } from '@/lib/matches'
import { logger } from '@/lib/utils/logger'

interface RouteParams {
  params: Promise<{ matchId: string }>
}

export async function GET(request: Request, { params }: RouteParams): Promise<Response> {
  try {
    const session = await getSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { matchId } = await params
    const db = getDb()

    const match = await getMatchById(db, matchId)

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    // Verify user is a participant
    if (match.player1.id !== session.user.id && match.player2.id !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized to view this match' }, { status: 403 })
    }

    return NextResponse.json({ match })
  } catch (error) {
    logger.error({ error }, 'Failed to get match')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
