/**
 * GET /api/items
 * Get all avatar items with unlock status for current user
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/db'
import { getItemsWithStatus } from '@/lib/avatar/unlock'
import { logger } from '@/lib/utils/logger'

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = getDb()
    const { searchParams } = new URL(request.url)
    const sportId = searchParams.get('sportId') || undefined
    const itemType = searchParams.get('type') || undefined

    const { items, stats } = await getItemsWithStatus(db, session.user.id, sportId)

    // Filter by type if specified
    const filteredItems = itemType ? items.filter((item) => item.itemType === itemType) : items

    // Transform for API response
    const response = {
      items: filteredItems.map((item) => ({
        id: item.id,
        name: item.name,
        itemType: item.itemType,
        sportId: item.sportId,
        imageUrl: item.imageUrl,
        isDefault: item.isDefault,

        // Unlock info
        isUnlocked: item.isUnlocked,
        unlockedVia: item.unlockedVia,
        canUnlock: item.canUnlock,
        canPurchase: item.canPurchase,

        // Requirements
        requiredMatches: item.requiredMatches,
        requiredChallenges: item.requiredChallenges,
        requiredInvites: item.requiredInvites,
        requiredXp: item.requiredXp,
        rpCost: item.rpCost,

        // Progress
        progress: item.progress,
      })),
      stats: stats
        ? {
            matchesPlayed: stats.matchesPlayed,
            challengesCompleted: stats.challengesCompleted,
            usersInvited: stats.usersInvited,
            totalXp: stats.totalXp,
            availableRp: stats.availableRp,
          }
        : null,
    }

    return NextResponse.json(response)
  } catch (error) {
    logger.error({ error }, 'Failed to get items')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
