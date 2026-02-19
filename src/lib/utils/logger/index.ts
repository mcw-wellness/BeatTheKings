import pino from 'pino'
import path from 'path'

const isDevelopment = process.env.NODE_ENV === 'development'
const isTest = process.env.NODE_ENV === 'test'

const LOG_DIR = process.env.NODE_ENV === 'production' ? '/home/LogFiles' : path.join(process.cwd(), 'logs')

function buildTransport(): pino.TransportSingleOptions | pino.TransportMultiOptions | undefined {
  if (isTest) return undefined

  const targets: pino.TransportTargetOptions[] = [
    {
      target: 'pino-pretty',
      options: {
        colorize: isDevelopment,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    },
    {
      target: 'pino-roll',
      options: {
        file: path.join(LOG_DIR, 'app'),
        frequency: 'daily',
        mkdir: true,
        dateFormat: 'yyyy-MM-dd',
      },
    },
  ]

  return { targets }
}

export const logger = pino({
  level: isTest ? 'silent' : isDevelopment ? 'debug' : 'info',
  transport: buildTransport(),
  base: {
    env: process.env.NODE_ENV,
  },
})

/** Create a child logger with additional context */
export function createLogger(context: Record<string, unknown>): pino.Logger {
  return logger.child(context)
}

/** Log an error with full context */
export function logError(error: unknown, context: Record<string, unknown>, message: string): void {
  const errorDetails =
    error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack }
      : { error }

  logger.error({ ...context, error: errorDetails }, message)
}

/** Log API request/response for debugging */
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
