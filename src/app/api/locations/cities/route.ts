import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { getDb } from '@/db'
import { cities } from '@/db/schema'
import { logger } from '@/lib/logger'

/**
 * GET /api/locations/cities?countryId=xxx
 * Returns cities for a given country
 */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const countryId = searchParams.get('countryId')

    if (!countryId) {
      return NextResponse.json({ error: 'countryId is required' }, { status: 400 })
    }

    const db = getDb()
    const citiesList = await db
      .select({ id: cities.id, name: cities.name })
      .from(cities)
      .where(eq(cities.countryId, countryId))
      .orderBy(cities.name)

    return NextResponse.json({ cities: citiesList })
  } catch (error) {
    logger.error({ error }, 'Failed to fetch cities')
    return NextResponse.json({ error: 'Failed to fetch cities' }, { status: 500 })
  }
}
