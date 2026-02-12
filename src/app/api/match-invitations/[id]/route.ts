/**
 * DELETE /api/match-invitations/[id] - Cancel a pending invitation (sender only)
 */

import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/db'
import { cancelInvitation } from '@/lib/invitations'
import { logger } from '@/lib/utils/logger'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const db = getDb()
    const result = await cancelInvitation(db, id, session.user.id)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error({ error }, 'Failed to cancel invitation')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
