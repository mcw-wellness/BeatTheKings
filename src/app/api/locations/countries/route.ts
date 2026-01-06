import { NextResponse } from 'next/server'
import { getDb } from '@/db'
import { countries } from '@/db/schema'
import { logger } from '@/lib/utils/logger'

/**
 * GET /api/locations/countries
 * Returns all countries
 */
export async function GET(): Promise<NextResponse> {
  try {
    const db = getDb()
    const countriesList = await db
      .select({ id: countries.id, name: countries.name, code: countries.code })
      .from(countries)
      .orderBy(countries.name)

    return NextResponse.json({ countries: countriesList })
  } catch (error) {
    logger.error({ error }, 'Failed to fetch countries')
    return NextResponse.json({ error: 'Failed to fetch countries' }, { status: 500 })
  }
}
