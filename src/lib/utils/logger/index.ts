import pino from 'pino'

/**
 * Application logger using Pino
 *
 * Usage:
 * ```typescript
 * import { logger } from '@/lib/utils/logger'
 *
 * logger.info({ userId }, 'User signed in')
 * logger.error({ error, context }, 'Operation failed')
 * ```
 */

const isDevelopment = process.env.NODE_ENV === 'development'
const isTest = process.env.NODE_ENV === 'test'

export const logger = pino({
  level: isTest ? 'silent' : isDevelopment ? 'debug' : 'info',
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  base: {
    env: process.env.NODE_ENV,
  },
})

/**
 * Create a child logger with additional context
 * Useful for adding request-specific data
 */
export function createLogger(context: Record<string, unknown>): pino.Logger {
  return logger.child(context)
}

/**
 * Log an error with full context
 * Always use this for error logging to ensure consistent format
 */
export function logError(error: unknown, context: Record<string, unknown>, message: string): void {
  const errorDetails =
    error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack }
      : { error }

  logger.error({ ...context, error: errorDetails }, message)
}

/**
 * Log API request/response for debugging
 */
export function logApiCall(
  method: string,
  path: string,
  statusCode: number,
  durationMs: number,
  userId?: string
): void {
  logger.info(
    { method, path, statusCode, durationMs, userId },
    `${method} ${path} ${statusCode} ${durationMs}ms`
  )
}

export default logger
