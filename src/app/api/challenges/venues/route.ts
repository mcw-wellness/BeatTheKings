/**
 * GET /api/challenges/venues
 * Get venues with challenge counts, sorted by distance
 */

import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/db'
import { getChallengeVenues } from '@/lib/challenges'
import { logger } from '@/lib/logger'

export async function GET(request: Request): Promise<Response> {
  try {
    const session = await getSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')
    const limit = searchParams.get('limit')

    const db = getDb()
    const venues = await getChallengeVenues(db, {
      userLat: lat ? parseFloat(lat) : undefined,
      userLng: lng ? parseFloat(lng) : undefined,
      limit: limit ? parseInt(limit, 10) : 20,
    })

    return NextResponse.json({ venues, total: venues.length })
  } catch (error) {
    logger.error({ error }, 'Failed to get challenge venues')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
