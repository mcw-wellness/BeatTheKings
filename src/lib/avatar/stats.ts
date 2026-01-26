// Avatar stats operations

import { eq } from 'drizzle-orm'
import { avatarEquipments, avatarItems, playerStats, sports } from '@/db/schema'
import type { Database } from '@/db'
import { getAvatar } from './crud'

export async function getAvatarWithStats(db: Database, userId: string) {
  const avatar = await getAvatar(db, userId)
  if (!avatar) return null

  const equipmentRows = await db
    .select({
      equipment: avatarEquipments,
      sport: sports,
      jersey: { id: avatarItems.id, name: avatarItems.name, imageUrl: avatarItems.imageUrl },
    })
    .from(avatarEquipments)
    .leftJoin(sports, eq(avatarEquipments.sportId, sports.id))
    .leftJoin(avatarItems, eq(avatarEquipments.jerseyItemId, avatarItems.id))
    .where(eq(avatarEquipments.avatarId, avatar.id))

  const statsRows = await db
    .select({ stats: playerStats, sport: sports })
    .from(playerStats)
    .leftJoin(sports, eq(playerStats.sportId, sports.id))
    .where(eq(playerStats.userId, userId))

  const equipment: Record<
    string,
    {
      jerseyNumber: number | null
      shoesItemId: string | null
      jersey: { id: string; name: string; imageUrl: string | null } | null
    }
  > = {}
  for (const row of equipmentRows) {
    if (row.sport) {
      equipment[row.sport.slug] = {
        jerseyNumber: row.equipment.jerseyNumber,
        shoesItemId: row.equipment.shoesItemId,
        jersey: row.jersey,
      }
    }
  }

  const stats: Record<
    string,
    {
      totalXp: number
      totalRp: number
      matchesWon: number
      matchesLost: number
      winRate: number
      challengesCompleted: number
      totalPointsScored: number
    }
  > = {}
  for (const row of statsRows) {
    if (row.sport && row.stats) {
      const played = row.stats.matchesPlayed || 0
      const won = row.stats.matchesWon || 0
      stats[row.sport.slug] = {
        totalXp: row.stats.totalXp,
        totalRp: row.stats.totalRp,
        matchesWon: won,
        matchesLost: row.stats.matchesLost,
        winRate: played > 0 ? Math.round((won / played) * 100) : 0,
        challengesCompleted: row.stats.challengesCompleted,
        totalPointsScored: row.stats.totalPointsScored,
      }
    }
  }

  return {
    avatar: {
      id: avatar.id,
      skinTone: avatar.skinTone,
      hairStyle: avatar.hairStyle,
      hairColor: avatar.hairColor,
      imageUrl: avatar.imageUrl,
      updatedAt: avatar.updatedAt, // Needed for polling to detect updates
    },
    equipment,
    stats,
  }
}
