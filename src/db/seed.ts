/**
 * Database seed script
 * Run with: npx tsx src/db/seed.ts
 */

import 'dotenv/config'
import { randomUUID } from 'crypto'
import { eq, and, inArray } from 'drizzle-orm'
import { getDb } from './index'
import {
  sports,
  countries,
  cities,
  venues,
  users,
  avatars,
  playerStats,
  challenges,
  activePlayers,
  avatarItems,
  userUnlockedItems,
  avatarEquipments,
} from './schema'

// Austria cities (all major cities and district capitals)
const AUSTRIA_CITIES = [
  // Vienna (capital)
  'Vienna',
  // Lower Austria
  'St. Pölten',
  'Wiener Neustadt',
  'Baden',
  'Krems',
  'Amstetten',
  'Mödling',
  'Klosterneuburg',
  // Upper Austria
  'Linz',
  'Wels',
  'Steyr',
  'Leonding',
  'Traun',
  // Salzburg
  'Salzburg',
  'Hallein',
  'Saalfelden',
  // Tyrol
  'Innsbruck',
  'Kufstein',
  'Schwaz',
  'Hall in Tirol',
  // Vorarlberg
  'Bregenz',
  'Dornbirn',
  'Feldkirch',
  'Bludenz',
  // Styria
  'Graz',
  'Leoben',
  'Kapfenberg',
  'Bruck an der Mur',
  // Carinthia
  'Klagenfurt',
  'Villach',
  'Wolfsberg',
  'Spittal an der Drau',
  // Burgenland
  'Eisenstadt',
  'Oberwart',
  'Neusiedl am See',
]

async function seed() {
  console.log('🌱 Seeding database...')

  const db = getDb()

  // Seed sports
  console.log('Adding sports...')
  await db
    .insert(sports)
    .values([
      { id: randomUUID(), name: 'Basketball', slug: 'basketball', isActive: true },
      { id: randomUUID(), name: 'Soccer', slug: 'soccer', isActive: true },
    ])
    .onConflictDoNothing()
  console.log('✅ Sports added')

  // Clean up duplicate avatar items (one-time cleanup)
  console.log('Checking for duplicate avatar items...')
  const allItems = await db
    .select({
      id: avatarItems.id,
      name: avatarItems.name,
      itemType: avatarItems.itemType,
      createdAt: avatarItems.createdAt,
    })
    .from(avatarItems)
    .orderBy(avatarItems.name, avatarItems.itemType, avatarItems.createdAt)

  // Group items by (name, itemType) to find duplicates
  const itemGroups = new Map<string, typeof allItems>()
  for (const item of allItems) {
    const key = `${item.name}:${item.itemType}`
    if (!itemGroups.has(key)) {
      itemGroups.set(key, [])
    }
    itemGroups.get(key)!.push(item)
  }

  // Find groups with duplicates
  let duplicatesRemoved = 0
  for (const [, items] of itemGroups) {
    if (items.length > 1) {
      // Keep the oldest item (first by createdAt)
      const itemToKeep = items[0]
      const itemsToDelete = items.slice(1)
      const idsToDelete = itemsToDelete.map((i) => i.id)

      console.log(
        `  Found ${items.length} duplicates of "${items[0].name}" (${items[0].itemType}), keeping oldest, removing ${idsToDelete.length}`
      )

      // Update foreign key references to point to the kept item
      for (const oldId of idsToDelete) {
        // Update userUnlockedItems
        await db
          .update(userUnlockedItems)
          .set({ itemId: itemToKeep.id })
          .where(eq(userUnlockedItems.itemId, oldId))

        // Update avatarEquipments for all item slots
        await db
          .update(avatarEquipments)
          .set({ jerseyItemId: itemToKeep.id })
          .where(eq(avatarEquipments.jerseyItemId, oldId))

        await db
          .update(avatarEquipments)
          .set({ shortsItemId: itemToKeep.id })
          .where(eq(avatarEquipments.shortsItemId, oldId))

        await db
          .update(avatarEquipments)
          .set({ shoesItemId: itemToKeep.id })
          .where(eq(avatarEquipments.shoesItemId, oldId))

        await db
          .update(avatarEquipments)
          .set({ accessoryItemId: itemToKeep.id })
          .where(eq(avatarEquipments.accessoryItemId, oldId))
      }

      // Now safe to delete duplicates
      await db.delete(avatarItems).where(inArray(avatarItems.id, idsToDelete))
      duplicatesRemoved += idsToDelete.length
    }
  }

  if (duplicatesRemoved > 0) {
    console.log(`✅ Removed ${duplicatesRemoved} duplicate avatar items`)
  } else {
    console.log('✅ No duplicate avatar items found')
  }

  // Seed avatar items catalog
  console.log('Adding avatar items catalog...')

  const avatarItemsCatalog = [
    // ===========================================
    // DEFAULT ITEMS (Always available)
    // ===========================================
    { name: 'Default Jersey', itemType: 'jersey', isDefault: true },
    { name: 'Default Shorts', itemType: 'shorts', isDefault: true },
    { name: 'Default Shoes', itemType: 'shoes', isDefault: true },

    // ===========================================
    // JERSEYS - Unlockable
    // ===========================================
    {
      name: 'Pro Jersey',
      itemType: 'jersey',
      requiredMatches: 10,
    },
    {
      name: 'Elite Jersey',
      itemType: 'jersey',
      requiredMatches: 25,
    },
    {
      name: 'Champion Jersey',
      itemType: 'jersey',
      requiredMatches: 50,
    },
    {
      name: 'Golden Jersey',
      itemType: 'jersey',
      requiredChallenges: 13,
    },
    {
      name: 'Legend Jersey',
      itemType: 'jersey',
      requiredXp: 2500,
    },
    {
      name: 'Premium Jersey',
      itemType: 'jersey',
      rpCost: 500,
    },

    // ===========================================
    // SHORTS - Unlockable
    // ===========================================
    {
      name: 'Pro Shorts',
      itemType: 'shorts',
      requiredMatches: 10,
    },
    {
      name: 'Elite Shorts',
      itemType: 'shorts',
      requiredMatches: 25,
    },
    {
      name: 'Champion Shorts',
      itemType: 'shorts',
      requiredMatches: 50,
    },
    {
      name: 'Golden Shorts',
      itemType: 'shorts',
      requiredChallenges: 13,
    },
    {
      name: 'Legend Shorts',
      itemType: 'shorts',
      requiredXp: 2500,
    },
    {
      name: 'Premium Shorts',
      itemType: 'shorts',
      rpCost: 500,
    },

    // ===========================================
    // SHOES - Unlockable
    // ===========================================
    {
      name: 'Pro Shoes',
      itemType: 'shoes',
      requiredMatches: 10,
    },
    {
      name: 'Elite Shoes',
      itemType: 'shoes',
      requiredMatches: 25,
    },
    {
      name: 'Champion Shoes',
      itemType: 'shoes',
      requiredMatches: 50,
    },
    {
      name: 'Golden Shoes',
      itemType: 'shoes',
      requiredChallenges: 5,
    },
    {
      name: 'Diamond Shoes',
      itemType: 'shoes',
      requiredChallenges: 13,
    },
    {
      name: 'Legend Shoes',
      itemType: 'shoes',
      requiredXp: 2500,
    },
    {
      name: 'Premium Shoes',
      itemType: 'shoes',
      rpCost: 500,
    },

    // ===========================================
    // SPECIAL UNLOCK ITEMS
    // ===========================================
    {
      name: 'Recruiter Jersey',
      itemType: 'jersey',
      requiredInvites: 1,
    },
    {
      name: 'Ambassador Jersey',
      itemType: 'jersey',
      requiredInvites: 3,
    },
    {
      name: 'Influencer Jersey',
      itemType: 'jersey',
      requiredInvites: 10,
    },
    {
      name: 'Starter Shoes',
      itemType: 'shoes',
      requiredChallenges: 1,
    },
    {
      name: 'Challenger Shorts',
      itemType: 'shorts',
      requiredChallenges: 5,
    },
  ]

  // Get existing items to avoid duplicates
  const existingItems = await db
    .select({ name: avatarItems.name, itemType: avatarItems.itemType })
    .from(avatarItems)

  const existingSet = new Set(existingItems.map((item) => `${item.name}:${item.itemType}`))

  // Filter out items that already exist
  const newItems = avatarItemsCatalog.filter(
    (item) => !existingSet.has(`${item.name}:${item.itemType}`)
  )

  if (newItems.length > 0) {
    await db.insert(avatarItems).values(
      newItems.map((item) => ({
        id: randomUUID(),
        ...item,
      }))
    )
    console.log(
      `✅ ${newItems.length} new avatar items added (${existingItems.length} already exist)`
    )
  } else {
    console.log(`✅ All ${existingItems.length} avatar items already exist, skipping`)
  }

  // Seed Austria
  console.log('Adding Austria...')
  const [country] = await db
    .insert(countries)
    .values([{ id: randomUUID(), name: 'Austria', code: 'AT' }])
    .onConflictDoNothing()
    .returning()

  let countryId = country?.id
  if (!countryId) {
    const [existing] = await db
      .select({ id: countries.id })
      .from(countries)
      .where(eq(countries.code, 'AT'))
      .limit(1)
    countryId = existing?.id
  }
  console.log('✅ Austria added')

  // Seed Austrian cities
  if (countryId) {
    console.log('Adding Austrian cities...')
    for (const cityName of AUSTRIA_CITIES) {
      await db
        .insert(cities)
        .values([{ id: randomUUID(), name: cityName, countryId }])
        .onConflictDoNothing()
    }
    console.log(`✅ ${AUSTRIA_CITIES.length} cities added`)
  }

  // Get Vienna city ID for venues
  const [vienna] = await db
    .select({ id: cities.id })
    .from(cities)
    .where(and(eq(cities.name, 'Vienna'), eq(cities.countryId, countryId!)))
    .limit(1)

  // Seed Vienna venues with real coordinates
  if (vienna) {
    console.log('Adding Vienna venues...')

    // Clear existing data (in FK order: activePlayers, challenges, then venues)
    await db.delete(activePlayers)
    await db.delete(challenges)
    await db.delete(venues)
    console.log('  Cleared existing venues, challenges, and active players')

    const viennaVenues = [
      { name: 'Esterhazy Park', lat: 48.1962, lng: 16.3551, district: '6. Bezirk' },
      { name: 'Schönborn Park', lat: 48.2108, lng: 16.3536, district: '8. Bezirk' },
      { name: 'Weghuber Park', lat: 48.2082, lng: 16.3574, district: '1. Bezirk' },
    ]

    for (const venue of viennaVenues) {
      await db
        .insert(venues)
        .values({
          id: randomUUID(),
          name: venue.name,
          cityId: vienna.id,
          latitude: venue.lat,
          longitude: venue.lng,
          district: venue.district,
          isActive: true,
        })
        .onConflictDoNothing()
    }
    console.log(`✅ ${viennaVenues.length} venues added`)
  }

  // Get basketball sport ID
  const [basketball] = await db
    .select({ id: sports.id })
    .from(sports)
    .where(eq(sports.slug, 'basketball'))
    .limit(1)

  // Seed challenges for each venue
  if (vienna && basketball) {
    console.log('Adding challenges to venues...')

    // Get all Vienna venues
    const vienueList = await db
      .select({ id: venues.id, name: venues.name })
      .from(venues)
      .where(eq(venues.cityId, vienna.id))

    // Challenge definitions (as per Beat The Kings.txt)
    const challengeTypes = [
      {
        name: '3-Point Shot',
        description: 'Make shots from beyond the 3-point line',
        instructions:
          'Stand behind the 3-point line. Tap +1 for each made shot, -1 for each miss. Try to get the highest accuracy!',
        challengeType: 'three_point',
        xpReward: 50,
        rpReward: 10,
        difficulty: 'medium',
      },
      {
        name: 'Free Throw',
        description: 'Practice your free throws',
        instructions:
          'Stand at the free throw line. Tap +1 for each made shot, -1 for each miss. Aim for 80% accuracy to earn RP!',
        challengeType: 'free_throw',
        xpReward: 30,
        rpReward: 5,
        difficulty: 'easy',
      },
      {
        name: 'Around the World',
        description: 'Make shots from 5 different positions around the key',
        instructions:
          'Start from the right corner, move to right wing, top of key, left wing, left corner. Tap +1 for made, -1 for miss at each position.',
        challengeType: 'around_the_world',
        xpReward: 100,
        rpReward: 20,
        difficulty: 'hard',
      },
    ]

    for (const venue of vienueList) {
      for (const challenge of challengeTypes) {
        await db
          .insert(challenges)
          .values({
            id: randomUUID(),
            venueId: venue.id,
            sportId: basketball.id,
            name: challenge.name,
            description: challenge.description,
            instructions: challenge.instructions,
            challengeType: challenge.challengeType,
            xpReward: challenge.xpReward,
            rpReward: challenge.rpReward,
            difficulty: challenge.difficulty,
            isActive: true,
          })
          .onConflictDoNothing()
      }
    }
    console.log(`✅ ${vienueList.length * challengeTypes.length} challenges added`)
  }

  // Seed test players with stats (for rankings demo)
  if (vienna && basketball) {
    console.log('Adding test players...')

    // Test players for different age groups
    const testPlayers = [
      // 18-30 age group players
      {
        email: 'king@test.com',
        name: 'Michael Jordan',
        gender: 'male',
        ageGroup: '18-30',
        xp: 5000,
      },
      {
        email: 'player2@test.com',
        name: 'LeBron James',
        gender: 'male',
        ageGroup: '18-30',
        xp: 4500,
      },
      {
        email: 'player3@test.com',
        name: 'Stephen Curry',
        gender: 'male',
        ageGroup: '18-30',
        xp: 4000,
      },
      {
        email: 'player4@test.com',
        name: 'Kevin Durant',
        gender: 'male',
        ageGroup: '18-30',
        xp: 3500,
      },
      {
        email: 'player5@test.com',
        name: 'Diana Taurasi',
        gender: 'female',
        ageGroup: '18-30',
        xp: 3000,
      },
      {
        email: 'player6@test.com',
        name: 'Candace Parker',
        gender: 'female',
        ageGroup: '18-30',
        xp: 2500,
      },
      {
        email: 'player7@test.com',
        name: 'Giannis A.',
        gender: 'male',
        ageGroup: '18-30',
        xp: 2000,
      },
      {
        email: 'player8@test.com',
        name: 'Luka Doncic',
        gender: 'male',
        ageGroup: '18-30',
        xp: 1500,
      },
      // 31+ age group players
      { email: 'senior1@test.com', name: 'Tim Duncan', gender: 'male', ageGroup: '31+', xp: 6000 },
      {
        email: 'senior2@test.com',
        name: 'Dirk Nowitzki',
        gender: 'male',
        ageGroup: '31+',
        xp: 5500,
      },
      { email: 'senior3@test.com', name: 'Sue Bird', gender: 'female', ageGroup: '31+', xp: 5000 },
      // Under-18 age group players
      {
        email: 'junior1@test.com',
        name: 'Victor Jr',
        gender: 'male',
        ageGroup: 'Under-18',
        xp: 2000,
      },
      {
        email: 'junior2@test.com',
        name: 'Caitlin Young',
        gender: 'female',
        ageGroup: 'Under-18',
        xp: 1800,
      },
    ]

    for (const player of testPlayers) {
      // Create user
      const [newUser] = await db
        .insert(users)
        .values({
          id: randomUUID(),
          email: player.email,
          name: player.name,
          gender: player.gender,
          ageGroup: player.ageGroup,
          cityId: vienna.id,
          hasCreatedAvatar: true,
        })
        .onConflictDoNothing()
        .returning()

      if (newUser) {
        // Create avatar
        await db
          .insert(avatars)
          .values({
            id: randomUUID(),
            userId: newUser.id,
            skinTone: 'medium',
            hairStyle: 'short',
            hairColor: 'black',
          })
          .onConflictDoNothing()

        // Create player stats
        await db
          .insert(playerStats)
          .values({
            id: randomUUID(),
            userId: newUser.id,
            sportId: basketball.id,
            totalXp: player.xp,
            totalRp: Math.floor(player.xp * 0.1),
            availableRp: Math.floor(player.xp * 0.05),
            matchesPlayed: Math.floor(player.xp / 100),
            matchesWon: Math.floor(player.xp / 150),
            matchesLost: Math.floor(player.xp / 300),
            challengesCompleted: Math.floor(player.xp / 200),
            totalPointsScored: player.xp * 2,
          })
          .onConflictDoNothing()
      }
    }
    console.log(`✅ ${testPlayers.length} test players added`)
  }

  console.log('🎉 Seeding complete!')
  process.exit(0)
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
