import { describe, it, expect } from 'vitest'
import {
  getFilteredMatches,
  getMatchAction,
  getUserScore,
  getOpponentScore,
  isWinner,
  getStatusBadgeProps,
  type Match,
} from '@/lib/utils/matches-helpers'

// Helper to create a mock match
function createMockMatch(overrides: Partial<Match> = {}): Match {
  return {
    id: 'match-1',
    status: 'pending',
    venueName: 'Test Venue',
    isChallenger: true,
    opponent: {
      id: 'opponent-1',
      name: 'Test Opponent',
      avatar: { imageUrl: null },
    },
    player1Score: null,
    player2Score: null,
    winnerId: null,
    createdAt: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('getFilteredMatches', () => {
  const allMatches: Match[] = [
    createMockMatch({ id: '1', status: 'pending' }),
    createMockMatch({ id: '2', status: 'accepted' }),
    createMockMatch({ id: '3', status: 'in_progress' }),
    createMockMatch({ id: '4', status: 'uploading' }),
    createMockMatch({ id: '5', status: 'analyzing' }),
    createMockMatch({ id: '6', status: 'completed' }),
    createMockMatch({ id: '7', status: 'disputed' }),
    createMockMatch({ id: '8', status: 'cancelled' }),
    createMockMatch({ id: '9', status: 'declined' }),
  ]

  it('returns all matches when filter is "all"', () => {
    const result = getFilteredMatches(allMatches, 'all')
    expect(result).toHaveLength(9)
  })

  it('returns only active matches when filter is "active"', () => {
    const result = getFilteredMatches(allMatches, 'active')
    expect(result).toHaveLength(5)
    expect(result.map((m) => m.id)).toEqual(['1', '2', '3', '4', '5'])
  })

  it('returns only completed matches when filter is "completed"', () => {
    const result = getFilteredMatches(allMatches, 'completed')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('6')
  })

  it('returns only disputed matches when filter is "disputed"', () => {
    const result = getFilteredMatches(allMatches, 'disputed')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('7')
  })

  it('returns empty array when no matches exist for filter', () => {
    const matches = [createMockMatch({ status: 'pending' })]
    const result = getFilteredMatches(matches, 'disputed')
    expect(result).toHaveLength(0)
  })
})

describe('getMatchAction', () => {
  it('returns "View" for pending match when user is challenger', () => {
    const match = createMockMatch({ status: 'pending', isChallenger: true })
    expect(getMatchAction(match)).toBe('View')
  })

  it('returns "Respond" for pending match when user is not challenger', () => {
    const match = createMockMatch({ status: 'pending', isChallenger: false })
    expect(getMatchAction(match)).toBe('Respond')
  })

  it('returns "Start Match" for accepted match', () => {
    const match = createMockMatch({ status: 'accepted' })
    expect(getMatchAction(match)).toBe('Start Match')
  })

  it('returns "Continue" for in_progress match', () => {
    const match = createMockMatch({ status: 'in_progress' })
    expect(getMatchAction(match)).toBe('Continue')
  })

  it('returns "View Progress" for uploading match', () => {
    const match = createMockMatch({ status: 'uploading' })
    expect(getMatchAction(match)).toBe('View Progress')
  })

  it('returns "View Progress" for analyzing match', () => {
    const match = createMockMatch({ status: 'analyzing' })
    expect(getMatchAction(match)).toBe('View Progress')
  })

  it('returns "View Results" for completed match', () => {
    const match = createMockMatch({ status: 'completed' })
    expect(getMatchAction(match)).toBe('View Results')
  })

  it('returns "View Results" for disputed match', () => {
    const match = createMockMatch({ status: 'disputed' })
    expect(getMatchAction(match)).toBe('View Results')
  })

  it('returns "View" for cancelled match', () => {
    const match = createMockMatch({ status: 'cancelled' })
    expect(getMatchAction(match)).toBe('View')
  })
})

describe('getUserScore', () => {
  it('returns player1Score when user is challenger', () => {
    const match = createMockMatch({
      isChallenger: true,
      player1Score: 21,
      player2Score: 15,
    })
    expect(getUserScore(match)).toBe(21)
  })

  it('returns player2Score when user is not challenger', () => {
    const match = createMockMatch({
      isChallenger: false,
      player1Score: 21,
      player2Score: 15,
    })
    expect(getUserScore(match)).toBe(15)
  })

  it('returns null when player1Score is null', () => {
    const match = createMockMatch({
      player1Score: null,
      player2Score: 15,
    })
    expect(getUserScore(match)).toBeNull()
  })

  it('returns null when player2Score is null', () => {
    const match = createMockMatch({
      player1Score: 21,
      player2Score: null,
    })
    expect(getUserScore(match)).toBeNull()
  })
})

describe('getOpponentScore', () => {
  it('returns player2Score when user is challenger', () => {
    const match = createMockMatch({
      isChallenger: true,
      player1Score: 21,
      player2Score: 15,
    })
    expect(getOpponentScore(match)).toBe(15)
  })

  it('returns player1Score when user is not challenger', () => {
    const match = createMockMatch({
      isChallenger: false,
      player1Score: 21,
      player2Score: 15,
    })
    expect(getOpponentScore(match)).toBe(21)
  })

  it('returns null when scores are not set', () => {
    const match = createMockMatch({
      player1Score: null,
      player2Score: null,
    })
    expect(getOpponentScore(match)).toBeNull()
  })
})

describe('isWinner', () => {
  it('returns true when user won', () => {
    const match = createMockMatch({
      isChallenger: true,
      player1Score: 21,
      player2Score: 15,
      winnerId: 'user-1',
    })
    expect(isWinner(match)).toBe(true)
  })

  it('returns false when user lost', () => {
    const match = createMockMatch({
      isChallenger: true,
      player1Score: 15,
      player2Score: 21,
      winnerId: 'opponent-1',
    })
    expect(isWinner(match)).toBe(false)
  })

  it('returns null when winnerId is null', () => {
    const match = createMockMatch({
      player1Score: 21,
      player2Score: 15,
      winnerId: null,
    })
    expect(isWinner(match)).toBeNull()
  })

  it('returns null when scores are not set', () => {
    const match = createMockMatch({
      winnerId: 'user-1',
      player1Score: null,
      player2Score: null,
    })
    expect(isWinner(match)).toBeNull()
  })
})

describe('getStatusBadgeProps', () => {
  it('returns correct props for pending status', () => {
    const props = getStatusBadgeProps('pending')
    expect(props.text).toBe('Waiting')
    expect(props.bgColor).toBe('bg-yellow-100')
    expect(props.textColor).toBe('text-yellow-700')
  })

  it('returns correct props for accepted status', () => {
    const props = getStatusBadgeProps('accepted')
    expect(props.text).toBe('Ready')
    expect(props.bgColor).toBe('bg-blue-100')
  })

  it('returns correct props for in_progress status', () => {
    const props = getStatusBadgeProps('in_progress')
    expect(props.text).toBe('In Progress')
    expect(props.bgColor).toBe('bg-orange-100')
  })

  it('returns correct props for uploading status', () => {
    const props = getStatusBadgeProps('uploading')
    expect(props.text).toBe('Analyzing')
    expect(props.bgColor).toBe('bg-purple-100')
  })

  it('returns correct props for analyzing status', () => {
    const props = getStatusBadgeProps('analyzing')
    expect(props.text).toBe('Analyzing')
    expect(props.bgColor).toBe('bg-purple-100')
  })

  it('returns correct props for completed status', () => {
    const props = getStatusBadgeProps('completed')
    expect(props.text).toBe('Completed')
    expect(props.bgColor).toBe('bg-green-100')
  })

  it('returns correct props for disputed status', () => {
    const props = getStatusBadgeProps('disputed')
    expect(props.text).toBe('Disputed')
    expect(props.bgColor).toBe('bg-red-100')
  })

  it('returns correct props for cancelled status', () => {
    const props = getStatusBadgeProps('cancelled')
    expect(props.text).toBe('Cancelled')
    expect(props.bgColor).toBe('bg-gray-100')
  })

  it('returns correct props for declined status', () => {
    const props = getStatusBadgeProps('declined')
    expect(props.text).toBe('Declined')
    expect(props.bgColor).toBe('bg-gray-100')
  })
})
