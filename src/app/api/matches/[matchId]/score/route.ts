/**
 * POST /api/matches/[matchId]/score
 * Submit match score
 */

import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/db'
import { submitMatchScore } from '@/lib/matches'
import { logger } from '@/lib/utils/logger'

interface RouteParams {
  params: Promise<{ matchId: string }>
}

export async function POST(request: Request, { params }: RouteParams): Promise<Response> {
  try {
    const session = await getSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { matchId } = await params
    const body = await request.json()
    const { player1Score, player2Score } = body

    if (typeof player1Score !== 'number' || typeof player2Score !== 'number') {
      return NextResponse.json(
        { error: 'player1Score and player2Score are required' },
        { status: 400 }
      )
    }

    if (player1Score < 0 || player2Score < 0) {
      return NextResponse.json({ error: 'Scores cannot be negative' }, { status: 400 })
    }

    const db = getDb()
    const result = await submitMatchScore(db, matchId, session.user.id, player1Score, player2Score)

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    logger.error({ error }, 'Failed to submit match score')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
