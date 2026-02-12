import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import { createTestDb, closeTestDb, clearTestDb, testFactories, type TestDatabase } from '@/db/test-utils'

// Mock getDb
let testDb: TestDatabase

vi.mock('@/db', () => ({
  getDb: () => testDb,
}))

// Import after mocking
import { GET } from '@/app/api/sports/route'

describe('Sports API Integration Tests', () => {
  beforeAll(async () => {
    testDb = await createTestDb()
  })

  afterAll(async () => {
    await closeTestDb()
  })

  beforeEach(async () => {
    await clearTestDb(testDb)
  })

  describe('GET /api/sports', () => {
    it('should return empty array when no sports exist', async () => {
      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.sports).toEqual([])
    })

    it('should return active sports', async () => {
      await testFactories.createSport(testDb, {
        name: 'Basketball',
        slug: 'basketball',
        isActive: true,
      })
      await testFactories.createSport(testDb, {
        name: 'Soccer',
        slug: 'soccer',
        isActive: true,
      })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.sports).toHaveLength(2)
      expect(data.sports[0]).toHaveProperty('id')
      expect(data.sports[0]).toHaveProperty('name')
      expect(data.sports[0]).toHaveProperty('slug')
    })

    it('should not return inactive sports', async () => {
      await testFactories.createSport(testDb, {
        name: 'Basketball',
        slug: 'basketball',
        isActive: true,
      })
      await testFactories.createSport(testDb, {
        name: 'Running',
        slug: 'running',
        isActive: false,
      })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.sports).toHaveLength(1)
      expect(data.sports[0].name).toBe('Basketball')
    })

    it('should return id, name, and slug fields only', async () => {
      await testFactories.createSport(testDb, {
        name: 'Basketball',
        slug: 'basketball',
      })

      const response = await GET()
      const data = await response.json()

      const sport = data.sports[0]
      expect(Object.keys(sport).sort()).toEqual(['id', 'name', 'slug'])
    })
  })
})
