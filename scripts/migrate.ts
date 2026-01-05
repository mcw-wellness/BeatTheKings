/**
 * One-time database reset script
 * DELETE THIS FILE after successful deployment
 */
import 'dotenv/config'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import pg from 'pg'

const { Pool } = pg

async function run() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  })

  console.log('Dropping all tables...')

  // Drop drizzle schema
  await pool.query('DROP SCHEMA IF EXISTS drizzle CASCADE')

  // Drop all tables in public schema
  const tables = [
    'ActivePlayer', 'ChallengeAttempt', 'Match', 'Challenge', 'PlayerStats',
    'AvatarEquipment', 'UserUnlockedItem', 'Avatar', 'AvatarItem', 'Venue',
    'User', 'Sport', 'City', 'Country'
  ]
  for (const t of tables) {
    await pool.query(`DROP TABLE IF EXISTS "${t}" CASCADE`)
  }
  console.log('✓ All tables dropped')

  console.log('Running migrations...')
  const db = drizzle(pool)
  await migrate(db, { migrationsFolder: './drizzle' })
  console.log('✓ Migrations complete')

  await pool.end()
}

run().catch((err) => {
  console.error('❌ Failed:', err)
  process.exit(1)
})
