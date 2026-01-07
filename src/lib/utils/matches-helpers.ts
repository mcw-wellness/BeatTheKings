/**
 * Helper functions for the Matches Page
 * These are extracted to enable unit testing
 */

export type MatchStatus =
  | 'pending'
  | 'accepted'
  | 'in_progress'
  | 'uploading'
  | 'analyzing'
  | 'completed'
  | 'disputed'
  | 'cancelled'
  | 'declined'

export type FilterType = 'all' | 'active' | 'completed' | 'disputed'

export interface Match {
  id: string
  status: MatchStatus
  venueName: string
  isChallenger: boolean
  opponent: {
    id: string
    name: string | null
    avatar: { imageUrl: string | null }
  }
  player1Score: number | null
  player2Score: number | null
  winnerId: string | null
  createdAt: string
}

/**
 * Filter matches based on the selected filter type
 */
export function getFilteredMatches(matches: Match[], filter: FilterType): Match[] {
  switch (filter) {
    case 'active':
      return matches.filter((m) =>
        ['pending', 'accepted', 'in_progress', 'uploading', 'analyzing'].includes(m.status)
      )
    case 'completed':
      return matches.filter((m) => m.status === 'completed')
    case 'disputed':
      return matches.filter((m) => m.status === 'disputed')
    default:
      return matches
  }
}

/**
 * Get the action button text for a match
 */
export function getMatchAction(match: Match): string {
  switch (match.status) {
    case 'pending':
      return match.isChallenger ? 'View' : 'Respond'
    case 'accepted':
      return 'Start Match'
    case 'in_progress':
      return 'Continue'
    case 'uploading':
    case 'analyzing':
      return 'View Progress'
    case 'completed':
    case 'disputed':
      return 'View Results'
    default:
      return 'View'
  }
}

/**
 * Get the user's score from a match
 */
export function getUserScore(match: Match): number | null {
  if (match.player1Score === null || match.player2Score === null) return null
  return match.isChallenger ? match.player1Score : match.player2Score
}

/**
 * Get the opponent's score from a match
 */
export function getOpponentScore(match: Match): number | null {
  if (match.player1Score === null || match.player2Score === null) return null
  return match.isChallenger ? match.player2Score : match.player1Score
}

/**
 * Determine if the current user won the match
 * Returns null if match is not completed or scores are not set
 */
export function isWinner(match: Match): boolean | null {
  if (!match.winnerId) return null
  const myScore = getUserScore(match)
  const oppScore = getOpponentScore(match)
  if (myScore === null || oppScore === null) return null
  return myScore > oppScore
}

/**
 * Get status badge properties for a match
 */
export function getStatusBadgeProps(status: MatchStatus): {
  text: string
  bgColor: string
  textColor: string
} {
  switch (status) {
    case 'pending':
      return { text: 'Waiting', bgColor: 'bg-yellow-100', textColor: 'text-yellow-700' }
    case 'accepted':
      return { text: 'Ready', bgColor: 'bg-blue-100', textColor: 'text-blue-700' }
    case 'in_progress':
      return { text: 'In Progress', bgColor: 'bg-orange-100', textColor: 'text-orange-700' }
    case 'uploading':
    case 'analyzing':
      return { text: 'Analyzing', bgColor: 'bg-purple-100', textColor: 'text-purple-700' }
    case 'completed':
      return { text: 'Completed', bgColor: 'bg-green-100', textColor: 'text-green-700' }
    case 'disputed':
      return { text: 'Disputed', bgColor: 'bg-red-100', textColor: 'text-red-700' }
    case 'cancelled':
      return { text: 'Cancelled', bgColor: 'bg-gray-100', textColor: 'text-gray-500' }
    case 'declined':
      return { text: 'Declined', bgColor: 'bg-gray-100', textColor: 'text-gray-500' }
    default:
      return { text: status, bgColor: 'bg-gray-100', textColor: 'text-gray-500' }
  }
}
