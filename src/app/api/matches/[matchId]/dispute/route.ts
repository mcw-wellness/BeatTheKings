/**
 * POST /api/matches/[matchId]/dispute
 * Dispute match result
 */

import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/db'
import { disputeMatchResult } from '@/lib/matches'
import { logger } from '@/lib/utils/logger'

interface RouteParams {
  params: Promise<{ matchId: string }>
}

interface DisputeBody {
  reason?: string
  details?: string
}

export async function POST(request: Request, { params }: RouteParams): Promise<Response> {
  try {
    const session = await getSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { matchId } = await params
    const db = getDb()

    // Parse request body for reason and details
    let body: DisputeBody = {}
    try {
      body = await request.json()
    } catch {
      // Body is optional, continue without it
    }

    const result = await disputeMatchResult(db, matchId, session.user.id, body.reason, body.details)

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    logger.error({ error }, 'Failed to dispute match result')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
