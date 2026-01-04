/**
 * Matches Library
 * Functions for managing 1v1 matches
 */

import { eq, and, or } from 'drizzle-orm'
import { matches, playerStats, users, avatars, venues, sports } from '@/db/schema'
import type { Database } from '@/db'
import { getUserAvatarSasUrl, getDefaultAvatarSasUrl } from '@/lib/azure-storage'

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
  createdAt: string
  startedAt: string | null
  completedAt: string | null
}

export interface MatchResult {
  success: boolean
  message: string
  xpEarned?: number
  rpEarned?: number
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
    })
    .where(eq(matches.id, matchId))

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

    const isWinner = match.winnerId === userId
    return {
      success: true,
      message: 'Match completed!',
      xpEarned: isWinner ? MATCH_REWARDS.winnerXp : MATCH_REWARDS.loserXp,
      rpEarned: isWinner ? MATCH_REWARDS.winnerRp : 0,
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
  userId: string
): Promise<MatchResult> {
  const [match] = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1)

  if (!match) {
    return { success: false, message: 'Match not found' }
  }

  if (userId !== match.player1Id && userId !== match.player2Id) {
    return { success: false, message: 'You are not a participant in this match' }
  }

  await db.update(matches).set({ status: 'disputed' }).where(eq(matches.id, matchId))

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
