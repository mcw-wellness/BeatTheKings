import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import {
  createTestDb,
  closeTestDb,
  clearTestDb,
  testFactories,
  type TestDatabase,
} from '@/db/test-utils'
import {
  validateProfileInput,
  updateUserProfile,
  getUserProfile,
  cityExists,
} from '@/lib/auth/drizzle-adapter'

describe('Profile Adapter Functions', () => {
  let db: TestDatabase

  beforeAll(async () => {
    db = await createTestDb()
  })

  afterAll(async () => {
    await closeTestDb()
  })

  beforeEach(async () => {
    await clearTestDb(db)
  })

  describe('validateProfileInput', () => {
    it('should accept valid profile data', () => {
      const input = {
        name: 'John Doe',
        dateOfBirth: '1995-06-15',
        gender: 'male',
        cityId: '123e4567-e89b-12d3-a456-426614174000',
      }

      const result = validateProfileInput(input)

      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.data.name).toBe('John Doe')
        expect(result.data.dateOfBirth).toBe('1995-06-15')
        expect(result.data.gender).toBe('Male')
      }
    })

    it('should reject missing name', () => {
      const input = {
        dateOfBirth: '1995-06-15',
        gender: 'male',
        cityId: '123e4567-e89b-12d3-a456-426614174000',
      }

      const result = validateProfileInput(input)

      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.errors.name).toBe('Name is required')
      }
    })

    it('should reject name shorter than 2 characters', () => {
      const input = {
        name: 'J',
        dateOfBirth: '1995-06-15',
        gender: 'male',
        cityId: '123e4567-e89b-12d3-a456-426614174000',
      }

      const result = validateProfileInput(input)

      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.errors.name).toBe('Name must be at least 2 characters')
      }
    })

    it('should reject name longer than 100 characters', () => {
      const input = {
        name: 'A'.repeat(101),
        dateOfBirth: '1995-06-15',
        gender: 'male',
        cityId: '123e4567-e89b-12d3-a456-426614174000',
      }

      const result = validateProfileInput(input)

      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.errors.name).toBe('Name must be less than 100 characters')
      }
    })

    it('should reject missing date of birth', () => {
      const input = {
        name: 'John Doe',
        gender: 'male',
        cityId: '123e4567-e89b-12d3-a456-426614174000',
      }

      const result = validateProfileInput(input)

      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.errors.dateOfBirth).toBe('Date of birth is required')
      }
    })

    it('should reject invalid date format', () => {
      const input = {
        name: 'John Doe',
        dateOfBirth: 'not-a-date',
        gender: 'male',
        cityId: '123e4567-e89b-12d3-a456-426614174000',
      }

      const result = validateProfileInput(input)

      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.errors.dateOfBirth).toBe('Invalid date format')
      }
    })

    it('should reject age less than 5', () => {
      const recentDate = new Date()
      recentDate.setFullYear(recentDate.getFullYear() - 3)

      const input = {
        name: 'John Doe',
        dateOfBirth: recentDate.toISOString().split('T')[0],
        gender: 'male',
        cityId: '123e4567-e89b-12d3-a456-426614174000',
      }

      const result = validateProfileInput(input)

      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.errors.dateOfBirth).toBe('Must be at least 5 years old')
      }
    })

    it('should reject invalid gender', () => {
      const input = {
        name: 'John Doe',
        dateOfBirth: '1995-06-15',
        gender: 'InvalidGender',
        cityId: '123e4567-e89b-12d3-a456-426614174000',
      }

      const result = validateProfileInput(input)

      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.errors.gender).toBe('Invalid gender selection')
      }
    })

    it('should reject missing cityId', () => {
      const input = {
        name: 'John Doe',
        dateOfBirth: '1995-06-15',
        gender: 'male',
      }

      const result = validateProfileInput(input)

      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.errors.cityId).toBe('City is required')
      }
    })

    it('should accept all valid genders', () => {
      const genders = ['Male', 'Female', 'Other'] as const

      for (const gender of genders) {
        const input = {
          name: 'John Doe',
          dateOfBirth: '1995-06-15',
          gender,
          cityId: '123e4567-e89b-12d3-a456-426614174000',
        }

        const result = validateProfileInput(input)
        expect(result.valid).toBe(true)
      }
    })

    it('should trim name whitespace', () => {
      const input = {
        name: '  John Doe  ',
        dateOfBirth: '1995-06-15',
        gender: 'male',
        cityId: '123e4567-e89b-12d3-a456-426614174000',
      }

      const result = validateProfileInput(input)

      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.data.name).toBe('John Doe')
      }
    })
  })

  describe('updateUserProfile', () => {
    it('should update user profile and calculate age group', async () => {
      const { city } = await testFactories.createCountryWithCity(db, { cityName: 'Vienna' })
      const user = await testFactories.createUser(db)

      const updated = await updateUserProfile(db, user.id, {
        name: 'John Doe',
        dateOfBirth: '1995-06-15',
        gender: 'male',
        cityId: city.id,
      })

      expect(updated).toBeDefined()
      expect(updated.name).toBe('John Doe')
      expect(updated.gender).toBe('Male')
      expect(updated.cityId).toBe(city.id)
      expect(updated.ageGroup).toBe('18-30')
    })

    it('should set age group to Under-18 for young users', async () => {
      const { city } = await testFactories.createCountryWithCity(db)
      const user = await testFactories.createUser(db)

      const youngDate = new Date()
      youngDate.setFullYear(youngDate.getFullYear() - 15)

      const updated = await updateUserProfile(db, user.id, {
        name: 'Young User',
        dateOfBirth: youngDate.toISOString().split('T')[0],
        gender: 'male',
        cityId: city.id,
      })

      expect(updated.ageGroup).toBe('Under-18')
    })

    it('should set age group to 31+ for older users', async () => {
      const { city } = await testFactories.createCountryWithCity(db)
      const user = await testFactories.createUser(db)

      const updated = await updateUserProfile(db, user.id, {
        name: 'Older User',
        dateOfBirth: '1985-01-01',
        gender: 'male',
        cityId: city.id,
      })

      expect(updated.ageGroup).toBe('31+')
    })
  })

  describe('getUserProfile', () => {
    it('should return user profile with city info', async () => {
      const { city } = await testFactories.createCountryWithCity(db, { cityName: 'Vienna' })
      const user = await testFactories.createUser(db, { email: 'profile@example.com' })

      await updateUserProfile(db, user.id, {
        name: 'Profile User',
        dateOfBirth: '1990-01-01',
        gender: 'female',
        cityId: city.id,
      })

      const profile = await getUserProfile(db, user.id)

      expect(profile).toBeDefined()
      expect(profile?.name).toBe('Profile User')
      expect(profile?.email).toBe('profile@example.com')
      expect(profile?.gender).toBe('Female')
      expect(profile?.city?.name).toBe('Vienna')
    })

    it('should return null for non-existent user', async () => {
      const profile = await getUserProfile(db, '123e4567-e89b-12d3-a456-426614174999')
      expect(profile).toBeNull()
    })
  })

  describe('cityExists', () => {
    it('should return true for existing city', async () => {
      const { city } = await testFactories.createCountryWithCity(db)

      const exists = await cityExists(db, city.id)
      expect(exists).toBe(true)
    })

    it('should return false for non-existent city', async () => {
      const exists = await cityExists(db, '123e4567-e89b-12d3-a456-426614174999')
      expect(exists).toBe(false)
    })
  })
})
