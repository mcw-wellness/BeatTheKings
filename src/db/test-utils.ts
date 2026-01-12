import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { sql } from 'drizzle-orm'
import * as schema from './schema'
import type { Database } from './index'

// Type for the test database instance (alias for Database)
export type TestDatabase = Database

// Store the PGLite instance for cleanup
let pgliteInstance: PGlite | null = null
let testDb: TestDatabase | null = null

/**
 * Create an in-memory PostgreSQL database for testing
 * Uses PGLite for instant startup and fast tests
 */
export async function createTestDb(): Promise<TestDatabase> {
  // Create new PGLite instance (in-memory)
  pgliteInstance = new PGlite()
  testDb = drizzle(pgliteInstance, { schema })

  // Create all tables
  await createTables(testDb)

  return testDb
}

/**
 * Get the current test database instance
 */
export function getTestDb(): TestDatabase {
  if (!testDb) {
    throw new Error('Test database not initialized. Call createTestDb() first.')
  }
  return testDb
}

/**
 * Clean up test database (call in afterAll or afterEach)
 */
export async function closeTestDb(): Promise<void> {
  if (pgliteInstance) {
    await pgliteInstance.close()
    pgliteInstance = null
    testDb = null
  }
}

/**
 * Clear all data from tables (for test isolation)
 * Call in beforeEach to reset state between tests
 */
export async function clearTestDb(db?: TestDatabase): Promise<void> {
  const database = db ?? testDb
  if (!database) return

  // Reset factory counter
  counter = 0

  // Delete in reverse order of dependencies
  await database.delete(schema.activePlayers)
  await database.delete(schema.playerStats)
  await database.delete(schema.challengeAttempts)
  await database.delete(schema.matches)
  await database.delete(schema.challenges)
  await database.delete(schema.avatarEquipments)
  await database.delete(schema.userUnlockedItems)
  await database.delete(schema.avatars)
  await database.delete(schema.avatarItems)
  await database.delete(schema.venues)
  await database.delete(schema.sports)
  await database.delete(schema.users)
  await database.delete(schema.cities)
  await database.delete(schema.countries)
}

/**
 * Create all tables in the test database
 */
async function createTables(db: TestDatabase): Promise<void> {
  // Countries
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "Country" (
      "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "name" VARCHAR(255) NOT NULL,
      "code" VARCHAR(10) NOT NULL UNIQUE,
      "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `)

  // Cities
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "City" (
      "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "name" VARCHAR(255) NOT NULL,
      "countryId" UUID NOT NULL REFERENCES "Country"("id"),
      "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
      UNIQUE("name", "countryId")
    )
  `)

  // Users
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "User" (
      "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "email" VARCHAR(255) NOT NULL UNIQUE,
      "name" VARCHAR(255),
      "dateOfBirth" DATE,
      "ageGroup" VARCHAR(50),
      "gender" VARCHAR(50),
      "cityId" UUID REFERENCES "City"("id"),
      "hasCreatedAvatar" BOOLEAN DEFAULT FALSE NOT NULL,
      "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
      "updatedAt" TIMESTAMP
    )
  `)

  // Sports
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "Sport" (
      "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "name" VARCHAR(255) NOT NULL UNIQUE,
      "slug" VARCHAR(255) NOT NULL UNIQUE,
      "isActive" BOOLEAN DEFAULT TRUE NOT NULL,
      "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `)

  // Venues
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "Venue" (
      "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "name" VARCHAR(255) NOT NULL,
      "cityId" UUID NOT NULL REFERENCES "City"("id"),
      "address" VARCHAR(500),
      "district" VARCHAR(255),
      "latitude" DOUBLE PRECISION,
      "longitude" DOUBLE PRECISION,
      "description" TEXT,
      "imageUrl" VARCHAR(500),
      "isActive" BOOLEAN DEFAULT TRUE NOT NULL,
      "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
      "updatedAt" TIMESTAMP
    )
  `)

  // AvatarItems
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "AvatarItem" (
      "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "name" VARCHAR(255) NOT NULL,
      "itemType" VARCHAR(50) NOT NULL,
      "sportId" UUID REFERENCES "Sport"("id"),
      "imageUrl" VARCHAR(500),
      "requiredMatches" INTEGER,
      "requiredChallenges" INTEGER,
      "requiredInvites" INTEGER,
      "requiredXp" INTEGER,
      "rpCost" INTEGER,
      "isDefault" BOOLEAN DEFAULT FALSE NOT NULL,
      "isActive" BOOLEAN DEFAULT TRUE NOT NULL,
      "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `)

  // Avatars
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "Avatar" (
      "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "userId" UUID NOT NULL UNIQUE REFERENCES "User"("id"),
      "skinTone" VARCHAR(50),
      "hairStyle" VARCHAR(50),
      "hairColor" VARCHAR(50),
      "imageUrl" VARCHAR(500),
      "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
      "updatedAt" TIMESTAMP
    )
  `)

  // UserUnlockedItems
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "UserUnlockedItem" (
      "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "userId" UUID NOT NULL REFERENCES "User"("id"),
      "itemId" UUID NOT NULL REFERENCES "AvatarItem"("id"),
      "unlockedAt" TIMESTAMP DEFAULT NOW() NOT NULL,
      "unlockedVia" VARCHAR(50) NOT NULL,
      UNIQUE("userId", "itemId")
    )
  `)

  // AvatarEquipments
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "AvatarEquipment" (
      "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "avatarId" UUID NOT NULL REFERENCES "Avatar"("id"),
      "sportId" UUID NOT NULL REFERENCES "Sport"("id"),
      "jerseyItemId" UUID REFERENCES "AvatarItem"("id"),
      "shortsItemId" UUID REFERENCES "AvatarItem"("id"),
      "shoesItemId" UUID REFERENCES "AvatarItem"("id"),
      "accessoryItemId" UUID REFERENCES "AvatarItem"("id"),
      "jerseyNumber" INTEGER,
      "updatedAt" TIMESTAMP,
      UNIQUE("avatarId", "sportId")
    )
  `)

  // Challenges
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "Challenge" (
      "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "venueId" UUID NOT NULL REFERENCES "Venue"("id"),
      "sportId" UUID NOT NULL REFERENCES "Sport"("id"),
      "name" VARCHAR(255) NOT NULL,
      "description" TEXT NOT NULL,
      "instructions" TEXT NOT NULL,
      "challengeType" VARCHAR(50) NOT NULL,
      "xpReward" INTEGER NOT NULL,
      "rpReward" INTEGER DEFAULT 0 NOT NULL,
      "difficulty" VARCHAR(20) NOT NULL,
      "isActive" BOOLEAN DEFAULT TRUE NOT NULL,
      "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
      "updatedAt" TIMESTAMP
    )
  `)

  // ChallengeAttempts
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "ChallengeAttempt" (
      "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "challengeId" UUID NOT NULL REFERENCES "Challenge"("id"),
      "userId" UUID NOT NULL REFERENCES "User"("id"),
      "scoreValue" INTEGER NOT NULL,
      "maxValue" INTEGER NOT NULL,
      "videoUrl" VARCHAR(500),
      "xpEarned" INTEGER DEFAULT 0 NOT NULL,
      "rpEarned" INTEGER DEFAULT 0 NOT NULL,
      "completedAt" TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `)

  // Matches
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "Match" (
      "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "venueId" UUID NOT NULL REFERENCES "Venue"("id"),
      "sportId" UUID NOT NULL REFERENCES "Sport"("id"),
      "player1Id" UUID NOT NULL REFERENCES "User"("id"),
      "player2Id" UUID NOT NULL REFERENCES "User"("id"),
      "player1Score" INTEGER,
      "player2Score" INTEGER,
      "winnerId" UUID REFERENCES "User"("id"),
      "status" VARCHAR(20) DEFAULT 'pending' NOT NULL,
      "player1Agreed" BOOLEAN DEFAULT FALSE NOT NULL,
      "player2Agreed" BOOLEAN DEFAULT FALSE NOT NULL,
      "videoUrl" VARCHAR(500),
      "winnerXp" INTEGER DEFAULT 0 NOT NULL,
      "winnerRp" INTEGER DEFAULT 0 NOT NULL,
      "loserXp" INTEGER DEFAULT 0 NOT NULL,
      "startedAt" TIMESTAMP,
      "completedAt" TIMESTAMP,
      "recordingBy" UUID REFERENCES "User"("id"),
      "recordingStartedAt" TIMESTAMP,
      "disputeReason" VARCHAR(100),
      "disputeDetails" TEXT,
      "disputedBy" UUID REFERENCES "User"("id"),
      "disputedAt" TIMESTAMP,
      "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `)

  // PlayerStats
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "PlayerStats" (
      "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "userId" UUID NOT NULL REFERENCES "User"("id"),
      "sportId" UUID NOT NULL REFERENCES "Sport"("id"),
      "totalXp" INTEGER DEFAULT 0 NOT NULL,
      "totalRp" INTEGER DEFAULT 0 NOT NULL,
      "availableRp" INTEGER DEFAULT 0 NOT NULL,
      "matchesPlayed" INTEGER DEFAULT 0 NOT NULL,
      "matchesWon" INTEGER DEFAULT 0 NOT NULL,
      "matchesLost" INTEGER DEFAULT 0 NOT NULL,
      "challengesCompleted" INTEGER DEFAULT 0 NOT NULL,
      "totalPointsScored" INTEGER DEFAULT 0 NOT NULL,
      "threePointMade" INTEGER DEFAULT 0 NOT NULL,
      "threePointAttempted" INTEGER DEFAULT 0 NOT NULL,
      "freeThrowMade" INTEGER DEFAULT 0 NOT NULL,
      "freeThrowAttempted" INTEGER DEFAULT 0 NOT NULL,
      "usersInvited" INTEGER DEFAULT 0 NOT NULL,
      "updatedAt" TIMESTAMP,
      UNIQUE("userId", "sportId")
    )
  `)

  // ActivePlayers
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "ActivePlayer" (
      "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "userId" UUID NOT NULL REFERENCES "User"("id"),
      "venueId" UUID NOT NULL REFERENCES "Venue"("id"),
      "latitude" DOUBLE PRECISION NOT NULL,
      "longitude" DOUBLE PRECISION NOT NULL,
      "lastSeenAt" TIMESTAMP DEFAULT NOW() NOT NULL,
      "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
      UNIQUE("userId", "venueId")
    )
  `)
}

/**
 * Sequential counter for unique test data
 */
let counter = 0
function nextId(): number {
  return ++counter
}

/**
 * Reset counter (call in beforeEach if needed)
 */
export function resetFactoryCounter(): void {
  counter = 0
}

/**
 * Test data factories for common entities
 */
export const testFactories = {
  // ===========================================
  // BASE FACTORIES
  // ===========================================

  async createCountry(db: TestDatabase, data?: Partial<typeof schema.countries.$inferInsert>) {
    const id = nextId()
    const [country] = await db
      .insert(schema.countries)
      .values({
        name: data?.name ?? `Country ${id}`,
        code: data?.code ?? `C${id}`,
      })
      .returning()
    return country
  },

  async createCity(
    db: TestDatabase,
    countryId: string,
    data?: Partial<typeof schema.cities.$inferInsert>
  ) {
    const id = nextId()
    const [city] = await db
      .insert(schema.cities)
      .values({
        name: data?.name ?? `City ${id}`,
        countryId,
      })
      .returning()
    return city
  },

  async createUser(db: TestDatabase, data?: Partial<typeof schema.users.$inferInsert>) {
    const id = nextId()
    const [user] = await db
      .insert(schema.users)
      .values({
        email: data?.email ?? `user${id}@test.com`,
        name: data?.name,
        cityId: data?.cityId,
        hasCreatedAvatar: data?.hasCreatedAvatar ?? false,
      })
      .returning()
    return user
  },

  async createSport(db: TestDatabase, data?: Partial<typeof schema.sports.$inferInsert>) {
    const id = nextId()
    const [sport] = await db
      .insert(schema.sports)
      .values({
        name: data?.name ?? `Sport ${id}`,
        slug: data?.slug ?? `sport-${id}`,
        isActive: data?.isActive ?? true,
      })
      .returning()
    return sport
  },

  async createVenue(
    db: TestDatabase,
    cityId: string,
    data?: Partial<typeof schema.venues.$inferInsert>
  ) {
    const id = nextId()
    const [venue] = await db
      .insert(schema.venues)
      .values({
        name: data?.name ?? `Venue ${id}`,
        cityId,
        latitude: data?.latitude ?? 48.2082,
        longitude: data?.longitude ?? 16.3738,
        isActive: data?.isActive ?? true,
      })
      .returning()
    return venue
  },

  async createAvatar(
    db: TestDatabase,
    userId: string,
    data?: Partial<typeof schema.avatars.$inferInsert>
  ) {
    const [avatar] = await db
      .insert(schema.avatars)
      .values({
        userId,
        skinTone: data?.skinTone ?? 'medium',
        hairStyle: data?.hairStyle ?? 'short',
        hairColor: data?.hairColor ?? 'black',
        ...data,
      })
      .returning()
    return avatar
  },

  async createChallenge(
    db: TestDatabase,
    venueId: string,
    sportId: string,
    data?: Partial<typeof schema.challenges.$inferInsert>
  ) {
    const id = nextId()
    const [challenge] = await db
      .insert(schema.challenges)
      .values({
        venueId,
        sportId,
        name: data?.name ?? `Challenge ${id}`,
        description: data?.description ?? 'Test challenge description',
        instructions: data?.instructions ?? 'Test instructions',
        challengeType: data?.challengeType ?? 'free_throw',
        xpReward: data?.xpReward ?? 100,
        rpReward: data?.rpReward ?? 10,
        difficulty: data?.difficulty ?? 'medium',
        isActive: data?.isActive ?? true,
        ...data,
      })
      .returning()
    return challenge
  },

  async createMatch(
    db: TestDatabase,
    venueId: string,
    sportId: string,
    player1Id: string,
    player2Id: string,
    data?: Partial<typeof schema.matches.$inferInsert>
  ) {
    const [match] = await db
      .insert(schema.matches)
      .values({
        venueId,
        sportId,
        player1Id,
        player2Id,
        status: data?.status ?? 'pending',
        ...data,
      })
      .returning()
    return match
  },

  async createPlayerStats(
    db: TestDatabase,
    userId: string,
    sportId: string,
    data?: Partial<typeof schema.playerStats.$inferInsert>
  ) {
    const [stats] = await db
      .insert(schema.playerStats)
      .values({
        userId,
        sportId,
        totalXp: data?.totalXp ?? 0,
        totalRp: data?.totalRp ?? 0,
        availableRp: data?.availableRp ?? 0,
        matchesPlayed: data?.matchesPlayed ?? 0,
        matchesWon: data?.matchesWon ?? 0,
        matchesLost: data?.matchesLost ?? 0,
        ...data,
      })
      .returning()
    return stats
  },

  // ===========================================
  // COMPOSITE FACTORIES
  // ===========================================

  /**
   * Create a country with city
   */
  async createCountryWithCity(
    db: TestDatabase,
    options?: { countryName?: string; countryCode?: string; cityName?: string }
  ) {
    const country = await this.createCountry(db, {
      name: options?.countryName,
      code: options?.countryCode,
    })
    const city = await this.createCity(db, country.id, { name: options?.cityName })
    return { country, city }
  },

  /**
   * Create a user with location (country + city)
   */
  async createUserWithLocation(
    db: TestDatabase,
    options?: {
      email?: string
      name?: string
      countryName?: string
      cityName?: string
      hasCreatedAvatar?: boolean
    }
  ) {
    const { country, city } = await this.createCountryWithCity(db, {
      countryName: options?.countryName,
      cityName: options?.cityName,
    })
    const user = await this.createUser(db, {
      email: options?.email,
      name: options?.name,
      cityId: city.id,
      hasCreatedAvatar: options?.hasCreatedAvatar,
    })
    return { user, city, country }
  },

  /**
   * Create a user with avatar
   */
  async createUserWithAvatar(
    db: TestDatabase,
    options?: { email?: string; name?: string; skinTone?: string }
  ) {
    const user = await this.createUser(db, {
      email: options?.email,
      name: options?.name,
      hasCreatedAvatar: true,
    })
    const avatar = await this.createAvatar(db, user.id, { skinTone: options?.skinTone })
    return { user, avatar }
  },

  /**
   * Create a complete user (with location and avatar)
   */
  async createCompleteUser(
    db: TestDatabase,
    options?: { email?: string; name?: string; countryName?: string; cityName?: string }
  ) {
    const { user, city, country } = await this.createUserWithLocation(db, {
      ...options,
      hasCreatedAvatar: true,
    })
    const avatar = await this.createAvatar(db, user.id)
    return { user, avatar, city, country }
  },

  /**
   * Create a venue with location
   */
  async createVenueWithLocation(
    db: TestDatabase,
    options?: { venueName?: string; cityName?: string; countryName?: string }
  ) {
    const { country, city } = await this.createCountryWithCity(db, {
      countryName: options?.countryName,
      cityName: options?.cityName,
    })
    const venue = await this.createVenue(db, city.id, { name: options?.venueName })
    return { venue, city, country }
  },

  /**
   * Create a challenge with all dependencies
   */
  async createChallengeWithDependencies(
    db: TestDatabase,
    options?: { challengeName?: string; sportName?: string; venueName?: string }
  ) {
    const { venue, city, country } = await this.createVenueWithLocation(db, {
      venueName: options?.venueName,
    })
    const sport = await this.createSport(db, { name: options?.sportName })
    const challenge = await this.createChallenge(db, venue.id, sport.id, {
      name: options?.challengeName,
    })
    return { challenge, venue, sport, city, country }
  },

  /**
   * Create a match with all dependencies (2 users, venue, sport)
   */
  async createMatchWithPlayers(
    db: TestDatabase,
    options?: { player1Name?: string; player2Name?: string; status?: string }
  ) {
    const { venue, city, country } = await this.createVenueWithLocation(db)
    const sport = await this.createSport(db)
    const player1 = await this.createUser(db, { name: options?.player1Name ?? 'Player 1' })
    const player2 = await this.createUser(db, { name: options?.player2Name ?? 'Player 2' })
    const match = await this.createMatch(db, venue.id, sport.id, player1.id, player2.id, {
      status: options?.status as 'pending' | 'in_progress' | 'completed' | undefined,
    })
    return { match, player1, player2, venue, sport, city, country }
  },
}
