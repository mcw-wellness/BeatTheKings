/**
 * King System Integration Tests
 * Tests for city and country king calculations
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { createTestDb, closeTestDb, clearTestDb, type TestDatabase } from '@/db/test-utils'
import { users, playerStats, sports, cities, countries } from '@/db/schema'
import { isKingOfCity, isKingOfCountry, getTrumpCardData } from '@/lib/trump-card'
import { eq, and } from 'drizzle-orm'

describe('King System Integration Tests', () => {
  let testDb: TestDatabase

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

  async function createCity(name: string, countryId: string) {
    const [city] = await testDb.insert(cities).values({ name, countryId }).returning()
    return city
  }

  async function createUser(
    email: string,
    name: string,
    cityId: string,
    ageGroup: string = '18-30'
  ) {
    const [user] = await testDb
      .insert(users)
      .values({ email, name, cityId, ageGroup, hasCreatedAvatar: true })
      .returning()
    return user
  }

  async function createSport(name = 'Basketball', slug = 'basketball') {
    const [sport] = await testDb.insert(sports).values({ name, slug, isActive: true }).returning()
    return sport
  }

  async function createPlayerStats(userId: string, sportId: string, xp: number) {
    const [stats] = await testDb
      .insert(playerStats)
      .values({
        userId,
        sportId,
        totalXp: xp,
        totalRp: 0,
        availableRp: 0,
        matchesPlayed: 0,
        matchesWon: 0,
        matchesLost: 0,
        challengesCompleted: 0,
        totalPointsScored: 0,
        usersInvited: 0,
      })
      .returning()
    return stats
  }

  describe('isKingOfCity', () => {
    it('should return true when player has highest XP in their city', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const sport = await createSport()

      // Create players in same city, same age group
      const king = await createUser('king@test.com', 'King Player', city.id, '18-30')
      const player2 = await createUser('player2@test.com', 'Player 2', city.id, '18-30')

      await createPlayerStats(king.id, sport.id, 5000) // Highest XP
      await createPlayerStats(player2.id, sport.id, 3000)

      const result = await isKingOfCity(testDb, king.id, sport.id)

      expect(result.isKing).toBe(true)
      expect(result.cityName).toBe('Vienna')
    })

    it('should return false when player does not have highest XP in city', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const sport = await createSport()

      const king = await createUser('king@test.com', 'King Player', city.id, '18-30')
      const notKing = await createUser('notking@test.com', 'Not King', city.id, '18-30')

      await createPlayerStats(king.id, sport.id, 5000)
      await createPlayerStats(notKing.id, sport.id, 3000) // Lower XP

      const result = await isKingOfCity(testDb, notKing.id, sport.id)

      expect(result.isKing).toBe(false)
      expect(result.cityName).toBe('Vienna')
    })

    it('should only compare players in same age group', async () => {
      const country = await createCountry()
      const city = await createCity('Vienna', country.id)
      const sport = await createSport()

      // Different age groups
      const youngKing = await createUser('young@test.com', 'Young King', city.id, '18-30')
      const oldPlayer = await createUser('old@test.com', 'Old Player', city.id, '31+')

      await createPlayerStats(youngKing.id, sport.id, 3000)
      await createPlayerStats(oldPlayer.id, sport.id, 10000) // Higher XP but different age group

      const youngResult = await isKingOfCity(testDb, youngKing.id, sport.id)
      const oldResult = await isKingOfCity(testDb, oldPlayer.id, sport.id)

      // Both should be kings of their respective age groups
      expect(youngResult.isKing).toBe(true)
      expect(oldResult.isKing).toBe(true)
    })

    it('should return false when user does not exist', async () => {
      const sport = await createSport()

      // Use valid UUID format for non-existent user
      const nonExistentUserId = '00000000-0000-0000-0000-000000000000'
      const result = await isKingOfCity(testDb, nonExistentUserId, sport.id)

      expect(result.isKing).toBe(false)
      expect(result.cityName).toBeNull()
    })
  })

  describe('isKingOfCountry', () => {
    it('should return true when player has highest XP in their country', async () => {
      const country = await createCountry('Austria', 'AT')
      const vienna = await createCity('Vienna', country.id)
      const salzburg = await createCity('Salzburg', country.id)
      const sport = await createSport()

      // Create players in different cities but same country
      const king = await createUser('king@test.com', 'King Player', vienna.id, '18-30')
      const player2 = await createUser('player2@test.com', 'Player 2', salzburg.id, '18-30')

      await createPlayerStats(king.id, sport.id, 5000) // Highest XP
      await createPlayerStats(player2.id, sport.id, 3000)

      const result = await isKingOfCountry(testDb, king.id, sport.id)

      expect(result.isKing).toBe(true)
      expect(result.countryName).toBe('Austria')
    })

    it('should return false when player does not have highest XP in country', async () => {
      const country = await createCountry('Austria', 'AT')
      const vienna = await createCity('Vienna', country.id)
      const salzburg = await createCity('Salzburg', country.id)
      const sport = await createSport()

      const king = await createUser('king@test.com', 'King Player', vienna.id, '18-30')
      const notKing = await createUser('notking@test.com', 'Not King', salzburg.id, '18-30')

      await createPlayerStats(king.id, sport.id, 5000)
      await createPlayerStats(notKing.id, sport.id, 3000) // Lower XP

      const result = await isKingOfCountry(testDb, notKing.id, sport.id)

      expect(result.isKing).toBe(false)
      expect(result.countryName).toBe('Austria')
    })

    it('should only compare players in same country and age group', async () => {
      const austria = await createCountry('Austria', 'AT')
      const germany = await createCountry('Germany', 'DE')
      const vienna = await createCity('Vienna', austria.id)
      const berlin = await createCity('Berlin', germany.id)
      const sport = await createSport()

      // Players in different countries
      const austriaKing = await createUser('austria@test.com', 'Austria King', vienna.id, '18-30')
      const germanyPlayer = await createUser(
        'germany@test.com',
        'Germany Player',
        berlin.id,
        '18-30'
      )

      await createPlayerStats(austriaKing.id, sport.id, 3000)
      await createPlayerStats(germanyPlayer.id, sport.id, 10000) // Higher XP but different country

      const austriaResult = await isKingOfCountry(testDb, austriaKing.id, sport.id)
      const germanyResult = await isKingOfCountry(testDb, germanyPlayer.id, sport.id)

      // Both should be kings of their respective countries
      expect(austriaResult.isKing).toBe(true)
      expect(austriaResult.countryName).toBe('Austria')
      expect(germanyResult.isKing).toBe(true)
      expect(germanyResult.countryName).toBe('Germany')
    })
  })

  describe('getTrumpCardData crowns', () => {
    it('should return correct king status for all levels', async () => {
      const country = await createCountry('Austria', 'AT')
      const city = await createCity('Vienna', country.id)
      const sport = await createSport()

      const king = await createUser('king@test.com', 'King Player', city.id, '18-30')
      await createPlayerStats(king.id, sport.id, 5000)

      const trumpCard = await getTrumpCardData(testDb, king.id, 'basketball')

      expect(trumpCard).not.toBeNull()
      expect(trumpCard!.crowns.isKingOfCity).toBe(true)
      expect(trumpCard!.crowns.isKingOfCountry).toBe(true)
      expect(trumpCard!.crowns.cityName).toBe('Vienna')
      expect(trumpCard!.crowns.countryName).toBe('Austria')
    })

    it('should return false for king status when not the highest XP', async () => {
      const country = await createCountry('Austria', 'AT')
      const city = await createCity('Vienna', country.id)
      const sport = await createSport()

      const king = await createUser('king@test.com', 'King Player', city.id, '18-30')
      const notKing = await createUser('notking@test.com', 'Not King', city.id, '18-30')

      await createPlayerStats(king.id, sport.id, 5000)
      await createPlayerStats(notKing.id, sport.id, 3000)

      const trumpCard = await getTrumpCardData(testDb, notKing.id, 'basketball')

      expect(trumpCard).not.toBeNull()
      expect(trumpCard!.crowns.isKingOfCity).toBe(false)
      expect(trumpCard!.crowns.isKingOfCountry).toBe(false)
      expect(trumpCard!.crowns.cityName).toBe('Vienna')
      expect(trumpCard!.crowns.countryName).toBe('Austria')
    })

    it('should handle king transfer when XP changes', async () => {
      const country = await createCountry('Austria', 'AT')
      const city = await createCity('Vienna', country.id)
      const sport = await createSport()

      const player1 = await createUser('player1@test.com', 'Player 1', city.id, '18-30')
      const player2 = await createUser('player2@test.com', 'Player 2', city.id, '18-30')

      // Initially player1 is king
      await testDb.insert(playerStats).values({
        userId: player1.id,
        sportId: sport.id,
        totalXp: 5000,
        totalRp: 0,
        availableRp: 0,
        matchesPlayed: 0,
        matchesWon: 0,
        matchesLost: 0,
        challengesCompleted: 0,
        totalPointsScored: 0,
        usersInvited: 0,
      })

      await createPlayerStats(player2.id, sport.id, 3000)

      // Verify player1 is king
      let card1 = await getTrumpCardData(testDb, player1.id, 'basketball')
      let card2 = await getTrumpCardData(testDb, player2.id, 'basketball')

      expect(card1!.crowns.isKingOfCity).toBe(true)
      expect(card2!.crowns.isKingOfCity).toBe(false)

      // Player2 gains XP and surpasses player1
      await testDb
        .update(playerStats)
        .set({ totalXp: 6000 })
        .where(and(eq(playerStats.userId, player2.id), eq(playerStats.sportId, sport.id)))

      // Verify crown transferred automatically
      card1 = await getTrumpCardData(testDb, player1.id, 'basketball')
      card2 = await getTrumpCardData(testDb, player2.id, 'basketball')

      expect(card1!.crowns.isKingOfCity).toBe(false)
      expect(card2!.crowns.isKingOfCity).toBe(true)
    })
  })
})
