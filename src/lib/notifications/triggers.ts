/**
 * Notification triggers for match/challenge events
 * Called from match operations to push real-time updates to players
 */

import { notifyUser } from './emitter'

export function notifyChallengeReceived(
  opponentId: string,
  data: { matchId: string; challengerName: string; venueName: string }
): void {
  notifyUser(opponentId, {
    type: 'challenge-received',
    data,
    timestamp: new Date().toISOString(),
  })
}

export function notifyChallengeAccepted(
  challengerId: string,
  data: { matchId: string; opponentName: string }
): void {
  notifyUser(challengerId, {
    type: 'challenge-accepted',
    data,
    timestamp: new Date().toISOString(),
  })
}

export function notifyChallengeDeclined(
  challengerId: string,
  data: { matchId: string; opponentName: string }
): void {
  notifyUser(challengerId, {
    type: 'challenge-declined',
    data,
    timestamp: new Date().toISOString(),
  })
}

export function notifyChallengeCancelled(
  opponentId: string,
  data: { matchId: string; challengerName: string }
): void {
  notifyUser(opponentId, {
    type: 'challenge-cancelled',
    data,
    timestamp: new Date().toISOString(),
  })
}

export function notifyScoreSubmitted(
  opponentId: string,
  data: { matchId: string; player1Score: number; player2Score: number }
): void {
  notifyUser(opponentId, {
    type: 'score-submitted',
    data,
    timestamp: new Date().toISOString(),
  })
}

export function notifyMatchCompleted(
  userId: string,
  data: { matchId: string; winnerId: string | null; xpEarned: number }
): void {
  notifyUser(userId, {
    type: 'match-completed',
    data,
    timestamp: new Date().toISOString(),
  })
}
