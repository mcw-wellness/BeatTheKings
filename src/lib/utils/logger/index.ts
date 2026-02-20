import 'server-only'
import pino from 'pino'
import fs from 'fs'

const isDevelopment = process.env.NODE_ENV === 'development'
const isTest = process.env.NODE_ENV === 'test'

const LOG_DIR = '/home/LogFiles'

function createLogger(): pino.Logger {
  const level = isTest ? 'silent' : isDevelopment ? 'debug' : 'info'
  const base = { env: process.env.NODE_ENV }

  // Test: silent logger
  if (isTest) {
    return pino({ level, base })
  }

  // Development: pino-pretty via transport (worker threads work fine locally)
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

  // Production: stdout + daily log file using main-thread streams (no worker threads)
  const streams: pino.StreamEntry[] = [{ stream: process.stdout }]

  // Add file stream if log directory exists (Azure runtime has /home/LogFiles)
  // During next build, directory won't exist — stdout only
  if (fs.existsSync(LOG_DIR)) {
    const date = new Date().toISOString().split('T')[0]
    const fileStream = pino.destination({
      dest: `${LOG_DIR}/app.${date}.log`,
      append: true,
      sync: false,
    })
    streams.push({ stream: fileStream })
  }

  return pino({ level, base }, pino.multistream(streams))
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

export default logger
