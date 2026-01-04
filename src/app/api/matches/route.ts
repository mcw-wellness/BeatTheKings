/**
 * GET /api/matches - Get user's match history
 * POST /api/matches - Create a new 1v1 match
 */

import { NextResponse } from 'next/server'
import { eq, or, desc } from 'drizzle-orm'
import { getSession } from '@/lib/auth'
import { getDb } from '@/db'
import { createMatch, getMatchById } from '@/lib/matches'
import { matches } from '@/db/schema'
import { logger } from '@/lib/logger'

export async function GET(): Promise<Response> {
  try {
    const session = await getSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = getDb()

    // Get all matches where user is a participant
    const userMatches = await db
      .select({ id: matches.id })
      .from(matches)
      .where(or(eq(matches.player1Id, session.user.id), eq(matches.player2Id, session.user.id)))
      .orderBy(desc(matches.createdAt))
      .limit(20)

    // Get full details for each match
    const matchDetails = await Promise.all(userMatches.map(async (m) => getMatchById(db, m.id)))

    return NextResponse.json({ matches: matchDetails.filter(Boolean) })
  } catch (error) {
    logger.error({ error }, 'Failed to get matches')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const session = await getSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { opponentId, venueId, sportId } = body

    if (!opponentId || !venueId || !sportId) {
      return NextResponse.json(
        { error: 'opponentId, venueId, and sportId are required' },
        { status: 400 }
      )
    }

    if (opponentId === session.user.id) {
      return NextResponse.json({ error: 'Cannot challenge yourself' }, { status: 400 })
    }

    const db = getDb()
    const result = await createMatch(db, session.user.id, opponentId, venueId, sportId)

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ matchId: result.matchId, message: 'Match created' })
  } catch (error) {
    logger.error({ error }, 'Failed to create match')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
