import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import { createTestDb, closeTestDb, clearTestDb, type TestDatabase } from '@/db/test-utils'
import { countries, cities, users } from '@/db/schema'

// Mock getSession before importing the route handler
const mockGetSession = vi.fn()

vi.mock('@/lib/auth', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/auth')>()
  return {
    ...original,
    getSession: () => mockGetSession(),
  }
})

// Mock getDb to use test database
let testDb: TestDatabase

vi.mock('@/db', () => ({
  getDb: () => testDb,
}))

// Import route handlers after mocking
import { GET, PUT } from '@/app/api/users/profile/route'

describe('Profile API Integration Tests', () => {
  beforeAll(async () => {
    testDb = await createTestDb()
  })

  afterAll(async () => {
    await closeTestDb()
  })

  beforeEach(async () => {
    await clearTestDb(testDb)
    mockGetSession.mockReset()
  })

  describe('GET /api/users/profile', () => {
    it('should return 401 when not authenticated', async () => {
      mockGetSession.mockResolvedValue(null)

      const response = await GET()

      expect(response.status).toBe(401)
      const body = await response.json()
      expect(body.error).toBe('Unauthorized')
    })

    it('should return 404 when user not found', async () => {
      mockGetSession.mockResolvedValue({
        user: { id: '123e4567-e89b-12d3-a456-426614174999', email: 'ghost@example.com' },
      })

      const response = await GET()

      expect(response.status).toBe(404)
      const body = await response.json()
      expect(body.error).toBe('Profile not found')
    })

    it('should return user profile when authenticated', async () => {
      // Create test data
      const [country] = await testDb
        .insert(countries)
        .values({ name: 'Austria', code: 'AT' })
        .returning()
      const [city] = await testDb
        .insert(cities)
        .values({ name: 'Vienna', countryId: country.id })
        .returning()
      const [user] = await testDb
        .insert(users)
        .values({
          email: 'test@example.com',
          name: 'Test User',
          dateOfBirth: '1990-01-15',
          ageGroup: '18-30',
          gender: 'Male',
          cityId: city.id,
          hasCreatedAvatar: false,
        })
        .returning()

      mockGetSession.mockResolvedValue({
        user: { id: user.id, email: user.email },
      })

      const response = await GET()

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.user.name).toBe('Test User')
      expect(body.user.email).toBe('test@example.com')
      expect(body.user.gender).toBe('Male')
      expect(body.user.city.name).toBe('Vienna')
    })
  })

  describe('PUT /api/users/profile', () => {
    it('should return 401 when not authenticated', async () => {
      mockGetSession.mockResolvedValue(null)

      const request = new Request('http://localhost/api/users/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name: 'Test',
          dateOfBirth: '1990-01-01',
          gender: 'Male',
          cityId: '123',
        }),
      })

      const response = await PUT(request)

      expect(response.status).toBe(401)
      const body = await response.json()
      expect(body.error).toBe('Unauthorized')
    })

    it('should return 400 for invalid JSON body', async () => {
      const [user] = await testDb
        .insert(users)
        .values({ email: 'test@example.com', hasCreatedAvatar: false })
        .returning()

      mockGetSession.mockResolvedValue({
        user: { id: user.id, email: user.email },
      })

      const request = new Request('http://localhost/api/users/profile', {
        method: 'PUT',
        body: 'invalid json',
      })

      const response = await PUT(request)

      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.error).toBe('Invalid JSON body')
    })

    it('should return 400 for validation errors', async () => {
      const [user] = await testDb
        .insert(users)
        .values({ email: 'test@example.com', hasCreatedAvatar: false })
        .returning()

      mockGetSession.mockResolvedValue({
        user: { id: user.id, email: user.email },
      })

      const request = new Request('http://localhost/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'A', // Too short
          dateOfBirth: '1990-01-01',
          gender: 'Invalid',
          cityId: '123',
        }),
      })

      const response = await PUT(request)

      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.error).toBe('Validation failed')
      expect(body.details.name).toBe('Name must be at least 2 characters')
      expect(body.details.gender).toBe('Invalid gender')
    })

    it('should return 400 for non-existent city', async () => {
      const [user] = await testDb
        .insert(users)
        .values({ email: 'test@example.com', hasCreatedAvatar: false })
        .returning()

      mockGetSession.mockResolvedValue({
        user: { id: user.id, email: user.email },
      })

      const request = new Request('http://localhost/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test User',
          dateOfBirth: '1990-01-01',
          gender: 'Male',
          cityId: '123e4567-e89b-12d3-a456-426614174999',
        }),
      })

      const response = await PUT(request)

      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.error).toBe('Validation failed')
      expect(body.details.cityId).toBe('City not found')
    })

    it('should update profile with valid data', async () => {
      const [country] = await testDb
        .insert(countries)
        .values({ name: 'Austria', code: 'AT' })
        .returning()
      const [city] = await testDb
        .insert(cities)
        .values({ name: 'Vienna', countryId: country.id })
        .returning()
      const [user] = await testDb
        .insert(users)
        .values({ email: 'test@example.com', hasCreatedAvatar: false })
        .returning()

      mockGetSession.mockResolvedValue({
        user: { id: user.id, email: user.email },
      })

      const request = new Request('http://localhost/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Updated User',
          dateOfBirth: '2000-06-15', // Age 24-25 in 2025 (18-30 group)
          gender: 'Female',
          cityId: city.id,
        }),
      })

      const response = await PUT(request)

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.success).toBe(true)
      expect(body.user.name).toBe('Updated User')
      expect(body.user.gender).toBe('female') // Stored as lowercase
      expect(body.user.ageGroup).toBe('18-30')
      expect(body.user.cityId).toBe(city.id)
    })

    it('should calculate correct age group for under 18', async () => {
      const [country] = await testDb
        .insert(countries)
        .values({ name: 'Austria', code: 'AT' })
        .returning()
      const [city] = await testDb
        .insert(cities)
        .values({ name: 'Vienna', countryId: country.id })
        .returning()
      const [user] = await testDb
        .insert(users)
        .values({ email: 'young@example.com', hasCreatedAvatar: false })
        .returning()

      mockGetSession.mockResolvedValue({
        user: { id: user.id, email: user.email },
      })

      const youngDate = new Date()
      youngDate.setFullYear(youngDate.getFullYear() - 15)

      const request = new Request('http://localhost/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Young User',
          dateOfBirth: youngDate.toISOString().split('T')[0],
          gender: 'Male',
          cityId: city.id,
        }),
      })

      const response = await PUT(request)

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.user.ageGroup).toBe('Under-18')
    })

    it('should calculate correct age group for 31+', async () => {
      const [country] = await testDb
        .insert(countries)
        .values({ name: 'Austria', code: 'AT' })
        .returning()
      const [city] = await testDb
        .insert(cities)
        .values({ name: 'Vienna', countryId: country.id })
        .returning()
      const [user] = await testDb
        .insert(users)
        .values({ email: 'older@example.com', hasCreatedAvatar: false })
        .returning()

      mockGetSession.mockResolvedValue({
        user: { id: user.id, email: user.email },
      })

      const request = new Request('http://localhost/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Older User',
          dateOfBirth: '1980-01-01',
          gender: 'Female',
          cityId: city.id,
        }),
      })

      const response = await PUT(request)

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.user.ageGroup).toBe('31+')
    })
  })
})
