/**
 * GET /api/notifications/stream
 * Server-Sent Events endpoint for real-time notifications
 */

import { getSession } from '@/lib/auth'
import { addConnection, removeConnection } from '@/lib/notifications/emitter'
import { logger } from '@/lib/utils/logger'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(): Promise<Response> {
  const session = await getSession()
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 })
  }

  const userId = session.user.id
  let controllerRef: ReadableStreamDefaultController | null = null

  const stream = new ReadableStream({
    start(controller) {
      controllerRef = controller
      addConnection(userId, controller)

      // Send initial heartbeat so client knows connection is alive
      const encoder = new TextEncoder()
      controller.enqueue(encoder.encode(': connected\n\n'))
    },
    cancel() {
      if (controllerRef) {
        removeConnection(userId, controllerRef)
      }
      logger.info({ userId }, 'SSE stream cancelled by client')
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  })
}
