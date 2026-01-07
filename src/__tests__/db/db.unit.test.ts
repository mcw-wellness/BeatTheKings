import {
  createTestDb,
  closeTestDb,
  clearTestDb,
  testFactories,
  type TestDatabase,
} from '@/db/test-utils'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'

describe('Database Schema Tests', () => {
  let db: TestDatabase

  beforeAll(async () => {
    db = await createTestDb()
  })

  afterAll(async () => {
    await closeTestDb()
  })

  beforeEach(async () => {
    await clearTestDb()
  })

  describe('Countries', () => {
    it('should create a country', async () => {
      const country = await testFactories.createCountry(db, {
        name: 'Austria',
        code: 'AT',
      })

      expect(country.id).toBeDefined()
      expect(country.name).toBe('Austria')
      expect(country.code).toBe('AT')
    })

    it('should enforce unique country code', async () => {
      await testFactories.createCountry(db, { code: 'AT' })

      await expect(testFactories.createCountry(db, { code: 'AT' })).rejects.toThrow()
    })
  })

  describe('Cities', () => {
    it('should create a city linked to a country', async () => {
      const country = await testFactories.createCountry(db, {
        name: 'Austria',
        code: 'AT',
      })

      const city = await testFactories.createCity(db, country.id, {
        name: 'Vienna',
      })

      expect(city.id).toBeDefined()
      expect(city.name).toBe('Vienna')
      expect(city.countryId).toBe(country.id)
    })
  })

  describe('Users', () => {
    it('should create a user with email', async () => {
      const user = await testFactories.createUser(db, {
        email: 'test@example.com',
      })

      expect(user.id).toBeDefined()
      expect(user.email).toBe('test@example.com')
      expect(user.hasCreatedAvatar).toBe(false)
    })

    it('should enforce unique email', async () => {
      await testFactories.createUser(db, { email: 'unique@example.com' })

      await expect(testFactories.createUser(db, { email: 'unique@example.com' })).rejects.toThrow()
    })

    it('should allow nullable fields', async () => {
      const user = await testFactories.createUser(db)

      expect(user.name).toBeNull()
      expect(user.dateOfBirth).toBeNull()
      expect(user.ageGroup).toBeNull()
      expect(user.gender).toBeNull()
      expect(user.cityId).toBeNull()
    })

    it('should update user profile', async () => {
      const user = await testFactories.createUser(db, {
        email: 'update@example.com',
      })

      await db
        .update(users)
        .set({ name: 'John Doe', ageGroup: '18-30' })
        .where(eq(users.id, user.id))

      const [updated] = await db.select().from(users).where(eq(users.id, user.id))

      expect(updated.name).toBe('John Doe')
      expect(updated.ageGroup).toBe('18-30')
    })
  })

  describe('Sports', () => {
    it('should create a sport', async () => {
      const sport = await testFactories.createSport(db, {
        name: 'Basketball',
        slug: 'basketball',
      })

      expect(sport.id).toBeDefined()
      expect(sport.name).toBe('Basketball')
      expect(sport.slug).toBe('basketball')
      expect(sport.isActive).toBe(true)
    })
  })

  describe('Venues', () => {
    it('should create a venue linked to a city', async () => {
      const country = await testFactories.createCountry(db, { code: 'AT' })
      const city = await testFactories.createCity(db, country.id, {
        name: 'Vienna',
      })

      const venue = await testFactories.createVenue(db, city.id, {
        name: 'Prater Basketball Court',
        latitude: 48.2082,
        longitude: 16.3738,
      })

      expect(venue.id).toBeDefined()
      expect(venue.name).toBe('Prater Basketball Court')
      expect(venue.cityId).toBe(city.id)
      expect(venue.latitude).toBe(48.2082)
      expect(venue.longitude).toBe(16.3738)
      expect(venue.isActive).toBe(true)
    })
  })
})
