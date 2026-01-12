/**
 * POST /api/items/[itemId]/unlock
 * Unlock an item via achievement or purchase with RP
 */

import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/db'
import { unlockItem } from '@/lib/avatar/unlock'
import { logger } from '@/lib/utils/logger'
import { eq } from 'drizzle-orm'
import { playerStats } from '@/db/schema'

interface RouteParams {
  params: Promise<{ itemId: string }>
}

interface UnlockBody {
  method: 'achievement' | 'purchase'
}

export async function POST(request: Request, { params }: RouteParams): Promise<Response> {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { itemId } = await params
    const db = getDb()

    // Parse request body
    let body: UnlockBody
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    if (!body.method || !['achievement', 'purchase'].includes(body.method)) {
      return NextResponse.json(
        { error: 'Invalid method. Must be "achievement" or "purchase"' },
        { status: 400 }
      )
    }

    const result = await unlockItem(db, session.user.id, itemId, body.method)

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }

    // Get remaining RP for response
    let remainingRp: number | undefined
    if (body.method === 'purchase') {
      const [stats] = await db
        .select({ availableRp: playerStats.availableRp })
        .from(playerStats)
        .where(eq(playerStats.userId, session.user.id))
        .limit(1)
      remainingRp = stats?.availableRp ?? 0
    }

    logger.info({ userId: session.user.id, itemId, method: body.method }, 'Item unlocked via API')

    return NextResponse.json({
      success: true,
      message: result.message,
      unlockedItem: result.item
        ? {
            id: result.item.id,
            name: result.item.name,
            itemType: result.item.itemType,
          }
        : undefined,
      remainingRp,
    })
  } catch (error) {
    logger.error({ error }, 'Failed to unlock item')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
