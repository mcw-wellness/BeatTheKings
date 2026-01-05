/**
 * Database migration script with baseline support
 *
 * This script handles the transition from drizzle-kit push to drizzle-kit migrate
 * by creating a baseline for existing databases.
 */
import 'dotenv/config'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import pg from 'pg'
import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'

const { Pool } = pg

async function runMigrations() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  })

  const db = drizzle(pool)

  console.log('Starting migrations...')

  try {
    // Check if this is an existing database that was set up with 'push'
    // by checking if tables exist but __drizzle_migrations doesn't
    const tablesExist = await checkTablesExist(pool)
    const migrationsTableExists = await checkMigrationsTableExists(pool)

    console.log(`Tables exist: ${tablesExist}, Migrations table exists: ${migrationsTableExists}`)

    if (tablesExist && !migrationsTableExists) {
      console.log('Existing database detected (created with push). Creating baseline...')
      await createBaseline(pool)
    }

    // Now run migrations normally
    console.log('Running drizzle migrations...')
    await migrate(db, { migrationsFolder: './drizzle' })

    console.log('✅ Migrations complete')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await pool.end()
  }
}

async function checkTablesExist(pool: pg.Pool): Promise<boolean> {
  const result = await pool.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'User'
    )
  `)
  return result.rows[0].exists
}

async function checkMigrationsTableExists(pool: pg.Pool): Promise<boolean> {
  const result = await pool.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'drizzle'
      AND table_name = '__drizzle_migrations'
    )
  `)
  return result.rows[0].exists
}

async function createBaseline(pool: pg.Pool) {
  // Create the drizzle schema if it doesn't exist
  await pool.query('CREATE SCHEMA IF NOT EXISTS drizzle')

  // Create the migrations table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS drizzle."__drizzle_migrations" (
      id SERIAL PRIMARY KEY,
      hash TEXT NOT NULL,
      created_at BIGINT
    )
  `)

  // Read the first migration file and compute its hash
  const migrationsDir = './drizzle'
  const journalPath = path.join(migrationsDir, 'meta', '_journal.json')

  if (!fs.existsSync(journalPath)) {
    throw new Error('Migration journal not found')
  }

  const journal = JSON.parse(fs.readFileSync(journalPath, 'utf-8'))

  // Mark the initial migration (0000) as applied since tables already exist
  // We only baseline the FIRST migration - subsequent ones will be applied normally
  const initialMigration = journal.entries[0]
  if (initialMigration) {
    const migrationFile = path.join(migrationsDir, `${initialMigration.tag}.sql`)
    const sql = fs.readFileSync(migrationFile, 'utf-8')
    const hash = crypto.createHash('sha256').update(sql).digest('hex')

    // Check if already inserted
    const existing = await pool.query(
      'SELECT id FROM drizzle."__drizzle_migrations" WHERE hash = $1',
      [hash]
    )

    if (existing.rows.length === 0) {
      await pool.query(
        'INSERT INTO drizzle."__drizzle_migrations" (hash, created_at) VALUES ($1, $2)',
        [hash, Date.now()]
      )
      console.log(`✓ Baselined migration: ${initialMigration.tag}`)
    } else {
      console.log(`- Migration already baselined: ${initialMigration.tag}`)
    }
  }
}

runMigrations().catch((err) => {
  console.error(err)
  process.exit(1)
})
