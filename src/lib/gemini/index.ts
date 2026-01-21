/**
 * Gemini AI Module
 * Centralized exports for all Gemini-related functionality
 */

// Client
export { geminiClient, imageClient, isGeminiConfigured, getGeminiClient } from './client'

// Types
export type { AvatarPromptInput, AgeGroup, MatchAnalysisResult, MatchRewards } from './types'

// Prompts
export {
  buildAvatarPrompt,
  buildDefaultAvatarPrompt,
  calculateAgeGroup,
  DEFAULT_AVATARS,
  MATCH_ANALYSIS_PROMPT,
} from './prompts'

// Avatar generation
export {
  generateAvatarImage,
  generateDefaultAvatar,
  analyzePhotoForAvatar,
  editAvatarImage,
} from './avatar'
export type { AvatarEditInput } from './avatar'

// Video analysis
export { analyzeMatchVideo, calculateRewards } from './video-analysis'
