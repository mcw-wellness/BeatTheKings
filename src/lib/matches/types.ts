/**
 * Match types and constants
 */

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
  disputeComment?: string | null
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

export const MATCH_REWARDS = {
  winnerXp: 100,
  winnerRp: 20,
  loserXp: 25,
}
