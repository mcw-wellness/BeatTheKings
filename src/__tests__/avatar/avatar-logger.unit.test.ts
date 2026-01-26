import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'

// Mock fs module
vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn(),
    mkdirSync: vi.fn(),
    appendFileSync: vi.fn(),
  },
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  appendFileSync: vi.fn(),
}))

describe('Avatar Logger', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock console methods
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('error logging', () => {
    it('should log errors with correct format', async () => {
      // Import after mocking
      const { avatarLogger } = await import('@/lib/avatar/avatar-logger')

      // Mock fs.existsSync to return true (dir exists)
      vi.mocked(fs.existsSync).mockReturnValue(true)

      avatarLogger.error('Test error message', { userId: 'user-123', error: 'Something went wrong' })

      // Should have called appendFileSync
      expect(fs.appendFileSync).toHaveBeenCalled()

      // Check the logged data format
      const call = vi.mocked(fs.appendFileSync).mock.calls[0]
      const logLine = call[1] as string
      const logEntry = JSON.parse(logLine.trim())

      expect(logEntry.level).toBe('ERROR')
      expect(logEntry.message).toBe('Test error message')
      expect(logEntry.userId).toBe('user-123')
      expect(logEntry.error).toBe('Something went wrong')
      expect(logEntry.timestamp).toBeDefined()
    })

    it('should create logs directory if it does not exist', async () => {
      const { avatarLogger } = await import('@/lib/avatar/avatar-logger')

      // Mock fs.existsSync to return false (dir doesn't exist)
      vi.mocked(fs.existsSync).mockReturnValue(false)

      avatarLogger.error('Test message', {})

      // Should have called mkdirSync to create directory
      expect(fs.mkdirSync).toHaveBeenCalledWith(expect.stringContaining('logs'), { recursive: true })
    })

    it('should log to console with [AVATAR ERROR] prefix', async () => {
      const { avatarLogger } = await import('@/lib/avatar/avatar-logger')

      vi.mocked(fs.existsSync).mockReturnValue(true)

      avatarLogger.error('Console test', { error: 'test error' })

      expect(console.error).toHaveBeenCalledWith('[AVATAR ERROR] Console test', 'test error')
    })

    it('should not throw if file write fails', async () => {
      const { avatarLogger } = await import('@/lib/avatar/avatar-logger')

      // Mock appendFileSync to throw
      vi.mocked(fs.appendFileSync).mockImplementation(() => {
        throw new Error('Write failed')
      })
      vi.mocked(fs.existsSync).mockReturnValue(true)

      // Should not throw
      expect(() => {
        avatarLogger.error('Test message', {})
      }).not.toThrow()
    })
  })

  describe('log file path', () => {
    it('should write to logs/avatar-generation.log', async () => {
      const { avatarLogger } = await import('@/lib/avatar/avatar-logger')

      vi.mocked(fs.existsSync).mockReturnValue(true)

      avatarLogger.error('Path test', {})

      const call = vi.mocked(fs.appendFileSync).mock.calls[0]
      const filePath = call[0] as string

      expect(filePath).toContain('logs')
      expect(filePath).toContain('avatar-generation.log')
    })
  })

  describe('timestamp format', () => {
    it('should include ISO timestamp in log entry', async () => {
      const { avatarLogger } = await import('@/lib/avatar/avatar-logger')

      vi.mocked(fs.existsSync).mockReturnValue(true)

      const beforeTime = new Date().toISOString()
      avatarLogger.error('Timestamp test', {})
      const afterTime = new Date().toISOString()

      const call = vi.mocked(fs.appendFileSync).mock.calls[0]
      const logLine = call[1] as string
      const logEntry = JSON.parse(logLine.trim())

      // Timestamp should be between before and after (or equal)
      expect(new Date(logEntry.timestamp).getTime()).toBeGreaterThanOrEqual(
        new Date(beforeTime).getTime() - 1000
      )
      expect(new Date(logEntry.timestamp).getTime()).toBeLessThanOrEqual(
        new Date(afterTime).getTime() + 1000
      )
    })
  })
})
