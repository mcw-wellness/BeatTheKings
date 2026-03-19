/**
 * Server-side notification emitter
 * Manages SSE connections and broadcasts events to specific users
 */

import { logger } from '@/lib/utils/logger'

// ===========================================
// TYPES
// ===========================================

export interface NotificationEvent {
  type: 'challenge-received' | 'challenge-accepted' | 'challenge-declined' | 'challenge-cancelled'
    | 'match-started' | 'score-submitted' | 'match-completed' | 'match-disputed'
  data: Record<string, unknown>
  timestamp: string
}

interface SSEConnection {
  controller: ReadableStreamDefaultController
  userId: string
  connectedAt: Date
}

// ===========================================
// CONNECTION STORE
// ===========================================

const connections = new Map<string, SSEConnection[]>()

// ===========================================
// PUBLIC API
// ===========================================

/**
 * Register a new SSE connection for a user
 */
export function addConnection(userId: string, controller: ReadableStreamDefaultController): void {
  const existing = connections.get(userId) || []
  existing.push({ controller, userId, connectedAt: new Date() })
  connections.set(userId, existing)
  logger.info({ userId, totalConnections: existing.length }, 'SSE connection added')
}

/**
 * Remove a specific SSE connection
 */
export function removeConnection(userId: string, controller: ReadableStreamDefaultController): void {
  const existing = connections.get(userId) || []
  const filtered = existing.filter(c => c.controller !== controller)

  if (filtered.length === 0) {
    connections.delete(userId)
  } else {
    connections.set(userId, filtered)
  }

  logger.info({ userId, remainingConnections: filtered.length }, 'SSE connection removed')
}

/**
 * Send a notification event to a specific user
 */
export function notifyUser(userId: string, event: NotificationEvent): void {
  const userConnections = connections.get(userId)
  if (!userConnections || userConnections.length === 0) return

  const message = `data: ${JSON.stringify(event)}\n\n`
  const encoder = new TextEncoder()

  const dead: ReadableStreamDefaultController[] = []

  for (const conn of userConnections) {
    try {
      conn.controller.enqueue(encoder.encode(message))
    } catch {
      dead.push(conn.controller)
    }
  }

  // Clean up dead connections
  for (const controller of dead) {
    removeConnection(userId, controller)
  }
}

/**
 * Get count of active connections (for debugging)
 */
export function getConnectionCount(): number {
  let total = 0
  for (const conns of connections.values()) {
    total += conns.length
  }
  return total
}
