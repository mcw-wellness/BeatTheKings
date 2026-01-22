/**
 * Integration tests for 1v1 Active Venues API
 * Tests with real database operations using PGLite
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import {
  createTestDb,
  closeTestDb,
  clearTestDb,
  testFactories,
  type TestDatabase,
} from '@/db/test-utils'
import { getVenuesWithActivePlayers } from '@/lib/venues'
import { activePlayers } from '@/db/schema'

describe('1v1 Active Venues - Integration Tests', () => {
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

  async function setupTestData() {
    const { city } = await testFactories.createCountryWithCity(db, {
      countryName: 'Austria',
      countryCode: 'AT',
      cityName: 'Vienna',
    })

    const venue1 = await testFactories.createVenue(db, city.id, {
      name: 'Donaupark Court',
      latitude: 48.235,
      longitude: 16.41,
    })

    const venue2 = await testFactories.createVenue(db, city.id, {
      name: 'Prater Sports',
      latitude: 48.215,
      longitude: 16.4,
    })

    const sport = await testFactories.createSport(db, { name: 'Basketball', slug: 'basketball' })

    const user1 = await testFactories.createUser(db, {
      email: 'player1@test.com',
      name: 'Player One',
    })
    const user2 = await testFactories.createUser(db, {
      email: 'player2@test.com',
      name: 'Player Two',
    })
    const user3 = await testFactories.createUser(db, {
      email: 'player3@test.com',
      name: 'Player Three',
    })
    const currentUser = await testFactories.createUser(db, {
      email: 'current@test.com',
      name: 'Current User',
    })

    // Create player stats
    await testFactories.createPlayerStats(db, user1.id, sport.id, { totalXp: 500 })
    await testFactories.createPlayerStats(db, user2.id, sport.id, { totalXp: 300 })
    await testFactories.createPlayerStats(db, user3.id, sport.id, { totalXp: 100 })
    await testFactories.createPlayerStats(db, currentUser.id, sport.id, { totalXp: 200 })

    return { venue1, venue2, user1, user2, user3, currentUser, city, sport }
  }

  it('should return empty when no active players at any venue', async () => {
    await setupTestData()

    const result = await getVenuesWithActivePlayers(db, {
      userLat: 48.2082,
      userLng: 16.3738,
    })

    expect(result.venues).toHaveLength(0)
    expect(result.totalActiveVenues).toBe(0)
  })

  it('should return venues with active players sorted by distance', async () => {
    const { venue1, venue2, user1, user2 } = await setupTestData()

    // Add active players
    await db.insert(activePlayers).values([
      { userId: user1.id, venueId: venue1.id, latitude: 48.235, longitude: 16.41 },
      { userId: user2.id, venueId: venue2.id, latitude: 48.215, longitude: 16.4 },
    ])

    // User location closer to venue2 (Prater Sports)
    const result = await getVenuesWithActivePlayers(db, {
      userLat: 48.215,
      userLng: 16.4,
    })

    expect(result.venues).toHaveLength(2)
    expect(result.totalActiveVenues).toBe(2)
    // Closest venue should be first
    expect(result.venues[0].name).toBe('Prater Sports')
  })

  it('should exclude current user from active players', async () => {
    const { venue1, user1, currentUser } = await setupTestData()

    // Add both users as active at same venue
    await db.insert(activePlayers).values([
      { userId: user1.id, venueId: venue1.id, latitude: 48.235, longitude: 16.41 },
      { userId: currentUser.id, venueId: venue1.id, latitude: 48.235, longitude: 16.41 },
    ])

    const result = await getVenuesWithActivePlayers(db, {
      userLat: 48.2082,
      userLng: 16.3738,
      excludeUserId: currentUser.id,
    })

    expect(result.venues).toHaveLength(1)
    expect(result.venues[0].activePlayerCount).toBe(1)
    expect(result.venues[0].activePlayers).not.toContainEqual(
      expect.objectContaining({ id: currentUser.id })
    )
  })

  it('should filter out venues where current user is the only active player', async () => {
    const { venue1, currentUser } = await setupTestData()

    // Only current user active at venue
    await db
      .insert(activePlayers)
      .values([{ userId: currentUser.id, venueId: venue1.id, latitude: 48.235, longitude: 16.41 }])

    const result = await getVenuesWithActivePlayers(db, {
      userLat: 48.2082,
      userLng: 16.3738,
      excludeUserId: currentUser.id,
    })

    expect(result.venues).toHaveLength(0)
  })

  it('should limit active player previews to 3', async () => {
    const { venue1, user1, user2, user3, currentUser } = await setupTestData()

    // Add 4 active players (excluding current user, there will be 3)
    await db.insert(activePlayers).values([
      { userId: user1.id, venueId: venue1.id, latitude: 48.235, longitude: 16.41 },
      { userId: user2.id, venueId: venue1.id, latitude: 48.235, longitude: 16.41 },
      { userId: user3.id, venueId: venue1.id, latitude: 48.235, longitude: 16.41 },
      { userId: currentUser.id, venueId: venue1.id, latitude: 48.235, longitude: 16.41 },
    ])

    const result = await getVenuesWithActivePlayers(db, {
      userLat: 48.2082,
      userLng: 16.3738,
      excludeUserId: currentUser.id,
    })

    expect(result.venues[0].activePlayers).toHaveLength(3)
    expect(result.venues[0].activePlayerCount).toBe(3)
  })

  it('should respect limit parameter', async () => {
    const { venue1, venue2, user1, user2 } = await setupTestData()

    await db.insert(activePlayers).values([
      { userId: user1.id, venueId: venue1.id, latitude: 48.235, longitude: 16.41 },
      { userId: user2.id, venueId: venue2.id, latitude: 48.215, longitude: 16.4 },
    ])

    const result = await getVenuesWithActivePlayers(db, {
      userLat: 48.2082,
      userLng: 16.3738,
      limit: 1,
    })

    expect(result.venues).toHaveLength(1)
    expect(result.totalActiveVenues).toBe(2)
  })

  it('should sort active players by XP (highest first)', async () => {
    const { venue1, user1, user2, user3 } = await setupTestData()

    await db.insert(activePlayers).values([
      { userId: user1.id, venueId: venue1.id, latitude: 48.235, longitude: 16.41 },
      { userId: user2.id, venueId: venue1.id, latitude: 48.235, longitude: 16.41 },
      { userId: user3.id, venueId: venue1.id, latitude: 48.235, longitude: 16.41 },
    ])

    const result = await getVenuesWithActivePlayers(db, {
      userLat: 48.2082,
      userLng: 16.3738,
    })

    // User1 has 500 XP, user2 has 300 XP, user3 has 100 XP
    expect(result.venues[0].activePlayers[0].id).toBe(user1.id)
    expect(result.venues[0].activePlayers[1].id).toBe(user2.id)
    expect(result.venues[0].activePlayers[2].id).toBe(user3.id)
  })

  it('should format distance correctly', async () => {
    const { venue1, user1 } = await setupTestData()

    await db
      .insert(activePlayers)
      .values([{ userId: user1.id, venueId: venue1.id, latitude: 48.235, longitude: 16.41 }])

    const result = await getVenuesWithActivePlayers(db, {
      userLat: 48.2082,
      userLng: 16.3738,
    })

    expect(result.venues[0].distanceFormatted).toMatch(/^\d+(\.\d+)?\s*(m|km)$/)
  })

  it('should return avatar URLs for active players', async () => {
    const { venue1, user1 } = await setupTestData()

    await db
      .insert(activePlayers)
      .values([{ userId: user1.id, venueId: venue1.id, latitude: 48.235, longitude: 16.41 }])

    const result = await getVenuesWithActivePlayers(db, {
      userLat: 48.2082,
      userLng: 16.3738,
    })

    expect(result.venues[0].activePlayers[0].avatarUrl).toBeDefined()
    expect(typeof result.venues[0].activePlayers[0].avatarUrl).toBe('string')
  })
})
