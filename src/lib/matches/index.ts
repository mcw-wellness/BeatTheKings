/**
 * Matches Library
 * Functions for managing 1v1 matches
 */

import { eq, and, or } from 'drizzle-orm'
import { matches, matchInvitations, playerStats, users, avatars, venues, sports } from '@/db/schema'
import type { Database } from '@/db'
import { getUserAvatarSasUrl, getDefaultAvatarSasUrl } from '@/lib/azure-storage'
import { checkAndUnlockEligibleItems } from '@/lib/avatar/unlock'
import { logger } from '@/lib/utils/logger'
import {
  notifyChallengeReceived,
  notifyChallengeAccepted,
  notifyChallengeDeclined,
  notifyChallengeCancelled,
  notifyScoreSubmitted,
  notifyMatchCompleted,
} from '@/lib/notifications/triggers'

// ===========================================
// TYPES
// ===========================================

export interface MatchPlayer {
  id: string
  name: string | null
  avatar: { imageUrl: string }
  score: number | null
  agreed: boolean
}

export interface MatchDetail {
  id: string
  status: string
  venueName: string
  sportName: string
  player1: MatchPlayer
  player2: MatchPlayer
  winnerId: string | null
  videoUrl: string | null
  recordingBy: string | null
  scheduledAt: string | null
  createdAt: string
  startedAt: string | null
  completedAt: string | null
}

export interface UnlockedItem {
  id: string
  name: string
  itemType: string
}

export interface MatchResult {
  success: boolean
  message: string
  xpEarned?: number
  rpEarned?: number
  newlyUnlockedItems?: UnlockedItem[]
}

// ===========================================
// CONSTANTS
// ===========================================

const MATCH_REWARDS = {
  winnerXp: 100,
  winnerRp: 20,
  loserXp: 25, // Participation XP
}

// ===========================================
// HELPER FUNCTIONS
// ===========================================

function getAvatarUrl(userId: string, hasAvatar: boolean, gender: string | null): string {
  if (hasAvatar) {
    return getUserAvatarSasUrl(userId)
  }
  return getDefaultAvatarSasUrl(gender || 'male')
}

async function getPlayerInfo(
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

// ===========================================
// MATCH OPERATIONS
// ===========================================

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
  // Verify venue exists
  const [venue] = await db
    .select({ id: venues.id })
    .from(venues)
    .where(eq(venues.id, venueId))
    .limit(1)

  if (!venue) {
    return { error: 'Venue not found' }
  }

  // Verify sport exists
  const [sport] = await db
    .select({ id: sports.id })
    .from(sports)
    .where(eq(sports.id, sportId))
    .limit(1)

  if (!sport) {
    return { error: 'Sport not found' }
  }

  // Check for existing pending match between these players
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

  if (existingMatch) {
    return { error: 'Match already pending between these players' }
  }

  // Create match
  const [match] = await db
    .insert(matches)
    .values({
      player1Id,
      player2Id,
      venueId,
      sportId,
      status: 'pending',
    })
    .returning()

  // Get challenger name and venue name for notification
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
 * Get match details
 */
export async function getMatchById(db: Database, matchId: string): Promise<MatchDetail | null> {
  const [match] = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1)

  if (!match) return null

  // Get venue and sport names
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

  // Get player info
  const player1Info = await getPlayerInfo(db, match.player1Id)
  const player2Info = await getPlayerInfo(db, match.player2Id)

  // Get scheduledAt from linked invitation (if any)
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
      avatar: {
        imageUrl: getAvatarUrl(match.player1Id, player1Info.hasAvatar, player1Info.gender),
      },
      score: match.player1Score,
      agreed: match.player1Agreed,
    },
    player2: {
      id: match.player2Id,
      name: player2Info.name,
      avatar: {
        imageUrl: getAvatarUrl(match.player2Id, player2Info.hasAvatar, player2Info.gender),
      },
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
 * Mark player as ready for match
 */
export async function markPlayerReady(
  db: Database,
  matchId: string,
  userId: string
): Promise<MatchResult> {
  const [match] = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1)

  if (!match) {
    return { success: false, message: 'Match not found' }
  }

  if (match.status !== 'pending') {
    return { success: false, message: 'Match is not in pending state' }
  }

  if (userId !== match.player1Id && userId !== match.player2Id) {
    return { success: false, message: 'You are not a participant in this match' }
  }

  // Start match if both ready (simplified - in real app would use separate ready flags)
  await db
    .update(matches)
    .set({
      status: 'in_progress',
      startedAt: new Date(),
    })
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

  if (!match) {
    return { success: false, message: 'Match not found' }
  }

  if (match.status !== 'in_progress') {
    return { success: false, message: 'Match is not in progress' }
  }

  if (userId !== match.player1Id && userId !== match.player2Id) {
    return { success: false, message: 'You are not a participant in this match' }
  }

  // Determine winner
  const winnerId =
    player1Score > player2Score
      ? match.player1Id
      : player2Score > player1Score
        ? match.player2Id
        : null // Draw

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

  // Notify the other player that score was submitted
  const otherPlayerId = userId === match.player1Id ? match.player2Id : match.player1Id
  notifyScoreSubmitted(otherPlayerId, { matchId, player1Score, player2Score })

  return { success: true, message: 'Score submitted. Waiting for confirmation.' }
}

/**
 * Agree to match result
 */
export async function agreeToMatchResult(
  db: Database,
  matchId: string,
  userId: string
): Promise<MatchResult> {
  const [match] = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1)

  if (!match) {
    return { success: false, message: 'Match not found' }
  }

  if (match.player1Score === null || match.player2Score === null) {
    return { success: false, message: 'Score not yet submitted' }
  }

  const isPlayer1 = userId === match.player1Id
  const isPlayer2 = userId === match.player2Id

  if (!isPlayer1 && !isPlayer2) {
    return { success: false, message: 'You are not a participant in this match' }
  }

  // Update agreement
  const updates: Record<string, boolean> = {}
  if (isPlayer1) updates.player1Agreed = true
  if (isPlayer2) updates.player2Agreed = true

  await db.update(matches).set(updates).where(eq(matches.id, matchId))

  // Check if both agreed
  const bothAgreed = (isPlayer1 && match.player2Agreed) || (isPlayer2 && match.player1Agreed)

  if (bothAgreed) {
    // Complete match and update stats
    await db
      .update(matches)
      .set({
        status: 'completed',
        completedAt: new Date(),
      })
      .where(eq(matches.id, matchId))

    // Update player stats
    await updateMatchStats(db, match)

    // Check for newly unlocked items for both players
    const [player1Unlocks, player2Unlocks] = await Promise.all([
      checkAndUnlockEligibleItems(db, match.player1Id, match.sportId),
      checkAndUnlockEligibleItems(db, match.player2Id, match.sportId),
    ])

    // Get unlocks for current user
    const userUnlocks = userId === match.player1Id ? player1Unlocks : player2Unlocks
    const newlyUnlockedItems = userUnlocks.newlyUnlocked.map((item) => ({
      id: item.id,
      name: item.name,
      itemType: item.itemType,
    }))

    if (newlyUnlockedItems.length > 0) {
      logger.info({ userId, count: newlyUnlockedItems.length }, 'Items unlocked after match')
    }

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

  if (!match) {
    return { success: false, message: 'Match not found' }
  }

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
 * Update player stats after match completion
 */
async function updateMatchStats(db: Database, match: typeof matches.$inferSelect): Promise<void> {
  const winnerId = match.winnerId
  const loserId =
    winnerId === match.player1Id
      ? match.player2Id
      : winnerId === match.player2Id
        ? match.player1Id
        : null

  // Update winner stats
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

  // Update loser stats
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

// ===========================================
// 1v1 CHALLENGE FLOW FUNCTIONS
// ===========================================

/**
 * Respond to a challenge (accept/decline)
 */
export async function respondToChallenge(
  db: Database,
  matchId: string,
  opponentId: string,
  accept: boolean
): Promise<MatchResult> {
  const [match] = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1)

  if (!match) {
    return { success: false, message: 'Match not found' }
  }

  if (match.player2Id !== opponentId) {
    return { success: false, message: 'Not authorized to respond to this challenge' }
  }

  if (match.status !== 'pending') {
    return { success: false, message: 'Challenge already responded to' }
  }

  const newStatus = accept ? 'accepted' : 'declined'
  await db.update(matches).set({ status: newStatus }).where(eq(matches.id, matchId))

  // Notify the challenger
  const opponentInfo = await getPlayerInfo(db, opponentId)
  if (accept) {
    notifyChallengeAccepted(match.player1Id, {
      matchId,
      opponentName: opponentInfo.name || 'Opponent',
    })
  } else {
    notifyChallengeDeclined(match.player1Id, {
      matchId,
      opponentName: opponentInfo.name || 'Opponent',
    })
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

  if (!match) {
    return { success: false, message: 'Match not found' }
  }

  if (match.player1Id !== userId && match.player2Id !== userId) {
    return { success: false, message: 'Not a participant in this match' }
  }

  // Check if match is in accepted or scheduled state (first to start)
  if (match.status === 'accepted' || match.status === 'scheduled') {
    await db
      .update(matches)
      .set({
        status: 'in_progress',
        startedAt: new Date(),
        recordingBy: userId,
        recordingStartedAt: new Date(),
      })
      .where(eq(matches.id, matchId))

    return { success: true, message: 'Match started. You are recording.' }
  }

  // Match already in progress - check if someone else is recording
  if (match.status === 'in_progress') {
    if (match.recordingBy && match.recordingBy !== userId) {
      return {
        success: false,
        message: 'Other player is already recording this match',
      }
    }

    // User is already the recorder or no one is recording (shouldn't happen)
    if (match.recordingBy === userId) {
      return { success: true, message: 'You are already recording this match' }
    }

    // No one is recording (edge case) - take over
    await db
      .update(matches)
      .set({
        recordingBy: userId,
        recordingStartedAt: new Date(),
      })
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

  if (!match) {
    return { success: false, message: 'Match not found' }
  }

  if (match.player1Id !== userId && match.player2Id !== userId) {
    return { success: false, message: 'Not a participant in this match' }
  }

  if (match.status !== 'in_progress') {
    return { success: false, message: 'Match is not in progress' }
  }

  if (match.recordingBy !== userId) {
    return { success: false, message: 'You are not the one recording' }
  }

  // Video already uploaded - can't cancel
  if (match.videoUrl) {
    return { success: false, message: 'Video already uploaded, cannot cancel' }
  }

  // Release the recording lock, revert to accepted state
  await db
    .update(matches)
    .set({
      status: 'accepted',
      recordingBy: null,
      recordingStartedAt: null,
      startedAt: null,
    })
    .where(eq(matches.id, matchId))

  return { success: true, message: 'Recording cancelled. Other player can now record.' }
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
 * Save AI analysis results
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

/**
 * Submit agreement or dispute
 */
export async function submitAgreement(
  db: Database,
  matchId: string,
  userId: string,
  agree: boolean
): Promise<{
  success: boolean
  bothAgreed: boolean
  message: string
  newlyUnlockedItems?: UnlockedItem[]
}> {
  const [match] = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1)

  if (!match) {
    return { success: false, bothAgreed: false, message: 'Match not found' }
  }

  const isPlayer1 = match.player1Id === userId
  const isPlayer2 = match.player2Id === userId

  if (!isPlayer1 && !isPlayer2) {
    return { success: false, bothAgreed: false, message: 'Not a participant' }
  }

  if (match.status !== 'completed') {
    return { success: false, bothAgreed: false, message: 'Match not ready for agreement' }
  }

  // Handle dispute
  if (!agree) {
    await db.update(matches).set({ status: 'disputed' }).where(eq(matches.id, matchId))
    return { success: true, bothAgreed: false, message: 'Match disputed' }
  }

  // Update agreement
  if (isPlayer1) {
    await db.update(matches).set({ player1Agreed: true }).where(eq(matches.id, matchId))
  } else {
    await db.update(matches).set({ player2Agreed: true }).where(eq(matches.id, matchId))
  }

  // Check if both agreed
  const otherAgreed = isPlayer1 ? match.player2Agreed : match.player1Agreed
  if (otherAgreed) {
    await updateMatchStats(db, match)

    // Check for newly unlocked items for both players
    const [player1Unlocks, player2Unlocks] = await Promise.all([
      checkAndUnlockEligibleItems(db, match.player1Id, match.sportId),
      checkAndUnlockEligibleItems(db, match.player2Id, match.sportId),
    ])

    // Get unlocks for current user
    const userUnlocks = userId === match.player1Id ? player1Unlocks : player2Unlocks
    const newlyUnlockedItems = userUnlocks.newlyUnlocked.map((item) => ({
      id: item.id,
      name: item.name,
      itemType: item.itemType,
    }))

    if (newlyUnlockedItems.length > 0) {
      logger.info(
        { userId, count: newlyUnlockedItems.length },
        'Items unlocked after match agreement'
      )
    }

    // Notify both players that match is complete
    const isWinner = match.winnerId === userId
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

/**
 * Cancel a challenge (only the challenger/player1 can cancel)
 */
export async function cancelChallenge(
  db: Database,
  matchId: string,
  userId: string
): Promise<MatchResult> {
  const [match] = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1)

  if (!match) {
    return { success: false, message: 'Match not found' }
  }

  if (match.player1Id !== userId) {
    return { success: false, message: 'Only the challenger can cancel' }
  }

  if (match.status !== 'pending') {
    return { success: false, message: 'Can only cancel pending challenges' }
  }

  await db.update(matches).set({ status: 'cancelled' }).where(eq(matches.id, matchId))

  // Notify the opponent
  const challengerInfo = await getPlayerInfo(db, userId)
  notifyChallengeCancelled(match.player2Id, {
    matchId,
    challengerName: challengerInfo.name || 'Opponent',
  })

  return { success: true, message: 'Challenge cancelled' }
}

/**
 * Check if user can challenge opponent
 */
export async function canChallenge(
  db: Database,
  challengerId: string,
  opponentId: string
): Promise<{ canChallenge: boolean; error?: string }> {
  // Check for existing pending/active match
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

  // Auto-expire pending matches older than 30 minutes
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
