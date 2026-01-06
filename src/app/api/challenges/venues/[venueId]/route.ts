/**
 * GET /api/challenges/venues/[venueId]
 * Get challenges at a specific venue
 */

import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/db'
import { getVenueChallenges, getVenueOpponents } from '@/lib/challenges'
import { getVenueById } from '@/lib/venues'
import { logger } from '@/lib/utils/logger'

interface RouteParams {
  params: Promise<{ venueId: string }>
}

export async function GET(request: Request, { params }: RouteParams): Promise<Response> {
  try {
    const session = await getSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { venueId } = await params
    const { searchParams } = new URL(request.url)
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')

    const db = getDb()

    // Get venue details
    const venue = await getVenueById(
      db,
      venueId,
      lat ? parseFloat(lat) : undefined,
      lng ? parseFloat(lng) : undefined
    )

    if (!venue) {
      return NextResponse.json({ error: 'Venue not found' }, { status: 404 })
    }

    // Get challenges at venue
    const challenges = await getVenueChallenges(db, venueId, session.user.id)

    // Get active opponents for 1v1
    const opponents = await getVenueOpponents(db, venueId, session.user.id)

    return NextResponse.json({
      venue,
      challenges,
      opponents,
    })
  } catch (error) {
    logger.error({ error }, 'Failed to get venue challenges')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
