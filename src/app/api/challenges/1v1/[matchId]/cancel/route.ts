import { NextResponse } from 'next/server'
import { getDb } from '@/db'
import { getSession } from '@/lib/auth'
import { cancelChallenge } from '@/lib/matches'
import { logger } from '@/lib/utils/logger'
import { withErrorLogging } from '@/lib/utils/api-handler'

interface RouteParams {
  params: Promise<{ matchId: string }>
}

/**
 * POST /api/challenges/1v1/[matchId]/cancel
 * Cancel a pending challenge (challenger only)
 */
const _POST = async (request: Request, { params }: RouteParams): Promise<NextResponse> => {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { matchId } = await params
    const db = getDb()
    const result = await cancelChallenge(db, matchId, session.user.id)

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }

    logger.info({ matchId, userId: session.user.id }, 'Challenge cancelled by challenger')

    return NextResponse.json({ success: true, status: 'cancelled' })
  } catch (error) {
    logger.error({ error }, 'Failed to cancel challenge')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const POST = withErrorLogging(_POST)
