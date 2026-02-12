/**
 * Update existing challenges to have proper challengeType values
 * Run with: npx tsx scripts/update-challenge-types.ts
 */
import 'dotenv/config'
import { getDb, challenges } from '../src/db'
import { eq } from 'drizzle-orm'

async function updateChallengeTypes(): Promise<void> {
  console.log('Connecting to database...')
  const db = getDb()

  console.log('Updating challenge types...')

  // Update 3-Point Shot challenges
  const threePoint = await db
    .update(challenges)
    .set({ challengeType: 'three_point' })
    .where(eq(challenges.name, '3-Point Shot'))
    .returning()
  console.log(`Updated ${threePoint.length} "3-Point Shot" → three_point`)

  // Update Free Throw challenges
  const freeThrow = await db
    .update(challenges)
    .set({ challengeType: 'free_throw' })
    .where(eq(challenges.name, 'Free Throw'))
    .returning()
  console.log(`Updated ${freeThrow.length} "Free Throw" → free_throw`)

  // Update Around the World challenges
  const aroundWorld = await db
    .update(challenges)
    .set({ challengeType: 'around_the_world' })
    .where(eq(challenges.name, 'Around the World'))
    .returning()
  console.log(`Updated ${aroundWorld.length} "Around the World" → around_the_world`)

  // Verify
  console.log('\nVerification:')
  const all = await db
    .select({ name: challenges.name, type: challenges.challengeType })
    .from(challenges)
  all.forEach((c) => console.log(`  ${c.name} → ${c.type}`))

  console.log('\nDone!')
  process.exit(0)
}

updateChallengeTypes().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
