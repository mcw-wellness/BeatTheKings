import { NextResponse } from 'next/server'
import { getDb } from '@/db'
import { getSession } from '@/lib/auth'
import { createMatch, canChallenge } from '@/lib/matches'
import { logger } from '@/lib/utils/logger'
import { eq } from 'drizzle-orm'
import { sports } from '@/db/schema'

interface RequestBody {
  opponentId: string
  venueId: string
}

/**
 * POST /api/challenges/1v1/request
 * Create a new 1v1 challenge request
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body: RequestBody
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { opponentId, venueId } = body

    if (!opponentId || !venueId) {
      return NextResponse.json({ error: 'opponentId and venueId are required' }, { status: 400 })
    }

    if (opponentId === session.user.id) {
      return NextResponse.json({ error: 'Cannot challenge yourself' }, { status: 400 })
    }

    const db = getDb()

    // Check if can challenge
    const { canChallenge: allowed, error } = await canChallenge(db, session.user.id, opponentId)

    if (!allowed) {
      return NextResponse.json({ error: error || 'Cannot challenge this player' }, { status: 400 })
    }

    // Get basketball sport ID
    const [basketball] = await db
      .select({ id: sports.id })
      .from(sports)
      .where(eq(sports.slug, 'basketball'))

    if (!basketball) {
      return NextResponse.json({ error: 'Sport not found' }, { status: 500 })
    }

    // Create match
    const result = await createMatch(db, session.user.id, opponentId, venueId, basketball.id)

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    logger.info(
      { matchId: result.matchId, challengerId: session.user.id, opponentId },
      '1v1 challenge created'
    )

    return NextResponse.json({
      success: true,
      matchId: result.matchId,
      status: 'pending',
    })
  } catch (error) {
    logger.error({ error }, 'Failed to create 1v1 challenge')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
