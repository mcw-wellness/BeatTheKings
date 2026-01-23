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
  jerseyColor?: string // Hex color for jersey
  referencePhoto?: string // Base64 encoded photo for resemblance
  storedPhotoAnalysis?: string // Pre-analyzed photo description for consistency
  jerseyImageUrl?: string // Reference image for jersey design (e.g., /items/jerseys/champion-jersey.png)
  shoesImageUrl?: string // Reference image for shoes design (e.g., /items/shoes/elite-shoes.png)
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
