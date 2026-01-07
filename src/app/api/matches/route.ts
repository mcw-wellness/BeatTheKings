/**
 * GET /api/matches - Get user's match history
 * POST /api/matches - Create a new 1v1 match
 */

import { NextRequest, NextResponse } from 'next/server'
import { eq, or, desc } from 'drizzle-orm'
import { getSession } from '@/lib/auth'
import { getDb } from '@/db'
import { createMatch, getMatchById } from '@/lib/matches'
import { matches, venues } from '@/db/schema'
import { logger } from '@/lib/utils/logger'

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const session = await getSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = getDb()
    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status')

    // Build query
    let query = db
      .select({
        id: matches.id,
        status: matches.status,
        player1Id: matches.player1Id,
        player2Id: matches.player2Id,
        venueId: matches.venueId,
        createdAt: matches.createdAt,
      })
      .from(matches)
      .where(or(eq(matches.player1Id, session.user.id), eq(matches.player2Id, session.user.id)))
      .orderBy(desc(matches.createdAt))
      .limit(20)
      .$dynamic()

    // Apply status filter if provided
    if (statusFilter) {
      const statuses = statusFilter.split(',').map((s) => s.trim())
      query = query.where(
        or(eq(matches.player1Id, session.user.id), eq(matches.player2Id, session.user.id))
      )
      // Re-apply with status filter
      const userMatches = await db
        .select({
          id: matches.id,
          status: matches.status,
          player1Id: matches.player1Id,
          player2Id: matches.player2Id,
          venueId: matches.venueId,
          createdAt: matches.createdAt,
        })
        .from(matches)
        .where(or(eq(matches.player1Id, session.user.id), eq(matches.player2Id, session.user.id)))
        .orderBy(desc(matches.createdAt))
        .limit(20)

      const filteredMatches = userMatches.filter((m) => statuses.includes(m.status))

      // Get full details with opponent info
      const matchDetails = await Promise.all(
        filteredMatches.map(async (m) => {
          const fullMatch = await getMatchById(db, m.id)
          if (!fullMatch) return null

          const isChallenger = m.player1Id === session.user.id
          const opponent = isChallenger ? fullMatch.player2 : fullMatch.player1

          // Get venue name
          const [venue] = await db
            .select({ name: venues.name })
            .from(venues)
            .where(eq(venues.id, m.venueId))
            .limit(1)

          return {
            id: m.id,
            status: m.status,
            venueName: venue?.name || 'Unknown Venue',
            isChallenger,
            opponent: {
              id: opponent.id,
              name: opponent.name,
              avatar: opponent.avatar,
            },
            createdAt: m.createdAt,
          }
        })
      )

      return NextResponse.json({ matches: matchDetails.filter(Boolean) })
    }

    // No filter - return all matches
    const userMatches = await query

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
