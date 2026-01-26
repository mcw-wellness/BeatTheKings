/**
 * Avatar Generation Logger
 * Logs avatar generation ERRORS ONLY to a dedicated file for debugging
 */

import fs from 'fs'
import path from 'path'

const LOG_DIR = path.join(process.cwd(), 'logs')
const LOG_FILE = path.join(LOG_DIR, 'avatar-generation.log')

// Ensure logs directory exists
function ensureLogDir(): void {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true })
  }
}

function formatTimestamp(): string {
  return new Date().toISOString()
}

function writeLog(level: string, message: string, data?: Record<string, unknown>): void {
  try {
    ensureLogDir()
    const logEntry = {
      timestamp: formatTimestamp(),
      level,
      message,
      ...data,
    }
    const logLine = JSON.stringify(logEntry) + '\n'
    fs.appendFileSync(LOG_FILE, logLine)
  } catch {
    // Silently fail if logging fails - don't break the app
  }
}

export const avatarLogger = {
  // Only log errors to file, minimal console output
  error: (message: string, data?: Record<string, unknown>): void => {
    writeLog('ERROR', message, data)
    console.error(`[AVATAR ERROR] ${message}`, data?.error || '')
  },
}
