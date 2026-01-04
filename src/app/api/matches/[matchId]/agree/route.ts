/**
 * POST /api/matches/[matchId]/agree
 * Agree to match result
 */

import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/db'
import { agreeToMatchResult } from '@/lib/matches'
import { logger } from '@/lib/logger'

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
    const db = getDb()

    const result = await agreeToMatchResult(db, matchId, session.user.id)

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    logger.error({ error }, 'Failed to agree to match result')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
