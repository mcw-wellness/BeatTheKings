/**
 * Challenge-specific match operations
 */

import { eq } from 'drizzle-orm'
import { matches } from '@/db/schema'
import type { Database } from '@/db'
import { getPlayerInfo, updateMatchStats } from './helpers'
import { MATCH_REWARDS } from './types'
import type { MatchResult, UnlockedItem } from './types'
import { checkAndUnlockEligibleItems } from '@/lib/avatar/unlock'
import { logger } from '@/lib/utils/logger'
import {
  notifyChallengeAccepted,
  notifyChallengeDeclined,
  notifyChallengeCancelled,
  notifyMatchCompleted,
} from '@/lib/notifications/triggers'

/**
 * Respond to a challenge (accept/decline — player2 only)
 */
export async function respondToChallenge(
  db: Database,
  matchId: string,
  opponentId: string,
  accept: boolean
): Promise<MatchResult> {
  const [match] = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1)

  if (!match) return { success: false, message: 'Match not found' }
  if (match.player2Id !== opponentId) return { success: false, message: 'Not authorized' }
  if (match.status !== 'pending') return { success: false, message: 'Challenge already responded to' }

  const newStatus = accept ? 'accepted' : 'declined'
  await db.update(matches).set({ status: newStatus }).where(eq(matches.id, matchId))

  const opponentInfo = await getPlayerInfo(db, opponentId)
  if (accept) {
    notifyChallengeAccepted(match.player1Id, { matchId, opponentName: opponentInfo.name || 'Opponent' })
  } else {
    notifyChallengeDeclined(match.player1Id, { matchId, opponentName: opponentInfo.name || 'Opponent' })
  }

  return { success: true, message: accept ? 'Challenge accepted' : 'Challenge declined' }
}

/**
 * Start match (begin recording)
 */
export async function startMatch(
  db: Database,
  matchId: string,
  userId: string
): Promise<MatchResult> {
  const [match] = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1)

  if (!match) return { success: false, message: 'Match not found' }
  if (match.player1Id !== userId && match.player2Id !== userId) {
    return { success: false, message: 'Not a participant in this match' }
  }

  if (match.status === 'accepted' || match.status === 'scheduled') {
    await db
      .update(matches)
      .set({ status: 'in_progress', startedAt: new Date(), recordingBy: userId, recordingStartedAt: new Date() })
      .where(eq(matches.id, matchId))
    return { success: true, message: 'Match started. You are recording.' }
  }

  if (match.status === 'in_progress') {
    if (match.recordingBy && match.recordingBy !== userId) {
      return { success: false, message: 'Other player is already recording this match' }
    }
    if (match.recordingBy === userId) {
      return { success: true, message: 'You are already recording this match' }
    }
    await db
      .update(matches)
      .set({ recordingBy: userId, recordingStartedAt: new Date() })
      .where(eq(matches.id, matchId))
    return { success: true, message: 'Match started. You are recording.' }
  }

  return { success: false, message: 'Match not ready to start' }
}

/**
 * Cancel recording (release lock so other player can record)
 */
export async function cancelRecording(
  db: Database,
  matchId: string,
  userId: string
): Promise<MatchResult> {
  const [match] = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1)

  if (!match) return { success: false, message: 'Match not found' }
  if (match.player1Id !== userId && match.player2Id !== userId) {
    return { success: false, message: 'Not a participant in this match' }
  }
  if (match.status !== 'in_progress') return { success: false, message: 'Match is not in progress' }
  if (match.recordingBy !== userId) return { success: false, message: 'You are not the one recording' }
  if (match.videoUrl) return { success: false, message: 'Video already uploaded, cannot cancel' }

  await db
    .update(matches)
    .set({ status: 'accepted', recordingBy: null, recordingStartedAt: null, startedAt: null })
    .where(eq(matches.id, matchId))

  return { success: true, message: 'Recording cancelled. Other player can now record.' }
}

/**
 * Cancel a challenge (challenger/player1 only)
 */
export async function cancelChallenge(
  db: Database,
  matchId: string,
  userId: string
): Promise<MatchResult> {
  const [match] = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1)

  if (!match) return { success: false, message: 'Match not found' }
  if (match.player1Id !== userId) return { success: false, message: 'Only the challenger can cancel' }
  if (match.status !== 'pending') return { success: false, message: 'Can only cancel pending challenges' }

  await db.update(matches).set({ status: 'cancelled' }).where(eq(matches.id, matchId))

  const challengerInfo = await getPlayerInfo(db, userId)
  notifyChallengeCancelled(match.player2Id, { matchId, challengerName: challengerInfo.name || 'Opponent' })

  return { success: true, message: 'Challenge cancelled' }
}

/**
 * Submit agreement or dispute for match result
 */
export async function submitAgreement(
  db: Database,
  matchId: string,
  userId: string,
  agree: boolean
): Promise<{ success: boolean; bothAgreed: boolean; message: string; newlyUnlockedItems?: UnlockedItem[] }> {
  const [match] = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1)

  if (!match) return { success: false, bothAgreed: false, message: 'Match not found' }

  const isPlayer1 = match.player1Id === userId
  const isPlayer2 = match.player2Id === userId
  if (!isPlayer1 && !isPlayer2) return { success: false, bothAgreed: false, message: 'Not a participant' }
  if (match.status !== 'completed') return { success: false, bothAgreed: false, message: 'Match not ready for agreement' }

  if (!agree) {
    await db.update(matches).set({ status: 'disputed' }).where(eq(matches.id, matchId))
    return { success: true, bothAgreed: false, message: 'Match disputed' }
  }

  if (isPlayer1) {
    await db.update(matches).set({ player1Agreed: true }).where(eq(matches.id, matchId))
  } else {
    await db.update(matches).set({ player2Agreed: true }).where(eq(matches.id, matchId))
  }

  const otherAgreed = isPlayer1 ? match.player2Agreed : match.player1Agreed
  if (otherAgreed) {
    await updateMatchStats(db, match)

    const [player1Unlocks, player2Unlocks] = await Promise.all([
      checkAndUnlockEligibleItems(db, match.player1Id, match.sportId),
      checkAndUnlockEligibleItems(db, match.player2Id, match.sportId),
    ])

    const userUnlocks = userId === match.player1Id ? player1Unlocks : player2Unlocks
    const newlyUnlockedItems = userUnlocks.newlyUnlocked.map((item) => ({
      id: item.id, name: item.name, itemType: item.itemType,
    }))

    if (newlyUnlockedItems.length > 0) {
      logger.info({ userId, count: newlyUnlockedItems.length }, 'Items unlocked after match agreement')
    }

    const otherPlayerId = userId === match.player1Id ? match.player2Id : match.player1Id
    notifyMatchCompleted(otherPlayerId, {
      matchId,
      winnerId: match.winnerId,
      xpEarned: match.winnerId === otherPlayerId ? MATCH_REWARDS.winnerXp : MATCH_REWARDS.loserXp,
    })

    return {
      success: true,
      bothAgreed: true,
      message: 'Match finalized',
      newlyUnlockedItems: newlyUnlockedItems.length > 0 ? newlyUnlockedItems : undefined,
    }
  }

  return { success: true, bothAgreed: false, message: 'Waiting for opponent' }
}
