/**
 * GET /api/notifications/count - Get pending invitation count for badge
 */

import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/db'
import { getPendingInvitationCount } from '@/lib/invitations'
import { logger } from '@/lib/utils/logger'

export async function GET(): Promise<Response> {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = getDb()
    const pendingInvitations = await getPendingInvitationCount(db, session.user.id)

    return NextResponse.json({ pendingInvitations })
  } catch (error) {
    logger.error({ error }, 'Failed to get notification count')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
