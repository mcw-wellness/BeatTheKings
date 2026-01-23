// Script to create fake German users for testing
// Run with: npx tsx scripts/create-fake-users.ts

import 'dotenv/config'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { eq } from 'drizzle-orm'
import * as schema from '../src/db/schema'

const germanNames = [
  { name: 'Maximilian Müller', nickname: 'Max', gender: 'male' },
  { name: 'Felix Schmidt', nickname: 'Felix', gender: 'male' },
  { name: 'Leon Weber', nickname: 'Leon', gender: 'male' },
  { name: 'Paul Fischer', nickname: 'Pauli', gender: 'male' },
  { name: 'Lukas Wagner', nickname: 'Luki', gender: 'male' },
  { name: 'Jonas Becker', nickname: 'Jonas', gender: 'male' },
  { name: 'Tim Hoffmann', nickname: 'Timmy', gender: 'male' },
  { name: 'Niklas Schäfer', nickname: 'Nik', gender: 'male' },
  { name: 'Sophie Braun', nickname: 'Sophie', gender: 'female' },
  { name: 'Marie Zimmermann', nickname: 'Marie', gender: 'female' },
]

const skinTones = ['light', 'medium-light', 'medium', 'medium-dark', 'dark'] as const
const hairStyles = ['short', 'medium', 'long', 'bald', 'afro', 'braids'] as const
const hairColors = ['black', 'brown', 'blonde', 'red'] as const

function randomItem<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomAge(): { dob: string; age: number; ageGroup: string } {
  const age = Math.floor(Math.random() * 30) + 16 // 16-45
  const year = new Date().getFullYear() - age
  const dob = `${year}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`
  const ageGroup = age < 18 ? 'Under-18' : age <= 30 ? '18-30' : '31+'
  return { dob, age, ageGroup }
}

async function main() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error('DATABASE_URL not set')
    process.exit(1)
  }

  const pool = new Pool({ connectionString })
  const db = drizzle(pool, { schema })

  // Get a city (use first available)
  const [city] = await db.select().from(schema.cities).limit(1)
  if (!city) {
    console.error('No cities found in database. Please seed cities first.')
    await pool.end()
    process.exit(1)
  }

  // Get basketball sport
  const [basketball] = await db
    .select()
    .from(schema.sports)
    .where(eq(schema.sports.slug, 'basketball'))
    .limit(1)

  if (!basketball) {
    console.error('Basketball sport not found')
    await pool.end()
    process.exit(1)
  }

  // Get default items
  const defaultItems = await db
    .select()
    .from(schema.avatarItems)
    .where(eq(schema.avatarItems.isDefault, true))

  console.log(`Creating ${germanNames.length} fake German users...`)

  for (const person of germanNames) {
    const email = `${person.nickname.toLowerCase()}@fake-user.test`

    // Check if user already exists
    const [existing] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1)

    if (existing) {
      console.log(`User ${email} already exists, skipping...`)
      continue
    }

    const { dob, age, ageGroup } = randomAge()

    // Create user
    const [user] = await db
      .insert(schema.users)
      .values({
        email,
        name: person.name,
        nickname: person.nickname,
        dateOfBirth: dob,
        age,
        ageGroup,
        gender: person.gender,
        cityId: city.id,
        hasCompletedProfile: true,
        hasUploadedPhoto: true,
        hasCreatedAvatar: true,
      })
      .returning()

    console.log(`Created user: ${person.name} (${email})`)

    // Create avatar
    const [avatar] = await db
      .insert(schema.avatars)
      .values({
        userId: user.id,
        skinTone: randomItem(skinTones),
        hairStyle: randomItem(hairStyles),
        hairColor: randomItem(hairColors),
      })
      .returning()

    // Unlock default items
    for (const item of defaultItems) {
      await db
        .insert(schema.userUnlockedItems)
        .values({
          userId: user.id,
          itemId: item.id,
          unlockedVia: 'default',
        })
        .onConflictDoNothing()
    }

    // Create equipment
    const jersey = defaultItems.find((i) => i.itemType === 'jersey')
    const shorts = defaultItems.find((i) => i.itemType === 'shorts')
    const shoes = defaultItems.find((i) => i.itemType === 'shoes')

    await db.insert(schema.avatarEquipments).values({
      avatarId: avatar.id,
      sportId: basketball.id,
      jerseyItemId: jersey?.id || null,
      shortsItemId: shorts?.id || null,
      shoesItemId: shoes?.id || null,
      jerseyNumber: Math.floor(Math.random() * 99) + 1,
    })

    // Create player stats
    const wins = Math.floor(Math.random() * 50)
    const losses = Math.floor(Math.random() * 30)
    const xp = Math.floor(Math.random() * 5000) + 100

    await db.insert(schema.playerStats).values({
      userId: user.id,
      sportId: basketball.id,
      totalXp: xp,
      totalRp: Math.floor(xp * 0.1),
      matchesPlayed: wins + losses,
      matchesWon: wins,
      matchesLost: losses,
      challengesCompleted: Math.floor(Math.random() * 20),
      totalPointsScored: Math.floor(Math.random() * 500),
    })

    console.log(`  - Avatar and stats created for ${person.nickname}`)
  }

  console.log('\nDone! Created fake German users.')
  await pool.end()
}

main().catch(console.error)
