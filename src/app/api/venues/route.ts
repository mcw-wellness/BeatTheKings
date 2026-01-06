import { NextResponse } from 'next/server'
import { getDb } from '@/db'
import { getSession } from '@/lib/auth'
import { getVenuesList } from '@/lib/venues'
import { formatDistance } from '@/lib/utils/distance'
import { logger } from '@/lib/utils/logger'

/**
 * GET /api/venues
 * Get list of venues sorted by distance
 */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const lat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : undefined
    const lng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : undefined
    const cityId = searchParams.get('cityId') || undefined
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)

    const db = getDb()

    const { venues, total } = await getVenuesList(db, {
      userLat: lat,
      userLng: lng,
      cityId,
      limit,
    })

    // Format response with distance strings
    const formattedVenues = venues.map((venue) => ({
      ...venue,
      distanceFormatted: venue.distance !== null ? formatDistance(venue.distance) : null,
    }))

    logger.info({ count: total, hasLocation: !!lat }, 'Venues fetched')

    return NextResponse.json({
      venues: formattedVenues,
      totalVenues: total,
    })
  } catch (error) {
    logger.error({ error }, 'Failed to get venues')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
