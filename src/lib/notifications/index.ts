export { addConnection, removeConnection, notifyUser, getConnectionCount } from './emitter'
export type { NotificationEvent } from './emitter'
export {
  notifyChallengeReceived,
  notifyChallengeAccepted,
  notifyChallengeDeclined,
  notifyChallengeCancelled,
  notifyScoreSubmitted,
  notifyMatchCompleted,
} from './triggers'
