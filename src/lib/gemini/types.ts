/**
 * Gemini API Response Types
 */

// Avatar types
export interface AvatarPromptInput {
  gender: string
  skinTone: string
  hairStyle: string
  hairColor: string
  sport?: string
  ageGroup?: string
  jerseyNumber?: number
  referencePhoto?: string // Base64 encoded photo for resemblance
}

export type AgeGroup = 'under-18' | '18-30' | '31+'

// Video analysis types
export interface MatchAnalysisResult {
  player1Score: number
  player2Score: number
  player1ShotsMade: number
  player1ShotsAttempted: number
  player2ShotsMade: number
  player2ShotsAttempted: number
  durationSeconds: number
  confidence: number
}

export interface MatchRewards {
  winnerXp: number
  winnerRp: number
  loserXp: number
}
