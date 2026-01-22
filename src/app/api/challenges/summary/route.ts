import { NextResponse } from 'next/server'
import { eq, and, count, sql } from 'drizzle-orm'
import { getDb } from '@/db'
import { challenges, challengeAttempts, matches } from '@/db/schema'
import { getSession } from '@/lib/auth'
import { logger } from '@/lib/utils/logger'

interface ChallengeSummary {
  total: number
  completed: number
}

interface ChallengesSummaryResponse {
  oneVsOne: {
    matchesPlayed: number
  }
  freeThrow: ChallengeSummary
  threePointShot: ChallengeSummary
  aroundTheWorld: ChallengeSummary
  sponsoredChallenge: {
    name: string
    sponsor: string
    total: number
    completed: number
    available: number
  } | null
}

/**
 * GET /api/challenges/summary
 * Returns user's challenge progress summary for the dashboard
 */
export async function GET(): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = getDb()
    const userId = session.user.id

    // Get 1v1 matches count
    const matchesResult = await db
      .select({ count: count() })
      .from(matches)
      .where(
        and(
          sql`(${matches.player1Id} = ${userId} OR ${matches.player2Id} = ${userId})`,
          eq(matches.status, 'completed')
        )
      )
    const matchesPlayed = matchesResult[0]?.count ?? 0

    // Get all challenges grouped by type
    const allChallenges = await db
      .select({
        id: challenges.id,
        challengeType: challenges.challengeType,
      })
      .from(challenges)
      .where(eq(challenges.isActive, true))

    // Get user's completed challenges (distinct challenge IDs)
    const completedChallenges = await db
      .select({
        challengeId: challengeAttempts.challengeId,
      })
      .from(challengeAttempts)
      .where(eq(challengeAttempts.userId, userId))

    const completedIds = new Set(completedChallenges.map((c) => c.challengeId))

    // Count by challenge type
    const countByType = (type: string): ChallengeSummary => {
      const ofType = allChallenges.filter((c) => c.challengeType === type)
      const completed = ofType.filter((c) => completedIds.has(c.id)).length
      return {
        total: ofType.length,
        completed,
      }
    }

    const response: ChallengesSummaryResponse = {
      oneVsOne: {
        matchesPlayed,
      },
      freeThrow: countByType('free_throw'),
      threePointShot: countByType('three_point'),
      aroundTheWorld: countByType('around_the_world'),
      // Placeholder for sponsored challenges - can be expanded later
      sponsoredChallenge: null,
    }

    return NextResponse.json(response)
  } catch (error) {
    logger.error({ error }, 'Failed to get challenges summary')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
