export interface BestScore {
  scoreValue: number
  maxValue: number
  accuracy: number
}

export interface AttemptHistoryItem {
  id: string
  scoreValue: number
  maxValue: number
  accuracy: number
  isBest: boolean
  completedAt: string
}

export interface ChallengeWithAttempts {
  id: string
  name: string
  description: string
  difficulty: string
  xpReward: number
  venueName: string
  venueId: string
  attempts: number
  bestScore: BestScore | null
  attemptHistory: AttemptHistoryItem[]
}

export interface ByTypeResponse {
  challengeType: string
  displayName: string
  total: number
  completed: number
  challenges: ChallengeWithAttempts[]
}

export interface AttemptData {
  count: number
  bestScore: BestScore | null
  bestAttemptId: string | null
  history: Array<{
    id: string
    scoreValue: number
    maxValue: number
    accuracy: number
    completedAt: Date
  }>
}

export interface ChallengeListItem {
  id: string
  name: string
  description: string | null
  difficulty: string | null
  xpReward: number
  venueId: string
  venueName: string
}

export interface UserAttemptRecord {
  id: string
  challengeId: string
  scoreValue: number
  maxValue: number
  completedAt: Date
}
