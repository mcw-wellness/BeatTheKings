/**
 * Database migration script
 *
 * On first run: drops all tables and recreates with proper migrations
 * On subsequent runs: just applies new migrations
 */
import 'dotenv/config'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import pg from 'pg'

const { Pool } = pg

async function runMigrations() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  })

  console.log('Starting migrations...')

  try {
    // Check if migrations table exists
    const migrationsExist = await checkMigrationsTableExists(pool)

    if (!migrationsExist) {
      console.log('No migrations table found. Dropping all tables for fresh start...')
      await dropAllTables(pool)
    }

    // Run drizzle migrations
    console.log('Running drizzle migrations...')
    const db = drizzle(pool)
    await migrate(db, { migrationsFolder: './drizzle' })

    console.log('✅ Migrations complete')
  } finally {
    await pool.end()
  }
}

async function checkMigrationsTableExists(pool: pg.Pool): Promise<boolean> {
  const result = await pool.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'drizzle' AND table_name = '__drizzle_migrations'
    )
  `)
  return result.rows[0].exists
}

async function dropAllTables(pool: pg.Pool) {
  // Drop all tables in public schema (in correct order due to FK constraints)
  const dropOrder = [
    'ActivePlayer',
    'ChallengeAttempt',
    'Match',
    'Challenge',
    'PlayerStats',
    'AvatarEquipment',
    'UserUnlockedItem',
    'Avatar',
    'AvatarItem',
    'Venue',
    'User',
    'Sport',
    'City',
    'Country',
  ]

  for (const table of dropOrder) {
    try {
      await pool.query(`DROP TABLE IF EXISTS "${table}" CASCADE`)
      console.log(`  Dropped ${table}`)
    } catch (err) {
      console.log(`  Could not drop ${table}: ${(err as Error).message}`)
    }
  }

  // Drop drizzle schema if exists
  try {
    await pool.query('DROP SCHEMA IF EXISTS drizzle CASCADE')
    console.log('  Dropped drizzle schema')
  } catch {
    // Ignore
  }

  console.log('✓ All tables dropped')
}

runMigrations().catch((err) => {
  console.error('❌ Migration failed:', err)
  process.exit(1)
})
