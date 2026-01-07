/**
 * GET /api/matches - Get user's match history
 * POST /api/matches - Create a new 1v1 match
 */

import { NextRequest, NextResponse } from 'next/server'
import { eq, or, desc } from 'drizzle-orm'
import { getSession } from '@/lib/auth'
import { getDb } from '@/db'
import { createMatch, getMatchById } from '@/lib/matches'
import { matches } from '@/db/schema'
import { logger } from '@/lib/utils/logger'

/**
 * Response format for match list (per PRD_MATCHES_PAGE.md)
 */
interface MatchListItem {
  id: string
  status: string
  venueName: string
  isChallenger: boolean
  opponent: {
    id: string
    name: string | null
    avatar: { imageUrl: string | null }
  }
  player1Score: number | null
  player2Score: number | null
  winnerId: string | null
  createdAt: string
}

/**
 * Transform match detail to list item format
 */
function transformMatch(
  fullMatch: NonNullable<Awaited<ReturnType<typeof getMatchById>>>,
  userId: string
): MatchListItem {
  const isChallenger = fullMatch.player1.id === userId
  const opponent = isChallenger ? fullMatch.player2 : fullMatch.player1

  return {
    id: fullMatch.id,
    status: fullMatch.status,
    venueName: fullMatch.venueName,
    isChallenger,
    opponent: {
      id: opponent.id,
      name: opponent.name,
      avatar: { imageUrl: opponent.avatar.imageUrl },
    },
    player1Score: fullMatch.player1.score,
    player2Score: fullMatch.player2.score,
    winnerId: fullMatch.winnerId,
    createdAt: fullMatch.createdAt,
  }
}

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const session = await getSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = getDb()
    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status')
    const statuses = statusFilter ? statusFilter.split(',').map((s) => s.trim()) : null

    // Fetch user's matches
    const userMatches = await db
      .select({
        id: matches.id,
        status: matches.status,
        player1Id: matches.player1Id,
      })
      .from(matches)
      .where(or(eq(matches.player1Id, session.user.id), eq(matches.player2Id, session.user.id)))
      .orderBy(desc(matches.createdAt))
      .limit(20)

    // Apply status filter if provided
    const filteredMatches = statuses
      ? userMatches.filter((m) => statuses.includes(m.status))
      : userMatches

    // Get full details and transform to list format
    const matchDetails: MatchListItem[] = []

    for (const m of filteredMatches) {
      const fullMatch = await getMatchById(db, m.id)
      if (fullMatch) {
        matchDetails.push(transformMatch(fullMatch, session.user.id))
      }
    }

    return NextResponse.json({ matches: matchDetails })
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
