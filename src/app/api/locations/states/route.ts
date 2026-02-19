import { NextResponse } from 'next/server'
import { getDb } from '@/db'
import { countries } from '@/db/schema'
import { logger } from '@/lib/utils/logger'
import { withErrorLogging } from '@/lib/utils/api-handler'

/**
 * GET /api/locations/states
 * Returns all countries (renamed from states for backwards compatibility)
 */
const _GET = async (): Promise<NextResponse> => {
  try {
    const db = getDb()
    const allCountries = await db.select().from(countries).orderBy(countries.name)

    // Transform to expected format for backwards compatibility
    const result = allCountries.map((country) => ({
      id: country.id,
      name: country.name,
      nameGerman: country.name, // Same for now, can be localized later
    }))

    return NextResponse.json(result)
  } catch (error) {
    logger.error({ error }, 'Failed to fetch countries')
    return NextResponse.json({ error: 'Failed to fetch countries' }, { status: 500 })
  }
}

export const GET = withErrorLogging(_GET)
