/**
 * POST /api/challenges/[challengeId]/attempt
 * Record a challenge attempt and update stats
 */

import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/db'
import { recordChallengeAttempt } from '@/lib/challenges'
import { logger } from '@/lib/utils/logger'

interface RouteParams {
  params: Promise<{ challengeId: string }>
}

export async function POST(request: Request, { params }: RouteParams): Promise<Response> {
  try {
    const session = await getSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { challengeId } = await params
    const body = await request.json()
    const { scoreValue, maxValue } = body

    // Validate input
    if (typeof scoreValue !== 'number' || typeof maxValue !== 'number') {
      return NextResponse.json({ error: 'scoreValue and maxValue are required' }, { status: 400 })
    }

    if (scoreValue < 0 || maxValue < 0) {
      return NextResponse.json({ error: 'Values cannot be negative' }, { status: 400 })
    }

    if (scoreValue > maxValue) {
      return NextResponse.json({ error: 'scoreValue cannot exceed maxValue' }, { status: 400 })
    }

    const db = getDb()
    const result = await recordChallengeAttempt(
      db,
      session.user.id,
      challengeId,
      scoreValue,
      maxValue
    )

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 404 })
    }

    return NextResponse.json(result)
  } catch (error) {
    logger.error({ error }, 'Failed to record challenge attempt')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
