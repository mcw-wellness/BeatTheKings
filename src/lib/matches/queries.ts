/**
 * Match query functions (read operations)
 */

import { eq, and, or } from 'drizzle-orm'
import { matches, matchInvitations, venues, sports } from '@/db/schema'
import type { Database } from '@/db'
import { getAvatarUrl, getPlayerInfo } from './helpers'
import type { MatchDetail } from './types'
import { logger } from '@/lib/utils/logger'

/**
 * Get match details by ID
 */
export async function getMatchById(db: Database, matchId: string): Promise<MatchDetail | null> {
  const [match] = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1)

  if (!match) return null

  const [venue] = await db
    .select({ name: venues.name })
    .from(venues)
    .where(eq(venues.id, match.venueId))
    .limit(1)

  const [sport] = await db
    .select({ name: sports.name })
    .from(sports)
    .where(eq(sports.id, match.sportId))
    .limit(1)

  const player1Info = await getPlayerInfo(db, match.player1Id)
  const player2Info = await getPlayerInfo(db, match.player2Id)

  let scheduledAt: string | null = null
  if (match.invitationId) {
    const [invitation] = await db
      .select({ scheduledAt: matchInvitations.scheduledAt })
      .from(matchInvitations)
      .where(eq(matchInvitations.id, match.invitationId))
      .limit(1)
    scheduledAt = invitation?.scheduledAt?.toISOString() || null
  }

  return {
    id: match.id,
    status: match.status,
    venueName: venue?.name || 'Unknown',
    sportName: sport?.name || 'Unknown',
    player1: {
      id: match.player1Id,
      name: player1Info.name,
      avatar: { imageUrl: getAvatarUrl(match.player1Id, player1Info.hasAvatar, player1Info.gender) },
      score: match.player1Score,
      agreed: match.player1Agreed,
    },
    player2: {
      id: match.player2Id,
      name: player2Info.name,
      avatar: { imageUrl: getAvatarUrl(match.player2Id, player2Info.hasAvatar, player2Info.gender) },
      score: match.player2Score,
      agreed: match.player2Agreed,
    },
    winnerId: match.winnerId,
    videoUrl: match.videoUrl,
    recordingBy: match.recordingBy,
    scheduledAt,
    createdAt: match.createdAt.toISOString(),
    startedAt: match.startedAt?.toISOString() || null,
    completedAt: match.completedAt?.toISOString() || null,
  }
}

/**
 * Check if user can challenge opponent (with auto-expiry of stale matches)
 */
export async function canChallenge(
  db: Database,
  challengerId: string,
  opponentId: string
): Promise<{ canChallenge: boolean; error?: string }> {
  const existingMatches = await db
    .select({ id: matches.id, status: matches.status, createdAt: matches.createdAt })
    .from(matches)
    .where(
      and(
        or(
          and(eq(matches.player1Id, challengerId), eq(matches.player2Id, opponentId)),
          and(eq(matches.player1Id, opponentId), eq(matches.player2Id, challengerId))
        ),
        or(
          eq(matches.status, 'pending'),
          eq(matches.status, 'scheduled'),
          eq(matches.status, 'accepted'),
          eq(matches.status, 'in_progress'),
          eq(matches.status, 'uploading'),
          eq(matches.status, 'analyzing')
        )
      )
    )

  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)
  const activeMatches = []

  for (const m of existingMatches) {
    if (m.status === 'pending' && m.createdAt < thirtyMinutesAgo) {
      await db.update(matches).set({ status: 'cancelled' }).where(eq(matches.id, m.id))
      logger.info({ matchId: m.id }, 'Auto-expired stale pending match')
    } else {
      activeMatches.push(m)
    }
  }

  if (activeMatches.length > 0) {
    return { canChallenge: false, error: 'Already have an active challenge with this player' }
  }

  return { canChallenge: true }
}
