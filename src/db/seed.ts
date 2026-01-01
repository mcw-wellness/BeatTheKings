/**
 * Database seed script
 * Run with: npx tsx src/db/seed.ts
 */

import 'dotenv/config'
import { eq, and } from 'drizzle-orm'
import { getDb } from './index'
import { sports, countries, cities, venues, users, avatars, playerStats } from './schema'

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
      { name: 'Basketball', slug: 'basketball', isActive: true },
      { name: 'Soccer', slug: 'soccer', isActive: true },
    ])
    .onConflictDoNothing()
  console.log('✅ Sports added')

  // Seed Austria
  console.log('Adding Austria...')
  const [country] = await db
    .insert(countries)
    .values([{ name: 'Austria', code: 'AT' }])
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
        .values([{ name: cityName, countryId }])
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

  // Seed Vienna venues
  if (vienna) {
    console.log('Adding Vienna venues...')
    const viennaVenues = ['Esterhazy Park', 'Schönborn Park', 'Weghuber Park']

    for (const venueName of viennaVenues) {
      await db
        .insert(venues)
        .values({
          name: venueName,
          cityId: vienna.id,
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

  // Seed test players with stats (for rankings demo)
  if (vienna && basketball) {
    console.log('Adding test players...')

    // Test players for different age groups
    const testPlayers = [
      // 18-30 age group players
      { email: 'king@test.com', name: 'Michael Jordan', gender: 'male', ageGroup: '18-30', xp: 5000 },
      { email: 'player2@test.com', name: 'LeBron James', gender: 'male', ageGroup: '18-30', xp: 4500 },
      { email: 'player3@test.com', name: 'Stephen Curry', gender: 'male', ageGroup: '18-30', xp: 4000 },
      { email: 'player4@test.com', name: 'Kevin Durant', gender: 'male', ageGroup: '18-30', xp: 3500 },
      { email: 'player5@test.com', name: 'Diana Taurasi', gender: 'female', ageGroup: '18-30', xp: 3000 },
      { email: 'player6@test.com', name: 'Candace Parker', gender: 'female', ageGroup: '18-30', xp: 2500 },
      { email: 'player7@test.com', name: 'Giannis A.', gender: 'male', ageGroup: '18-30', xp: 2000 },
      { email: 'player8@test.com', name: 'Luka Doncic', gender: 'male', ageGroup: '18-30', xp: 1500 },
      // 31+ age group players
      { email: 'senior1@test.com', name: 'Tim Duncan', gender: 'male', ageGroup: '31+', xp: 6000 },
      { email: 'senior2@test.com', name: 'Dirk Nowitzki', gender: 'male', ageGroup: '31+', xp: 5500 },
      { email: 'senior3@test.com', name: 'Sue Bird', gender: 'female', ageGroup: '31+', xp: 5000 },
      // Under-18 age group players
      { email: 'junior1@test.com', name: 'Victor Jr', gender: 'male', ageGroup: 'Under-18', xp: 2000 },
      { email: 'junior2@test.com', name: 'Caitlin Young', gender: 'female', ageGroup: 'Under-18', xp: 1800 },
    ]

    for (const player of testPlayers) {
      // Create user
      const [newUser] = await db
        .insert(users)
        .values({
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
