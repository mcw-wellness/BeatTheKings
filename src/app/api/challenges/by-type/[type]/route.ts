import { NextRequest, NextResponse } from 'next/server'
import { eq, and, desc, sql } from 'drizzle-orm'
import { getDb } from '@/db'
import { challenges, challengeAttempts, venues } from '@/db/schema'
import { getSession } from '@/lib/auth'
import { logger } from '@/lib/utils/logger'

interface BestScore {
  scoreValue: number
  maxValue: number
  accuracy: number
}

interface ChallengeWithAttempts {
  id: string
  name: string
  description: string
  difficulty: string
  xpReward: number
  venueName: string
  venueId: string
  attempts: number
  bestScore: BestScore | null
}

interface ByTypeResponse {
  challengeType: string
  displayName: string
  total: number
  completed: number
  challenges: ChallengeWithAttempts[]
}

const TYPE_DISPLAY_NAMES: Record<string, string> = {
  free_throw: 'Free Throw',
  three_point: '3-Point Shot',
  around_the_world: 'Around the World',
}

const VALID_TYPES = ['free_throw', 'three_point', 'around_the_world']

/**
 * GET /api/challenges/by-type/[type]
 * Returns challenges of a specific type with user's attempts
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { type } = await params

    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: 'Invalid challenge type' }, { status: 400 })
    }

    const db = getDb()
    const userId = session.user.id

    // Get all active challenges of this type with venue info
    const challengeList = await db
      .select({
        id: challenges.id,
        name: challenges.name,
        description: challenges.description,
        difficulty: challenges.difficulty,
        xpReward: challenges.xpReward,
        venueId: challenges.venueId,
        venueName: venues.name,
      })
      .from(challenges)
      .innerJoin(venues, eq(challenges.venueId, venues.id))
      .where(and(eq(challenges.challengeType, type), eq(challenges.isActive, true)))
      .orderBy(venues.name, challenges.name)

    // Get user's attempts for these challenges
    const challengeIds = challengeList.map((c) => c.id)

    let userAttempts: Array<{
      challengeId: string
      scoreValue: number
      maxValue: number
    }> = []

    if (challengeIds.length > 0) {
      userAttempts = await db
        .select({
          challengeId: challengeAttempts.challengeId,
          scoreValue: challengeAttempts.scoreValue,
          maxValue: challengeAttempts.maxValue,
        })
        .from(challengeAttempts)
        .where(
          and(
            eq(challengeAttempts.userId, userId),
            sql`${challengeAttempts.challengeId} IN (${sql.join(
              challengeIds.map((id) => sql`${id}`),
              sql`, `
            )})`
          )
        )
        .orderBy(desc(challengeAttempts.completedAt))
    }

    // Group attempts by challenge and find best score
    const attemptsByChallenge = new Map<string, { count: number; bestScore: BestScore | null }>()

    for (const attempt of userAttempts) {
      const existing = attemptsByChallenge.get(attempt.challengeId)
      const accuracy = attempt.maxValue > 0 ? attempt.scoreValue / attempt.maxValue : 0

      if (!existing) {
        attemptsByChallenge.set(attempt.challengeId, {
          count: 1,
          bestScore: {
            scoreValue: attempt.scoreValue,
            maxValue: attempt.maxValue,
            accuracy: Math.round(accuracy * 100),
          },
        })
      } else {
        existing.count++
        // Update best score if this one is better
        if (existing.bestScore && accuracy > existing.bestScore.accuracy / 100) {
          existing.bestScore = {
            scoreValue: attempt.scoreValue,
            maxValue: attempt.maxValue,
            accuracy: Math.round(accuracy * 100),
          }
        }
      }
    }

    // Build response
    const challengesWithAttempts: ChallengeWithAttempts[] = challengeList.map((challenge) => {
      const attemptData = attemptsByChallenge.get(challenge.id)
      return {
        id: challenge.id,
        name: challenge.name,
        description: challenge.description ?? '',
        difficulty: challenge.difficulty ?? 'medium',
        xpReward: challenge.xpReward,
        venueName: challenge.venueName,
        venueId: challenge.venueId,
        attempts: attemptData?.count ?? 0,
        bestScore: attemptData?.bestScore ?? null,
      }
    })

    // Count completed (at least one attempt)
    const completed = challengesWithAttempts.filter((c) => c.attempts > 0).length

    const response: ByTypeResponse = {
      challengeType: type,
      displayName: TYPE_DISPLAY_NAMES[type] ?? type,
      total: challengeList.length,
      completed,
      challenges: challengesWithAttempts,
    }

    return NextResponse.json(response)
  } catch (error) {
    logger.error({ error }, 'Failed to get challenges by type')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
