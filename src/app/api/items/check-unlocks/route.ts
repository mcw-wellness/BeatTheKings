/**
 * POST /api/items/check-unlocks
 * Check and auto-unlock all eligible items for current user
 * Called after match/challenge completion
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/db'
import { checkAndUnlockEligibleItems } from '@/lib/avatar/unlock'
import { logger } from '@/lib/utils/logger'

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = getDb()
    const { searchParams } = new URL(request.url)
    const sportId = searchParams.get('sportId') || undefined

    const { newlyUnlocked } = await checkAndUnlockEligibleItems(db, session.user.id, sportId)

    if (newlyUnlocked.length > 0) {
      logger.info(
        { userId: session.user.id, count: newlyUnlocked.length },
        'Items auto-unlocked via check'
      )
    }

    return NextResponse.json({
      newlyUnlocked: newlyUnlocked.map((item) => ({
        id: item.id,
        name: item.name,
        itemType: item.itemType,
      })),
    })
  } catch (error) {
    logger.error({ error }, 'Failed to check unlocks')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
