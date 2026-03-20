/**
 * Match mutation functions (write operations)
 */

import { eq, and, or } from 'drizzle-orm'
import { matches, venues, sports } from '@/db/schema'
import type { Database } from '@/db'
import { getPlayerInfo, updateMatchStats } from './helpers'
import { MATCH_REWARDS } from './types'
import type { MatchResult } from './types'
import { checkAndUnlockEligibleItems } from '@/lib/avatar/unlock'
import { notifyChallengeReceived, notifyScoreSubmitted } from '@/lib/notifications/triggers'

/**
 * Create a new 1v1 match
 */
export async function createMatch(
  db: Database,
  player1Id: string,
  player2Id: string,
  venueId: string,
  sportId: string
): Promise<{ matchId: string } | { error: string }> {
  const [venue] = await db
    .select({ id: venues.id })
    .from(venues)
    .where(eq(venues.id, venueId))
    .limit(1)

  if (!venue) return { error: 'Venue not found' }

  const [sport] = await db
    .select({ id: sports.id })
    .from(sports)
    .where(eq(sports.id, sportId))
    .limit(1)

  if (!sport) return { error: 'Sport not found' }

  const [existingMatch] = await db
    .select({ id: matches.id })
    .from(matches)
    .where(
      and(
        eq(matches.status, 'pending'),
        or(
          and(eq(matches.player1Id, player1Id), eq(matches.player2Id, player2Id)),
          and(eq(matches.player1Id, player2Id), eq(matches.player2Id, player1Id))
        )
      )
    )
    .limit(1)

  if (existingMatch) return { error: 'Match already pending between these players' }

  const [match] = await db
    .insert(matches)
    .values({ player1Id, player2Id, venueId, sportId, status: 'pending' })
    .returning()

  const p1Info = await getPlayerInfo(db, player1Id)
  const [venueInfo] = await db
    .select({ name: venues.name })
    .from(venues)
    .where(eq(venues.id, venueId))
    .limit(1)

  notifyChallengeReceived(player2Id, {
    matchId: match.id,
    challengerName: p1Info.name || 'Someone',
    venueName: venueInfo?.name || 'Unknown',
  })

  return { matchId: match.id }
}

/**
 * Mark player as ready for match
 */
export async function markPlayerReady(
  db: Database,
  matchId: string,
  userId: string
): Promise<MatchResult> {
  const [match] = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1)

  if (!match) return { success: false, message: 'Match not found' }
  if (match.status !== 'pending')
    return { success: false, message: 'Match is not in pending state' }
  if (userId !== match.player1Id && userId !== match.player2Id) {
    return { success: false, message: 'You are not a participant in this match' }
  }

  await db
    .update(matches)
    .set({ status: 'in_progress', startedAt: new Date() })
    .where(eq(matches.id, matchId))

  return { success: true, message: 'Match started' }
}

/**
 * Submit match score
 */
export async function submitMatchScore(
  db: Database,
  matchId: string,
  userId: string,
  player1Score: number,
  player2Score: number
): Promise<MatchResult> {
  const [match] = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1)

  if (!match) return { success: false, message: 'Match not found' }
  if (match.status !== 'in_progress') return { success: false, message: 'Match is not in progress' }
  if (userId !== match.player1Id && userId !== match.player2Id) {
    return { success: false, message: 'You are not a participant in this match' }
  }

  const winnerId =
    player1Score > player2Score
      ? match.player1Id
      : player2Score > player1Score
        ? match.player2Id
        : null

  await db
    .update(matches)
    .set({
      player1Score,
      player2Score,
      winnerId,
      winnerXp: MATCH_REWARDS.winnerXp,
      winnerRp: MATCH_REWARDS.winnerRp,
      loserXp: MATCH_REWARDS.loserXp,
      status: 'completed',
    })
    .where(eq(matches.id, matchId))

  const otherPlayerId = userId === match.player1Id ? match.player2Id : match.player1Id
  notifyScoreSubmitted(otherPlayerId, { matchId, player1Score, player2Score })

  return { success: true, message: 'Score submitted. Waiting for confirmation.' }
}

/**
 * Agree to match result (used by the agree endpoint)
 */
export async function agreeToMatchResult(
  db: Database,
  matchId: string,
  userId: string
): Promise<MatchResult> {
  const [match] = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1)

  if (!match) return { success: false, message: 'Match not found' }
  if (match.player1Score === null || match.player2Score === null) {
    return { success: false, message: 'Score not yet submitted' }
  }

  const isPlayer1 = userId === match.player1Id
  const isPlayer2 = userId === match.player2Id
  if (!isPlayer1 && !isPlayer2) return { success: false, message: 'Not a participant' }

  const updates: Record<string, boolean> = {}
  if (isPlayer1) updates.player1Agreed = true
  if (isPlayer2) updates.player2Agreed = true
  await db.update(matches).set(updates).where(eq(matches.id, matchId))

  const bothAgreed = (isPlayer1 && match.player2Agreed) || (isPlayer2 && match.player1Agreed)

  if (bothAgreed) {
    await db
      .update(matches)
      .set({ status: 'completed', completedAt: new Date() })
      .where(eq(matches.id, matchId))

    await updateMatchStats(db, match)

    const [player1Unlocks, player2Unlocks] = await Promise.all([
      checkAndUnlockEligibleItems(db, match.player1Id, match.sportId),
      checkAndUnlockEligibleItems(db, match.player2Id, match.sportId),
    ])

    const userUnlocks = userId === match.player1Id ? player1Unlocks : player2Unlocks
    const newlyUnlockedItems = userUnlocks.newlyUnlocked.map((item) => ({
      id: item.id,
      name: item.name,
      itemType: item.itemType,
    }))

    const isWinner = match.winnerId === userId
    return {
      success: true,
      message: 'Match completed!',
      xpEarned: isWinner ? MATCH_REWARDS.winnerXp : MATCH_REWARDS.loserXp,
      rpEarned: isWinner ? MATCH_REWARDS.winnerRp : 0,
      newlyUnlockedItems: newlyUnlockedItems.length > 0 ? newlyUnlockedItems : undefined,
    }
  }

  return { success: true, message: 'Waiting for opponent to agree' }
}

/**
 * Dispute match result
 */
export async function disputeMatchResult(
  db: Database,
  matchId: string,
  userId: string,
  reason?: string,
  details?: string
): Promise<MatchResult> {
  const [match] = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1)

  if (!match) return { success: false, message: 'Match not found' }
  if (userId !== match.player1Id && userId !== match.player2Id) {
    return { success: false, message: 'You are not a participant in this match' }
  }

  await db
    .update(matches)
    .set({
      status: 'disputed',
      disputeReason: reason || null,
      disputeDetails: details || null,
      disputedBy: userId,
      disputedAt: new Date(),
    })
    .where(eq(matches.id, matchId))

  return { success: true, message: 'Match disputed. An admin will review.' }
}

/**
 * Update match status
 */
export async function updateMatchStatus(
  db: Database,
  matchId: string,
  status: string
): Promise<void> {
  await db.update(matches).set({ status }).where(eq(matches.id, matchId))
}

/**
 * Save video URL after upload
 */
export async function saveMatchVideo(
  db: Database,
  matchId: string,
  videoUrl: string
): Promise<void> {
  await db.update(matches).set({ videoUrl }).where(eq(matches.id, matchId))
}

/**
 * Save match results
 */
export async function saveMatchResults(
  db: Database,
  matchId: string,
  results: {
    player1Score: number
    player2Score: number
    winnerId: string
    winnerXp: number
    winnerRp: number
    loserXp: number
  }
): Promise<void> {
  await db
    .update(matches)
    .set({
      player1Score: results.player1Score,
      player2Score: results.player2Score,
      winnerId: results.winnerId,
      winnerXp: results.winnerXp,
      winnerRp: results.winnerRp,
      loserXp: results.loserXp,
      status: 'completed',
      completedAt: new Date(),
    })
    .where(eq(matches.id, matchId))
}
