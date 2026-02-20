import 'server-only'
import pino from 'pino'

const isDevelopment = process.env.NODE_ENV === 'development'
const isTest = process.env.NODE_ENV === 'test'

const LOG_DIR = '/home/LogFiles'

function createLogger(): pino.Logger {
  const level = isTest ? 'silent' : isDevelopment ? 'debug' : 'info'
  const base = { env: process.env.NODE_ENV }

  if (isTest) {
    return pino({ level, base })
  }

  // Development: pretty-print to stdout via transport (worker thread)
  if (isDevelopment) {
    return pino({
      level,
      base,
      transport: {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'SYS:standard', ignore: 'pid,hostname' },
      },
    })
  }

  // Production: pretty stdout + daily log file via transport workers
  const date = new Date().toISOString().split('T')[0]

  return pino({
    level,
    base,
    transport: {
      targets: [
        {
          target: 'pino-pretty',
          options: { colorize: false, translateTime: 'SYS:standard', ignore: 'pid,hostname' },
        },
        {
          target: 'pino/file',
          options: { destination: `${LOG_DIR}/app.${date}.log`, mkdir: true },
        },
      ],
    },
  })
}

export const logger = createLogger()

/** Create a child logger with additional context */
export function createChildLogger(context: Record<string, unknown>): pino.Logger {
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
