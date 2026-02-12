/**
 * POST /api/match-invitations/[id]/respond - Accept or decline an invitation
 */

import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/db'
import { respondToInvitation } from '@/lib/invitations'
import { logger } from '@/lib/utils/logger'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { accept } = body

    if (typeof accept !== 'boolean') {
      return NextResponse.json(
        { error: '"accept" (boolean) is required' },
        { status: 400 }
      )
    }

    const { id } = await params
    const db = getDb()
    const result = await respondToInvitation(db, id, session.user.id, accept)

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    logger.error({ error }, 'Failed to respond to invitation')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
