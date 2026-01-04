import { NextResponse } from 'next/server'
import { getDb } from '@/db'
import { getSession } from '@/lib/auth'
import { getVenueById, getActivePlayersAtVenue, getVenueChallenges } from '@/lib/venues'
import { formatDistance } from '@/lib/distance'
import { logger } from '@/lib/logger'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/venues/:id
 * Get single venue details with active players and challenges
 */
export async function GET(request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: venueId } = await params

    const { searchParams } = new URL(request.url)
    const lat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : undefined
    const lng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : undefined

    const db = getDb()

    // Get venue details
    const venue = await getVenueById(db, venueId, lat, lng)

    if (!venue) {
      return NextResponse.json({ error: 'Venue not found' }, { status: 404 })
    }

    // Get active players
    const activePlayers = await getActivePlayersAtVenue(db, venueId, lat, lng)

    // Get challenges
    const challenges = await getVenueChallenges(db, venueId)

    // Find king (first active player with highest XP)
    const king = activePlayers.length > 0 ? activePlayers[0] : null

    logger.info({ venueId, activePlayers: activePlayers.length }, 'Venue details fetched')

    return NextResponse.json({
      venue: {
        ...venue,
        distanceFormatted: venue.distance !== null ? formatDistance(venue.distance) : null,
      },
      king: king
        ? {
            id: king.id,
            name: king.name,
            rank: king.rank,
            avatar: king.avatar,
          }
        : null,
      activePlayers: activePlayers.map((p) => ({
        ...p,
        distanceFormatted: p.distance !== null ? formatDistance(p.distance) : null,
      })),
      challenges,
    })
  } catch (error) {
    logger.error({ error }, 'Failed to get venue details')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
