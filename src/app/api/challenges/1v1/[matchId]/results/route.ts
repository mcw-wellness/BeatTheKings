import { NextResponse } from 'next/server'
import { getDb } from '@/db'
import { getSession } from '@/lib/auth'
import { getMatchById } from '@/lib/matches'
import { logger } from '@/lib/utils/logger'

interface RouteParams {
  params: Promise<{ matchId: string }>
}

/**
 * GET /api/challenges/1v1/[matchId]/results
 * Get match results after AI analysis
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
      return NextResponse.json({ error: 'Not a participant' }, { status: 403 })
    }

    // Check if still analyzing
    if (match.status === 'analyzing' || match.status === 'uploading') {
      return NextResponse.json({
        status: match.status,
        analyzing: true,
      })
    }

    // Determine if current user won
    const isWinner = match.winnerId === session.user.id

    // Get scores based on role
    const userScore = isPlayer1 ? match.player1.score : match.player2.score
    const opponentScore = isPlayer1 ? match.player2.score : match.player1.score

    // Get opponent details
    const opponent = isPlayer1 ? match.player2 : match.player1

    // Get XP/RP (from match data - simplified for now)
    const xpEarned = isWinner ? 150 : 50
    const rpEarned = isWinner ? 30 : 0

    return NextResponse.json({
      status: match.status,
      analyzing: false,
      result: {
        isWinner,
        userScore,
        opponentScore,
        opponent: {
          id: opponent.id,
          name: opponent.name,
          imageUrl: opponent.avatar.imageUrl,
        },
        xpEarned,
        rpEarned,
        userAgreed: isPlayer1 ? match.player1.agreed : match.player2.agreed,
        opponentAgreed: isPlayer1 ? match.player2.agreed : match.player1.agreed,
        venueName: match.venueName,
        startedAt: match.startedAt,
        completedAt: match.completedAt,
      },
    })
  } catch (error) {
    logger.error({ error }, 'Failed to get match results')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
