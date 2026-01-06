import { NextResponse } from 'next/server'
import { getDb } from '@/db'
import { getSession } from '@/lib/auth'
import { respondToChallenge } from '@/lib/matches'
import { logger } from '@/lib/utils/logger'

interface RouteParams {
  params: Promise<{ matchId: string }>
}

interface RequestBody {
  accept: boolean
}

/**
 * POST /api/challenges/1v1/[matchId]/respond
 * Accept or decline a challenge
 */
export async function POST(request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { matchId } = await params

    let body: RequestBody
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    if (typeof body.accept !== 'boolean') {
      return NextResponse.json({ error: 'accept must be a boolean' }, { status: 400 })
    }

    const db = getDb()
    const result = await respondToChallenge(db, matchId, session.user.id, body.accept)

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }

    logger.info(
      { matchId, opponentId: session.user.id, accepted: body.accept },
      'Challenge response submitted'
    )

    return NextResponse.json({
      success: true,
      status: body.accept ? 'accepted' : 'declined',
    })
  } catch (error) {
    logger.error({ error }, 'Failed to respond to challenge')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
