/**
 * One-time database reset script
 * Drops everything and recreates with proper migrations
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
  await pool.query('DROP SCHEMA IF EXISTS drizzle CASCADE')
  await pool.query('DROP SCHEMA public CASCADE')
  await pool.query('CREATE SCHEMA public')
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
