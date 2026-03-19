/**
 * Matches Library — barrel re-export
 */

// Types
export type { MatchPlayer, MatchDetail, UnlockedItem, MatchResult } from './types'
export { MATCH_REWARDS } from './types'

// Queries
export { getMatchById, canChallenge } from './queries'

// Mutations
export {
  createMatch,
  markPlayerReady,
  submitMatchScore,
  agreeToMatchResult,
  disputeMatchResult,
  updateMatchStatus,
  saveMatchVideo,
  saveMatchResults,
} from './mutations'

// Challenge operations
export {
  respondToChallenge,
  startMatch,
  cancelRecording,
  cancelChallenge,
  submitAgreement,
} from './challenge'
