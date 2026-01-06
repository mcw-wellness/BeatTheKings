import { NextResponse } from 'next/server'
import { getDb } from '@/db'
import { getSession } from '@/lib/auth'
import { submitAgreement, getMatchById } from '@/lib/matches'
import { logger } from '@/lib/utils/logger'

interface RouteParams {
  params: Promise<{ matchId: string }>
}

interface RequestBody {
  agree: boolean
}

/**
 * POST /api/challenges/1v1/[matchId]/agree
 * Submit agreement or dispute for match results
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

    if (typeof body.agree !== 'boolean') {
      return NextResponse.json({ error: 'agree must be a boolean' }, { status: 400 })
    }

    const db = getDb()
    const result = await submitAgreement(db, matchId, session.user.id, body.agree)

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }

    logger.info(
      { matchId, userId: session.user.id, agreed: body.agree, bothAgreed: result.bothAgreed },
      'Agreement submitted'
    )

    // Get updated match status
    const match = await getMatchById(db, matchId)

    return NextResponse.json({
      success: true,
      bothAgreed: result.bothAgreed,
      status: match?.status || (body.agree ? 'waiting_opponent' : 'disputed'),
      statsUpdated: result.bothAgreed,
    })
  } catch (error) {
    logger.error({ error }, 'Failed to submit agreement')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
