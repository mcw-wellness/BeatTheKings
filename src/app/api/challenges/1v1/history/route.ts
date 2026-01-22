import { NextResponse } from 'next/server'
import { eq, and, or, desc } from 'drizzle-orm'
import { getDb } from '@/db'
import { matches, users, venues } from '@/db/schema'
import { getSession } from '@/lib/auth'
import { logger } from '@/lib/utils/logger'
import { getUserAvatarSasUrl } from '@/lib/azure-storage'

interface Match1v1History {
  id: string
  opponent: {
    id: string
    name: string | null
    avatarUrl: string | null
  }
  venueName: string
  myScore: number
  opponentScore: number
  won: boolean
  completedAt: string
}

interface HistoryResponse {
  stats: {
    totalMatches: number
    wins: number
    losses: number
  }
  matches: Match1v1History[]
}

/**
 * GET /api/challenges/1v1/history
 * Returns user's 1v1 match history
 */
export async function GET(): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = getDb()
    const userId = session.user.id

    // Get all completed matches for this user
    const userMatches = await db
      .select({
        id: matches.id,
        player1Id: matches.player1Id,
        player2Id: matches.player2Id,
        player1Score: matches.player1Score,
        player2Score: matches.player2Score,
        winnerId: matches.winnerId,
        completedAt: matches.completedAt,
        venueName: venues.name,
      })
      .from(matches)
      .innerJoin(venues, eq(matches.venueId, venues.id))
      .where(
        and(
          or(eq(matches.player1Id, userId), eq(matches.player2Id, userId)),
          eq(matches.status, 'completed')
        )
      )
      .orderBy(desc(matches.completedAt))

    // Get opponent details for each match
    const matchHistory: Match1v1History[] = await Promise.all(
      userMatches.map(async (match) => {
        const isPlayer1 = match.player1Id === userId
        const opponentId = isPlayer1 ? match.player2Id : match.player1Id
        const myScore = isPlayer1 ? match.player1Score : match.player2Score
        const opponentScore = isPlayer1 ? match.player2Score : match.player1Score

        // Get opponent info
        const [opponent] = await db
          .select({ id: users.id, name: users.name })
          .from(users)
          .where(eq(users.id, opponentId))

        const avatarUrl = await getUserAvatarSasUrl(opponentId)

        return {
          id: match.id,
          opponent: {
            id: opponentId,
            name: opponent?.name || null,
            avatarUrl,
          },
          venueName: match.venueName,
          myScore: myScore ?? 0,
          opponentScore: opponentScore ?? 0,
          won: match.winnerId === userId,
          completedAt: match.completedAt?.toISOString() ?? new Date().toISOString(),
        }
      })
    )

    // Calculate stats
    const wins = matchHistory.filter((m) => m.won).length
    const losses = matchHistory.filter((m) => !m.won).length

    const response: HistoryResponse = {
      stats: {
        totalMatches: matchHistory.length,
        wins,
        losses,
      },
      matches: matchHistory,
    }

    return NextResponse.json(response)
  } catch (error) {
    logger.error({ error }, 'Failed to get 1v1 history')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
