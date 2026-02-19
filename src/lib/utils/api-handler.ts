import { NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'

type RouteHandler = (...args: unknown[]) => Promise<NextResponse | Response>

/**
 * Wraps an API route handler with error logging.
 * Catches unhandled exceptions, logs them with context, and returns a 500 response.
 */
export function withErrorLogging(handler: RouteHandler): RouteHandler {
  return async (...args: unknown[]) => {
    const request = args[0] instanceof Request ? args[0] : undefined
    const method = request?.method ?? 'UNKNOWN'
    const pathname = request ? new URL(request.url).pathname : 'unknown'
    const start = Date.now()

    try {
      const response = await handler(...args)
      const durationMs = Date.now() - start
      const status = response instanceof NextResponse ? response.status : 200

      logger.info({ method, path: pathname, status, durationMs }, `${method} ${pathname} ${status} ${durationMs}ms`)

      return response
    } catch (error) {
      const durationMs = Date.now() - start
      const errorDetails =
        error instanceof Error
          ? { name: error.name, message: error.message, stack: error.stack }
          : { error }

      logger.error(
        { method, path: pathname, durationMs, error: errorDetails },
        `Unhandled exception: ${method} ${pathname}`
      )

      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}
