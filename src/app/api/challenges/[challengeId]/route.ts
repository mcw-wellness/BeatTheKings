/**
 * GET /api/challenges/[challengeId]
 * Get challenge details with user's attempt history
 */

import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/db'
import { getChallengeById } from '@/lib/challenges'
import { logger } from '@/lib/utils/logger'

interface RouteParams {
  params: Promise<{ challengeId: string }>
}

export async function GET(request: Request, { params }: RouteParams): Promise<Response> {
  try {
    const session = await getSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { challengeId } = await params
    const db = getDb()

    const challenge = await getChallengeById(db, challengeId, session.user.id)

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
    }

    return NextResponse.json({ challenge })
  } catch (error) {
    logger.error({ error }, 'Failed to get challenge')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
