import { eq, and, desc, sql } from 'drizzle-orm'
import type { Database } from '@/db'
import { challenges, challengeAttempts, venues } from '@/db/schema'
import type {
  ByTypeResponse,
  AttemptHistoryItem,
  ChallengeWithAttempts,
  AttemptData,
  ChallengeListItem,
  UserAttemptRecord,
} from './types'

export type { BestScore, AttemptHistoryItem, ChallengeWithAttempts, ByTypeResponse } from './types'

const TYPE_DISPLAY_NAMES: Record<string, string> = {
  free_throw: 'Free Throw',
  three_point: '3-Point Shot',
  around_the_world: 'Around the World',
}

export const VALID_CHALLENGE_TYPES = ['free_throw', 'three_point', 'around_the_world']

/**
 * Gets challenges of a specific type with user's attempt history
 */
export async function getChallengesByType(
  db: Database,
  type: string,
  userId: string
): Promise<ByTypeResponse> {
  const challengeList = await fetchChallengeList(db, type)
  const challengeIds = challengeList.map((c) => c.id)
  const userAttempts = await fetchUserAttempts(db, userId, challengeIds)
  const attemptsByChallenge = processAttempts(userAttempts)
  const challengesWithAttempts = buildResponse(challengeList, attemptsByChallenge)
  const completed = challengesWithAttempts.filter((c) => c.attempts > 0).length

  return {
    challengeType: type,
    displayName: TYPE_DISPLAY_NAMES[type] ?? type,
    total: challengeList.length,
    completed,
    challenges: challengesWithAttempts,
  }
}

async function fetchChallengeList(db: Database, type: string): Promise<ChallengeListItem[]> {
  return db
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
}

async function fetchUserAttempts(
  db: Database,
  userId: string,
  challengeIds: string[]
): Promise<UserAttemptRecord[]> {
  if (challengeIds.length === 0) return []

  return db
    .select({
      id: challengeAttempts.id,
      challengeId: challengeAttempts.challengeId,
      scoreValue: challengeAttempts.scoreValue,
      maxValue: challengeAttempts.maxValue,
      completedAt: challengeAttempts.completedAt,
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

function processAttempts(userAttempts: UserAttemptRecord[]): Map<string, AttemptData> {
  const attemptsByChallenge = new Map<string, AttemptData>()

  for (const attempt of userAttempts) {
    const accuracy = attempt.maxValue > 0 ? attempt.scoreValue / attempt.maxValue : 0
    const accuracyPercent = Math.round(accuracy * 100)
    const existing = attemptsByChallenge.get(attempt.challengeId)

    if (!existing) {
      attemptsByChallenge.set(attempt.challengeId, createNewAttemptData(attempt, accuracyPercent))
    } else {
      updateExistingAttemptData(existing, attempt, accuracyPercent)
    }
  }

  return attemptsByChallenge
}

function createNewAttemptData(attempt: UserAttemptRecord, accuracyPercent: number): AttemptData {
  return {
    count: 1,
    bestScore: {
      scoreValue: attempt.scoreValue,
      maxValue: attempt.maxValue,
      accuracy: accuracyPercent,
    },
    bestAttemptId: attempt.id,
    history: [
      {
        id: attempt.id,
        scoreValue: attempt.scoreValue,
        maxValue: attempt.maxValue,
        accuracy: accuracyPercent,
        completedAt: attempt.completedAt,
      },
    ],
  }
}

function updateExistingAttemptData(
  existing: AttemptData,
  attempt: UserAttemptRecord,
  accuracyPercent: number
): void {
  existing.count++
  existing.history.push({
    id: attempt.id,
    scoreValue: attempt.scoreValue,
    maxValue: attempt.maxValue,
    accuracy: accuracyPercent,
    completedAt: attempt.completedAt,
  })

  if (existing.bestScore && accuracyPercent > existing.bestScore.accuracy) {
    existing.bestScore = {
      scoreValue: attempt.scoreValue,
      maxValue: attempt.maxValue,
      accuracy: accuracyPercent,
    }
    existing.bestAttemptId = attempt.id
  }
}

function buildResponse(
  challengeList: ChallengeListItem[],
  attemptsByChallenge: Map<string, AttemptData>
): ChallengeWithAttempts[] {
  return challengeList.map((challenge) => {
    const attemptData = attemptsByChallenge.get(challenge.id)
    const attemptHistory = buildAttemptHistory(attemptData)

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
      attemptHistory,
    }
  })
}

function buildAttemptHistory(attemptData: AttemptData | undefined): AttemptHistoryItem[] {
  if (!attemptData) return []

  return attemptData.history.map((h) => ({
    id: h.id,
    scoreValue: h.scoreValue,
    maxValue: h.maxValue,
    accuracy: h.accuracy,
    isBest: h.id === attemptData.bestAttemptId,
    completedAt: h.completedAt.toISOString(),
  }))
}
