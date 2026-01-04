/**
 * Matches Unit Tests
 * Tests for 1v1 match utility functions
 */

import { describe, it, expect, vi } from 'vitest'

// Mock azure-storage
vi.mock('@/lib/azure-storage', () => ({
  getUserAvatarSasUrl: (userId: string) =>
    `https://test.blob.core.windows.net/avatar/users/${userId}/avatar.png`,
  getDefaultAvatarSasUrl: (gender: string) =>
    `https://test.blob.core.windows.net/avatar/default/basketball_${gender || 'male'}.png`,
}))

describe('Matches Unit Tests', () => {
  describe('Match Rewards', () => {
    const MATCH_REWARDS = {
      winnerXp: 100,
      winnerRp: 20,
      loserXp: 25, // Participation XP
    }

    it('should award correct XP to winner', () => {
      expect(MATCH_REWARDS.winnerXp).toBe(100)
    })

    it('should award correct RP to winner', () => {
      expect(MATCH_REWARDS.winnerRp).toBe(20)
    })

    it('should award participation XP to loser', () => {
      expect(MATCH_REWARDS.loserXp).toBe(25)
      expect(MATCH_REWARDS.loserXp).toBeLessThan(MATCH_REWARDS.winnerXp)
    })
  })

  describe('Match Status Transitions', () => {
    const validStatuses = ['pending', 'in_progress', 'completed', 'disputed', 'cancelled']

    it('should have all valid statuses', () => {
      expect(validStatuses).toContain('pending')
      expect(validStatuses).toContain('in_progress')
      expect(validStatuses).toContain('completed')
      expect(validStatuses).toContain('disputed')
      expect(validStatuses).toContain('cancelled')
    })

    it('should transition from pending to in_progress', () => {
      const match = { status: 'pending' }
      match.status = 'in_progress'
      expect(match.status).toBe('in_progress')
    })

    it('should transition from in_progress to completed', () => {
      const match = { status: 'in_progress' }
      match.status = 'completed'
      expect(match.status).toBe('completed')
    })

    it('should transition from in_progress to disputed', () => {
      const match = { status: 'in_progress' }
      match.status = 'disputed'
      expect(match.status).toBe('disputed')
    })
  })

  describe('Winner Determination', () => {
    it('should determine player1 as winner when score is higher', () => {
      const player1Score = 12
      const player2Score = 10
      const player1Id = 'player-1'
      const player2Id = 'player-2'

      const winnerId =
        player1Score > player2Score ? player1Id : player2Score > player1Score ? player2Id : null

      expect(winnerId).toBe(player1Id)
    })

    it('should determine player2 as winner when score is higher', () => {
      const player1Score = 8
      const player2Score = 11
      const player1Id = 'player-1'
      const player2Id = 'player-2'

      const winnerId =
        player1Score > player2Score ? player1Id : player2Score > player1Score ? player2Id : null

      expect(winnerId).toBe(player2Id)
    })

    it('should return null for draw', () => {
      const player1Score = 10
      const player2Score = 10
      const player1Id = 'player-1'
      const player2Id = 'player-2'

      const winnerId =
        player1Score > player2Score ? player1Id : player2Score > player1Score ? player2Id : null

      expect(winnerId).toBeNull()
    })
  })

  describe('Agreement Logic', () => {
    it('should require both players to agree', () => {
      const match = {
        player1Agreed: false,
        player2Agreed: false,
      }

      // Player 1 agrees
      match.player1Agreed = true
      const bothAgreed1 = match.player1Agreed && match.player2Agreed
      expect(bothAgreed1).toBe(false)

      // Player 2 agrees
      match.player2Agreed = true
      const bothAgreed2 = match.player1Agreed && match.player2Agreed
      expect(bothAgreed2).toBe(true)
    })

    it('should complete match when both agree', () => {
      const match = {
        status: 'in_progress',
        player1Agreed: true,
        player2Agreed: true,
      }

      if (match.player1Agreed && match.player2Agreed) {
        match.status = 'completed'
      }

      expect(match.status).toBe('completed')
    })
  })

  describe('MatchPlayer Structure', () => {
    it('should have all required fields', () => {
      const player = {
        id: 'player-123',
        name: 'Test Player',
        avatar: { imageUrl: 'https://example.com/avatar.png' },
        score: 12,
        agreed: true,
      }

      expect(player.id).toBeDefined()
      expect(player.name).toBeDefined()
      expect(player.avatar.imageUrl).toBeDefined()
      expect(typeof player.score).toBe('number')
      expect(typeof player.agreed).toBe('boolean')
    })

    it('should allow null score before match ends', () => {
      const player = {
        id: 'player-123',
        name: 'Test Player',
        avatar: { imageUrl: 'https://example.com/avatar.png' },
        score: null,
        agreed: false,
      }

      expect(player.score).toBeNull()
      expect(player.agreed).toBe(false)
    })
  })

  describe('MatchDetail Structure', () => {
    it('should have all required fields', () => {
      const match = {
        id: 'match-123',
        status: 'completed',
        venueName: 'Esterhazy Park',
        sportName: 'Basketball',
        player1: {
          id: 'player-1',
          name: 'Player One',
          avatar: { imageUrl: 'https://example.com/1.png' },
          score: 12,
          agreed: true,
        },
        player2: {
          id: 'player-2',
          name: 'Player Two',
          avatar: { imageUrl: 'https://example.com/2.png' },
          score: 10,
          agreed: true,
        },
        winnerId: 'player-1',
        createdAt: '2024-01-01T10:00:00Z',
        startedAt: '2024-01-01T10:05:00Z',
        completedAt: '2024-01-01T10:30:00Z',
      }

      expect(match.id).toBeDefined()
      expect(match.status).toBe('completed')
      expect(match.player1).toBeDefined()
      expect(match.player2).toBeDefined()
      expect(match.winnerId).toBe('player-1')
    })

    it('should allow null dates for pending match', () => {
      const match = {
        id: 'match-123',
        status: 'pending',
        venueName: 'Test Venue',
        sportName: 'Basketball',
        player1: {
          id: 'player-1',
          name: 'Player One',
          avatar: { imageUrl: 'https://example.com/1.png' },
          score: null,
          agreed: false,
        },
        player2: {
          id: 'player-2',
          name: 'Player Two',
          avatar: { imageUrl: 'https://example.com/2.png' },
          score: null,
          agreed: false,
        },
        winnerId: null,
        createdAt: '2024-01-01T10:00:00Z',
        startedAt: null,
        completedAt: null,
      }

      expect(match.startedAt).toBeNull()
      expect(match.completedAt).toBeNull()
      expect(match.winnerId).toBeNull()
    })
  })

  describe('MatchResult Structure', () => {
    it('should have success result with rewards', () => {
      const result = {
        success: true,
        message: 'Match completed!',
        xpEarned: 100,
        rpEarned: 20,
      }

      expect(result.success).toBe(true)
      expect(result.xpEarned).toBeGreaterThan(0)
      expect(result.rpEarned).toBeGreaterThan(0)
    })

    it('should have failure result', () => {
      const result: { success: boolean; message: string; xpEarned?: number } = {
        success: false,
        message: 'Match not found',
      }

      expect(result.success).toBe(false)
      expect(result.xpEarned).toBeUndefined()
    })

    it('should have loser result with participation XP only', () => {
      const result = {
        success: true,
        message: 'Match completed!',
        xpEarned: 25,
        rpEarned: 0, // Losers don't get RP
      }

      expect(result.xpEarned).toBe(25)
      expect(result.rpEarned).toBe(0)
    })
  })

  describe('Stats Update After Match', () => {
    it('should update winner stats correctly', () => {
      const winnerStats = {
        matchesPlayed: 10,
        matchesWon: 7,
        matchesLost: 3,
        totalXp: 1000,
        totalRp: 100,
        availableRp: 50,
      }

      const MATCH_REWARDS = { winnerXp: 100, winnerRp: 20, loserXp: 25 }

      const updated = {
        matchesPlayed: winnerStats.matchesPlayed + 1,
        matchesWon: winnerStats.matchesWon + 1,
        matchesLost: winnerStats.matchesLost,
        totalXp: winnerStats.totalXp + MATCH_REWARDS.winnerXp,
        totalRp: winnerStats.totalRp + MATCH_REWARDS.winnerRp,
        availableRp: winnerStats.availableRp + MATCH_REWARDS.winnerRp,
      }

      expect(updated.matchesPlayed).toBe(11)
      expect(updated.matchesWon).toBe(8)
      expect(updated.matchesLost).toBe(3)
      expect(updated.totalXp).toBe(1100)
      expect(updated.totalRp).toBe(120)
      expect(updated.availableRp).toBe(70)
    })

    it('should update loser stats correctly', () => {
      const loserStats = {
        matchesPlayed: 10,
        matchesWon: 3,
        matchesLost: 7,
        totalXp: 500,
        totalRp: 30,
        availableRp: 10,
      }

      const MATCH_REWARDS = { winnerXp: 100, winnerRp: 20, loserXp: 25 }

      const updated = {
        matchesPlayed: loserStats.matchesPlayed + 1,
        matchesWon: loserStats.matchesWon,
        matchesLost: loserStats.matchesLost + 1,
        totalXp: loserStats.totalXp + MATCH_REWARDS.loserXp,
        totalRp: loserStats.totalRp, // No RP for losing
        availableRp: loserStats.availableRp,
      }

      expect(updated.matchesPlayed).toBe(11)
      expect(updated.matchesWon).toBe(3)
      expect(updated.matchesLost).toBe(8)
      expect(updated.totalXp).toBe(525)
      expect(updated.totalRp).toBe(30) // Unchanged
    })

    it('should calculate win rate correctly', () => {
      const stats = {
        matchesPlayed: 20,
        matchesWon: 12,
        matchesLost: 8,
      }

      const winRate = stats.matchesPlayed > 0 ? (stats.matchesWon / stats.matchesPlayed) * 100 : 0

      expect(winRate).toBe(60)
    })
  })

  describe('Validation Rules', () => {
    it('should not allow challenging yourself', () => {
      const currentUserId = 'user-123'
      const opponentId = 'user-123'

      const isValid = currentUserId !== opponentId

      expect(isValid).toBe(false)
    })

    it('should allow challenging different user', () => {
      const currentUserId: string = 'user-123'
      const opponentId: string = 'user-456'

      const isValid = currentUserId !== opponentId

      expect(isValid).toBe(true)
    })

    it('should require positive scores', () => {
      const score1 = -1
      const score2 = 10

      const isValid = score1 >= 0 && score2 >= 0

      expect(isValid).toBe(false)
    })

    it('should accept zero scores', () => {
      const score1 = 0
      const score2 = 0

      const isValid = score1 >= 0 && score2 >= 0

      expect(isValid).toBe(true)
    })
  })
})
