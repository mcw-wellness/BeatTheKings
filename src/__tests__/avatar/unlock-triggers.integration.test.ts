/**
 * Auto-Unlock Triggers Integration Tests
 * Tests that items are automatically unlocked after match/challenge completion
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import { createTestDb, closeTestDb, clearTestDb, type TestDatabase } from '@/db/test-utils'
import {
  users,
  avatarItems,
  userUnlockedItems,
  playerStats,
  sports,
  cities,
  countries,
  venues,
  matches,
  challenges,
} from '@/db/schema'
import { eq } from 'drizzle-orm'

// Store test database
let testDb: TestDatabase

// Mock the database module
vi.mock('@/db', () => ({
  getDb: () => testDb,
}))

// Import after mocking
import { agreeToMatchResult } from '@/lib/matches'
import { recordChallengeAttempt } from '@/lib/challenges'

describe('Auto-Unlock Triggers Integration Tests', () => {
  beforeAll(async () => {
    testDb = await createTestDb()
  })

  afterAll(async () => {
    await closeTestDb()
  })

  beforeEach(async () => {
    await clearTestDb(testDb)
  })

  // Helper functions
  async function createCountry(name = 'Austria', code = 'AT') {
    const [country] = await testDb.insert(countries).values({ name, code }).returning()
    return country
  }

  async function createCity(name = 'Vienna', countryId: string) {
    const [city] = await testDb.insert(cities).values({ name, countryId }).returning()
    return city
  }

  async function createUser(email: string, name: string, cityId: string) {
    const [user] = await testDb
      .insert(users)
      .values({ email, name, cityId, hasCreatedAvatar: true })
      .returning()
    return user
  }

  async function createSport(name = 'Basketball', slug = 'basketball') {
    const [sport] = await testDb.insert(sports).values({ name, slug, isActive: true }).returning()
    return sport
  }

  async function createVenue(name: string, cityId: string) {
    const [venue] = await testDb
      .insert(venues)
      .values({ name, cityId, isActive: true })
      .returning()
    return venue
  }

  async function createItem(overrides: Partial<typeof avatarItems.$inferInsert> = {}) {
    const [item] = await testDb
      .insert(avatarItems)
      .values({
        name: 'Test Item',
        itemType: 'jersey',
        isDefault: false,
        isActive: true,
        ...overrides,
      })
      .returning()
    return item
  }

  async function createPlayerStats(
    userId: string,
    sportId: string,
    overrides: Partial<typeof playerStats.$inferInsert> = {}
  ) {
    const [stats] = await testDb
      .insert(playerStats)
      .values({
        userId,
        sportId,
        totalXp: 0,
        totalRp: 0,
        availableRp: 0,
        matchesPlayed: 0,
        matchesWon: 0,
        matchesLost: 0,
        challengesCompleted: 0,
        totalPointsScored: 0,
        usersInvited: 0,
        ...overrides,
      })
      .returning()
    return stats
  }

  async function createMatch(
    venueId: string,
    sportId: string,
    player1Id: string,
    player2Id: string,
    overrides: Partial<typeof matches.$inferInsert> = {}
  ) {
    const [match] = await testDb
      .insert(matches)
      .values({
        venueId,
        sportId,
        player1Id,
        player2Id,
        status: 'in_progress',
        ...overrides,
      })
      .returning()
    return match
  }

  async function createChallenge(
    venueId: string,
    sportId: string,
    overrides: Partial<typeof challenges.$inferInsert> = {}
  ) {
    const [challenge] = await testDb
      .insert(challenges)
      .values({
        venueId,
        sportId,
        name: 'Test Challenge',
        description: 'Test description',
        instructions: 'Test instructions',
        challengeType: 'free_throw',
        xpReward: 100,
        rpReward: 10,
        difficulty: 'medium',
        isActive: true,
        ...overrides,
      })
      .returning()
    return challenge
  }

  describe('Match Completion Triggers', () => {
    it('should unlock items when match completion reaches required matches', async () => {
      // Setup
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const player1 = await createUser('player1@test.com', 'Player 1', city.id)
      const player2 = await createUser('player2@test.com', 'Player 2', city.id)
      const sport = await createSport()
      const venue = await createVenue('Test Court', city.id)

      // Create item that requires 5 matches
      const item = await createItem({ name: '5 Match Jersey', requiredMatches: 5 })

      // Player 1 has 4 matches (will be 5 after this match)
      await createPlayerStats(player1.id, sport.id, { matchesPlayed: 4 })
      await createPlayerStats(player2.id, sport.id, { matchesPlayed: 2 })

      // Create match with scores set, player2 already agreed
      const match = await createMatch(venue.id, sport.id, player1.id, player2.id, {
        status: 'in_progress',
        player1Score: 10,
        player2Score: 8,
        winnerId: player1.id,
        player2Agreed: true,
      })

      // Player 1 agrees to complete the match
      const result = await agreeToMatchResult(testDb, match.id, player1.id)

      expect(result.success).toBe(true)
      expect(result.message).toBe('Match completed!')
      expect(result.newlyUnlockedItems).toBeDefined()
      expect(result.newlyUnlockedItems).toHaveLength(1)
      expect(result.newlyUnlockedItems![0].name).toBe('5 Match Jersey')

      // Verify item is unlocked in DB
      const [unlocked] = await testDb
        .select()
        .from(userUnlockedItems)
        .where(eq(userUnlockedItems.userId, player1.id))

      expect(unlocked).toBeDefined()
      expect(unlocked.itemId).toBe(item.id)
      expect(unlocked.unlockedVia).toBe('achievement')
    })

    it('should not unlock items when requirements not met', async () => {
      // Setup
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const player1 = await createUser('player1@test.com', 'Player 1', city.id)
      const player2 = await createUser('player2@test.com', 'Player 2', city.id)
      const sport = await createSport()
      const venue = await createVenue('Test Court', city.id)

      // Create item that requires 10 matches
      await createItem({ name: '10 Match Jersey', requiredMatches: 10 })

      // Player 1 has 2 matches (will be 3 after this match - not enough)
      await createPlayerStats(player1.id, sport.id, { matchesPlayed: 2 })
      await createPlayerStats(player2.id, sport.id, { matchesPlayed: 2 })

      // Create match with scores set, player2 already agreed
      const match = await createMatch(venue.id, sport.id, player1.id, player2.id, {
        status: 'in_progress',
        player1Score: 10,
        player2Score: 8,
        winnerId: player1.id,
        player2Agreed: true,
      })

      // Player 1 agrees to complete the match
      const result = await agreeToMatchResult(testDb, match.id, player1.id)

      expect(result.success).toBe(true)
      expect(result.newlyUnlockedItems).toBeUndefined()

      // Verify no items unlocked in DB
      const unlocked = await testDb
        .select()
        .from(userUnlockedItems)
        .where(eq(userUnlockedItems.userId, player1.id))

      expect(unlocked).toHaveLength(0)
    })
  })

  describe('Challenge Completion Triggers', () => {
    it('should unlock items when challenge completion reaches required challenges', async () => {
      // Setup
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const user = await createUser('player@test.com', 'Player', city.id)
      const sport = await createSport()
      const venue = await createVenue('Test Court', city.id)

      // Create item that requires 3 challenges
      const item = await createItem({ name: '3 Challenge Jersey', requiredChallenges: 3 })

      // User has 2 challenges (will be 3 after this challenge)
      await createPlayerStats(user.id, sport.id, { challengesCompleted: 2 })

      // Create challenge
      const challenge = await createChallenge(venue.id, sport.id)

      // Complete the challenge
      const result = await recordChallengeAttempt(testDb, user.id, challenge.id, 8, 10)

      expect(result.success).toBe(true)
      expect(result.newlyUnlockedItems).toBeDefined()
      expect(result.newlyUnlockedItems).toHaveLength(1)
      expect(result.newlyUnlockedItems![0].name).toBe('3 Challenge Jersey')

      // Verify item is unlocked in DB
      const [unlocked] = await testDb
        .select()
        .from(userUnlockedItems)
        .where(eq(userUnlockedItems.userId, user.id))

      expect(unlocked).toBeDefined()
      expect(unlocked.itemId).toBe(item.id)
      expect(unlocked.unlockedVia).toBe('achievement')
    })

    it('should unlock items when XP threshold is reached', async () => {
      // Setup
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const user = await createUser('player@test.com', 'Player', city.id)
      const sport = await createSport()
      const venue = await createVenue('Test Court', city.id)

      // Create item that requires 500 XP
      const item = await createItem({ name: '500 XP Jersey', requiredXp: 500 })

      // User has 450 XP (challenge rewards ~75 XP at 100% with medium difficulty)
      await createPlayerStats(user.id, sport.id, { totalXp: 450 })

      // Create challenge with 100 XP reward
      const challenge = await createChallenge(venue.id, sport.id, { xpReward: 100 })

      // Complete the challenge with 100% accuracy (earns 150 XP with medium 1.5x multiplier)
      const result = await recordChallengeAttempt(testDb, user.id, challenge.id, 10, 10)

      expect(result.success).toBe(true)
      expect(result.newlyUnlockedItems).toBeDefined()
      expect(result.newlyUnlockedItems).toHaveLength(1)
      expect(result.newlyUnlockedItems![0].name).toBe('500 XP Jersey')

      // Verify item is unlocked in DB
      const [unlocked] = await testDb
        .select()
        .from(userUnlockedItems)
        .where(eq(userUnlockedItems.userId, user.id))

      expect(unlocked).toBeDefined()
      expect(unlocked.itemId).toBe(item.id)
    })

    it('should unlock multiple items at once', async () => {
      // Setup
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const user = await createUser('player@test.com', 'Player', city.id)
      const sport = await createSport()
      const venue = await createVenue('Test Court', city.id)

      // Create multiple items with different requirements
      await createItem({ name: 'Challenge Jersey', requiredChallenges: 1 })
      await createItem({ name: 'XP Jersey', requiredXp: 100 })

      // User has no stats yet (first challenge)
      // Challenge will give: 1 challengesCompleted, ~150 XP (100 base * 1.5 medium)

      // Create challenge with 100 XP reward
      const challenge = await createChallenge(venue.id, sport.id, { xpReward: 100 })

      // Complete the challenge with 100% accuracy
      const result = await recordChallengeAttempt(testDb, user.id, challenge.id, 10, 10)

      expect(result.success).toBe(true)
      expect(result.newlyUnlockedItems).toBeDefined()
      expect(result.newlyUnlockedItems).toHaveLength(2)

      const unlockedNames = result.newlyUnlockedItems!.map((i) => i.name)
      expect(unlockedNames).toContain('Challenge Jersey')
      expect(unlockedNames).toContain('XP Jersey')
    })
  })
})
