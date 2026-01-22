import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db'
import { getSession } from '@/lib/auth'
import { logger } from '@/lib/utils/logger'
import { getChallengesByType, VALID_CHALLENGE_TYPES } from '@/lib/challenges/attempt-history'

/**
 * GET /api/challenges/by-type/[type]
 * Returns challenges of a specific type with user's attempts and history
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { type } = await params

    if (!VALID_CHALLENGE_TYPES.includes(type)) {
      return NextResponse.json({ error: 'Invalid challenge type' }, { status: 400 })
    }

    const db = getDb()
    const response = await getChallengesByType(db, type, session.user.id)

    return NextResponse.json(response)
  } catch (error) {
    logger.error({ error }, 'Failed to get challenges by type')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
