/**
 * Direct SQL migration script
 * Runs specific ALTER statements - safe to run multiple times
 */
import 'dotenv/config'
import pg from 'pg'

const { Pool } = pg

async function migrate() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  })

  console.log('Running migrations...')

  try {
    // Make updatedAt nullable on all tables (safe to run multiple times)
    const migrations = [
      { table: 'User', column: 'updatedAt' },
      { table: 'Venue', column: 'updatedAt' },
      { table: 'Avatar', column: 'updatedAt' },
      { table: 'AvatarEquipment', column: 'updatedAt' },
      { table: 'Challenge', column: 'updatedAt' },
      { table: 'PlayerStats', column: 'updatedAt' },
    ]

    for (const { table, column } of migrations) {
      // Check if column is currently NOT NULL
      const checkResult = await pool.query(`
        SELECT is_nullable
        FROM information_schema.columns
        WHERE table_name = $1 AND column_name = $2
      `, [table, column])

      if (checkResult.rows.length === 0) {
        console.log(`⚠ Column ${table}.${column} not found, skipping`)
        continue
      }

      if (checkResult.rows[0].is_nullable === 'YES') {
        console.log(`✓ ${table}.${column} already nullable`)
        continue
      }

      // Drop NOT NULL constraint
      try {
        await pool.query(`ALTER TABLE "${table}" ALTER COLUMN "${column}" DROP NOT NULL`)
        console.log(`✓ ${table}.${column} made nullable`)
      } catch (err) {
        console.log(`⚠ ${table}.${column} - ${(err as Error).message}`)
      }

      // Drop DEFAULT if exists
      try {
        await pool.query(`ALTER TABLE "${table}" ALTER COLUMN "${column}" DROP DEFAULT`)
        console.log(`✓ ${table}.${column} default dropped`)
      } catch (err) {
        // Ignore - might not have a default
      }
    }

    console.log('✅ Migrations complete')
  } finally {
    await pool.end()
  }
}

migrate().catch((err) => {
  console.error('❌ Migration failed:', err)
  process.exit(1)
})
