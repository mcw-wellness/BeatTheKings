import { describe, it, expect } from 'vitest'

describe('Sports API Unit Tests', () => {
  it('should export GET handler', async () => {
    const { GET } = await import('@/app/api/sports/route')
    expect(typeof GET).toBe('function')
  })
})
