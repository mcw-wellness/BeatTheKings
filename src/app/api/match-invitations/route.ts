/**
 * POST /api/match-invitations - Send a match invitation
 * GET  /api/match-invitations - Get user's invitations (sent or received)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/db'
import { sendInvitation, getInvitations } from '@/lib/invitations'
import { logger } from '@/lib/utils/logger'

export async function POST(request: Request): Promise<Response> {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { receiverId, venueId, sportId, scheduledAt, message } = body

    if (!receiverId || !venueId || !sportId || !scheduledAt) {
      return NextResponse.json(
        { error: 'receiverId, venueId, sportId, and scheduledAt are required' },
        { status: 400 }
      )
    }

    const db = getDb()
    const result = await sendInvitation(db, {
      senderId: session.user.id,
      receiverId,
      venueId,
      sportId,
      scheduledAt: new Date(scheduledAt),
      message,
    })

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ id: result.id, status: 'pending' })
  } catch (error) {
    logger.error({ error }, 'Failed to send match invitation')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as 'received' | 'sent' | null

    if (!type || (type !== 'received' && type !== 'sent')) {
      return NextResponse.json(
        { error: 'Query param "type" must be "received" or "sent"' },
        { status: 400 }
      )
    }

    const db = getDb()
    const invitations = await getInvitations(db, session.user.id, type)

    return NextResponse.json({ invitations })
  } catch (error) {
    logger.error({ error }, 'Failed to get match invitations')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
