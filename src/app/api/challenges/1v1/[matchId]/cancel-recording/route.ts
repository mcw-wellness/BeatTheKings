/**
 * POST /api/challenges/1v1/[matchId]/cancel-recording
 * Cancel recording and release lock so other player can record
 */

import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/db'
import { cancelRecording } from '@/lib/matches'
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
    const db = getDb()

    const result = await cancelRecording(db, matchId, session.user.id)

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }

    logger.info({ matchId, userId: session.user.id }, 'Recording cancelled')

    return NextResponse.json(result)
  } catch (error) {
    logger.error({ error }, 'Failed to cancel recording')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
