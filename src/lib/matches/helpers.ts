/**
 * Match helper functions (internal utilities)
 */

import { eq, and } from 'drizzle-orm'
import { users, avatars, playerStats, matches } from '@/db/schema'
import type { Database } from '@/db'
import { getUserAvatarSasUrl, getDefaultAvatarSasUrl } from '@/lib/azure-storage'
import { MATCH_REWARDS } from './types'

export function getAvatarUrl(userId: string, hasAvatar: boolean, gender: string | null): string {
  if (hasAvatar) {
    return getUserAvatarSasUrl(userId)
  }
  return getDefaultAvatarSasUrl(gender || 'male')
}

export async function getPlayerInfo(
  db: Database,
  userId: string
): Promise<{ name: string | null; gender: string | null; hasAvatar: boolean }> {
  const [user] = await db
    .select({ name: users.name, gender: users.gender })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  const [avatar] = await db
    .select({ imageUrl: avatars.imageUrl })
    .from(avatars)
    .where(eq(avatars.userId, userId))
    .limit(1)

  return {
    name: user?.name || null,
    gender: user?.gender || null,
    hasAvatar: !!avatar?.imageUrl,
  }
}

/**
 * Update player stats after match completion
 */
export async function updateMatchStats(
  db: Database,
  match: typeof matches.$inferSelect
): Promise<void> {
  const winnerId = match.winnerId
  const loserId =
    winnerId === match.player1Id
      ? match.player2Id
      : winnerId === match.player2Id
        ? match.player1Id
        : null

  if (winnerId) {
    const [winnerStats] = await db
      .select()
      .from(playerStats)
      .where(and(eq(playerStats.userId, winnerId), eq(playerStats.sportId, match.sportId)))
      .limit(1)

    if (winnerStats) {
      await db
        .update(playerStats)
        .set({
          matchesPlayed: winnerStats.matchesPlayed + 1,
          matchesWon: winnerStats.matchesWon + 1,
          totalXp: winnerStats.totalXp + MATCH_REWARDS.winnerXp,
          totalRp: winnerStats.totalRp + MATCH_REWARDS.winnerRp,
          availableRp: winnerStats.availableRp + MATCH_REWARDS.winnerRp,
          updatedAt: new Date(),
        })
        .where(eq(playerStats.id, winnerStats.id))
    } else {
      await db.insert(playerStats).values({
        userId: winnerId,
        sportId: match.sportId,
        matchesPlayed: 1,
        matchesWon: 1,
        totalXp: MATCH_REWARDS.winnerXp,
        totalRp: MATCH_REWARDS.winnerRp,
        availableRp: MATCH_REWARDS.winnerRp,
      })
    }
  }

  if (loserId) {
    const [loserStats] = await db
      .select()
      .from(playerStats)
      .where(and(eq(playerStats.userId, loserId), eq(playerStats.sportId, match.sportId)))
      .limit(1)

    if (loserStats) {
      await db
        .update(playerStats)
        .set({
          matchesPlayed: loserStats.matchesPlayed + 1,
          matchesLost: loserStats.matchesLost + 1,
          totalXp: loserStats.totalXp + MATCH_REWARDS.loserXp,
          updatedAt: new Date(),
        })
        .where(eq(playerStats.id, loserStats.id))
    } else {
      await db.insert(playerStats).values({
        userId: loserId,
        sportId: match.sportId,
        matchesPlayed: 1,
        matchesLost: 1,
        totalXp: MATCH_REWARDS.loserXp,
      })
    }
  }
}
