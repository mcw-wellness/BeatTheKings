/**
 * GET /api/sports - Get all active sports
 */

import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { getDb } from '@/db'
import { sports } from '@/db/schema'
import { logger } from '@/lib/utils/logger'

export async function GET(): Promise<Response> {
  try {
    const db = getDb()
    const result = await db
      .select({
        id: sports.id,
        name: sports.name,
        slug: sports.slug,
      })
      .from(sports)
      .where(eq(sports.isActive, true))

    return NextResponse.json({ sports: result })
  } catch (error) {
    logger.error({ error }, 'Failed to fetch sports')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
