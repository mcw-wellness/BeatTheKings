/**
 * Database seed script
 * Run with: npx tsx src/db/seed.ts
 *
 * This script is IDEMPOTENT - running it multiple times is safe
 * It preserves: users, avatars
 * It resets: everything else (stats, items, venues, challenges, etc.)
 */

import 'dotenv/config'
import { randomUUID } from 'crypto'
import { eq, and } from 'drizzle-orm'
import { getDb } from './index'
import {
  sports,
  countries,
  cities,
  venues,
  playerStats,
  challenges,
  challengeAttempts,
  activePlayers,
  avatarItems,
  userUnlockedItems,
  avatarEquipments,
  matches,
} from './schema'

// Austria cities (all major cities and district capitals)
const AUSTRIA_CITIES = [
  'Vienna',
  'St. Pölten',
  'Wiener Neustadt',
  'Baden',
  'Krems',
  'Amstetten',
  'Mödling',
  'Klosterneuburg',
  'Linz',
  'Wels',
  'Steyr',
  'Leonding',
  'Traun',
  'Salzburg',
  'Hallein',
  'Saalfelden',
  'Innsbruck',
  'Kufstein',
  'Schwaz',
  'Hall in Tirol',
  'Bregenz',
  'Dornbirn',
  'Feldkirch',
  'Bludenz',
  'Graz',
  'Leoben',
  'Kapfenberg',
  'Bruck an der Mur',
  'Klagenfurt',
  'Villach',
  'Wolfsberg',
  'Spittal an der Drau',
  'Eisenstadt',
  'Oberwart',
  'Neusiedl am See',
]

// Avatar items catalog with unlock requirements
const AVATAR_ITEMS_CATALOG = [
  // DEFAULT ITEMS (Always available)
  { name: 'Default Jersey', itemType: 'jersey', isDefault: true },
  { name: 'Default Shorts', itemType: 'shorts', isDefault: true },
  { name: 'Default Shoes', itemType: 'shoes', isDefault: true },

  // JERSEYS - Unlockable
  { name: 'Pro Jersey', itemType: 'jersey', requiredMatches: 10 },
  { name: 'Elite Jersey', itemType: 'jersey', requiredMatches: 25 },
  { name: 'Champion Jersey', itemType: 'jersey', requiredMatches: 50 },
  { name: 'Golden Jersey', itemType: 'jersey', requiredChallenges: 13 },
  { name: 'Legend Jersey', itemType: 'jersey', requiredXp: 2500 },
  { name: 'Premium Jersey', itemType: 'jersey', rpCost: 500 },
  { name: 'Recruiter Jersey', itemType: 'jersey', requiredInvites: 1 },
  { name: 'Ambassador Jersey', itemType: 'jersey', requiredInvites: 3 },
  { name: 'Influencer Jersey', itemType: 'jersey', requiredInvites: 10 },

  // SHORTS - Unlockable
  { name: 'Pro Shorts', itemType: 'shorts', requiredMatches: 10 },
  { name: 'Elite Shorts', itemType: 'shorts', requiredMatches: 25 },
  { name: 'Champion Shorts', itemType: 'shorts', requiredMatches: 50 },
  { name: 'Golden Shorts', itemType: 'shorts', requiredChallenges: 13 },
  { name: 'Legend Shorts', itemType: 'shorts', requiredXp: 2500 },
  { name: 'Premium Shorts', itemType: 'shorts', rpCost: 500 },
  { name: 'Challenger Shorts', itemType: 'shorts', requiredChallenges: 5 },

  // SHOES - Unlockable
  { name: 'Pro Shoes', itemType: 'shoes', requiredMatches: 10 },
  { name: 'Elite Shoes', itemType: 'shoes', requiredMatches: 25 },
  { name: 'Champion Shoes', itemType: 'shoes', requiredMatches: 50 },
  { name: 'Golden Shoes', itemType: 'shoes', requiredChallenges: 5 },
  { name: 'Diamond Shoes', itemType: 'shoes', requiredChallenges: 13 },
  { name: 'Legend Shoes', itemType: 'shoes', requiredXp: 2500 },
  { name: 'Premium Shoes', itemType: 'shoes', rpCost: 500 },
  { name: 'Starter Shoes', itemType: 'shoes', requiredChallenges: 1 },
]

// Vienna venues with coordinates
const VIENNA_VENUES = [
  { name: 'Esterhazy Park', lat: 48.1975, lng: 16.3531, district: '6. Bezirk' },
  { name: 'Schönborn Park', lat: 48.2124, lng: 16.3506, district: '8. Bezirk' },
  { name: 'Weghuber Park', lat: 48.2063, lng: 16.3552, district: '7. Bezirk' },
]

// Challenge definitions
const CHALLENGE_TYPES = [
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

async function seed() {
  console.log('🌱 Starting database seed...\n')

  const db = getDb()

  // ===========================================
  // STEP 1: Clean up data (preserve users & avatars)
  // ===========================================
  console.log('🧹 Cleaning up existing data (preserving users & avatars)...')

  // Delete in FK order (children first)
  await db.delete(activePlayers)
  await db.delete(challengeAttempts)
  await db.delete(matches)
  await db.delete(playerStats)
  await db.delete(avatarEquipments)
  await db.delete(userUnlockedItems)
  await db.delete(challenges)
  await db.delete(venues)
  await db.delete(avatarItems)

  console.log('✅ Cleanup complete\n')

  // ===========================================
  // STEP 2: Seed sports
  // ===========================================
  console.log('🏀 Adding sports...')

  const existingSports = await db.select({ slug: sports.slug }).from(sports)
  const existingSlugs = new Set(existingSports.map((s) => s.slug))

  const sportsToAdd = [
    { name: 'Basketball', slug: 'basketball' },
    { name: 'Soccer', slug: 'soccer' },
  ].filter((s) => !existingSlugs.has(s.slug))

  if (sportsToAdd.length > 0) {
    await db
      .insert(sports)
      .values(sportsToAdd.map((s) => ({ id: randomUUID(), ...s, isActive: true })))
  }
  console.log(`✅ Sports ready (${2 - sportsToAdd.length} existed, ${sportsToAdd.length} added)\n`)

  // ===========================================
  // STEP 3: Seed avatar items
  // ===========================================
  console.log('👕 Adding avatar items...')

  await db
    .insert(avatarItems)
    .values(AVATAR_ITEMS_CATALOG.map((item) => ({ id: randomUUID(), ...item })))

  console.log(`✅ ${AVATAR_ITEMS_CATALOG.length} avatar items added\n`)

  // ===========================================
  // STEP 4: Seed countries & cities
  // ===========================================
  console.log('🌍 Adding countries & cities...')

  // Check if Austria exists
  let [austria] = await db
    .select({ id: countries.id })
    .from(countries)
    .where(eq(countries.code, 'AT'))
    .limit(1)

  if (!austria) {
    const [newCountry] = await db
      .insert(countries)
      .values({ id: randomUUID(), name: 'Austria', code: 'AT' })
      .returning()
    austria = newCountry
  }

  // Add cities (check each one)
  const existingCities = await db
    .select({ name: cities.name })
    .from(cities)
    .where(eq(cities.countryId, austria.id))

  const existingCityNames = new Set(existingCities.map((c) => c.name))
  const citiesToAdd = AUSTRIA_CITIES.filter((c) => !existingCityNames.has(c))

  if (citiesToAdd.length > 0) {
    await db
      .insert(cities)
      .values(citiesToAdd.map((name) => ({ id: randomUUID(), name, countryId: austria.id })))
  }

  console.log(`✅ Austria with ${AUSTRIA_CITIES.length} cities ready (${citiesToAdd.length} new)\n`)

  // ===========================================
  // STEP 5: Seed venues
  // ===========================================
  console.log('🏟️ Adding venues...')

  const [vienna] = await db
    .select({ id: cities.id })
    .from(cities)
    .where(and(eq(cities.name, 'Vienna'), eq(cities.countryId, austria.id)))
    .limit(1)

  if (vienna) {
    await db.insert(venues).values(
      VIENNA_VENUES.map((v) => ({
        id: randomUUID(),
        name: v.name,
        cityId: vienna.id,
        latitude: v.lat,
        longitude: v.lng,
        district: v.district,
        isActive: true,
      }))
    )
    console.log(`✅ ${VIENNA_VENUES.length} venues added\n`)
  }

  // ===========================================
  // STEP 6: Seed challenges
  // ===========================================
  console.log('🎯 Adding challenges...')

  const [basketball] = await db
    .select({ id: sports.id })
    .from(sports)
    .where(eq(sports.slug, 'basketball'))
    .limit(1)

  if (vienna && basketball) {
    const venueList = await db
      .select({ id: venues.id })
      .from(venues)
      .where(eq(venues.cityId, vienna.id))

    const challengeValues = []
    for (const venue of venueList) {
      for (const challenge of CHALLENGE_TYPES) {
        challengeValues.push({
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
      }
    }

    if (challengeValues.length > 0) {
      await db.insert(challenges).values(challengeValues)
    }

    console.log(`✅ ${challengeValues.length} challenges added\n`)
  }

  console.log('🎉 Seeding complete!')
  process.exit(0)
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
