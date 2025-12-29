import { NextResponse } from 'next/server'
import { getDb } from '@/db'
import { getSession } from '@/lib/auth'
import {
  getSportId,
  getCityRankings,
  getCountryRankings,
  getGlobalRankings,
  getUserRank,
  getLocationInfo,
  getUserLocation,
  type RankingLevel,
  type RankingsResponse,
} from '@/lib/rankings'
import { logger } from '@/lib/logger'

/**
 * GET /api/rankings
 * Get player rankings with filters
 */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const level = (searchParams.get('level') || 'city') as RankingLevel
    const sport = searchParams.get('sport') || 'basketball'
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100)
    let cityId = searchParams.get('cityId') || undefined
    let countryId = searchParams.get('countryId') || undefined

    // Validate level
    if (!['venue', 'city', 'country'].includes(level)) {
      return NextResponse.json(
        { error: 'Invalid level. Must be venue, city, or country' },
        { status: 400 }
      )
    }

    const db = getDb()

    // Get sport ID
    const sportId = await getSportId(db, sport)
    if (!sportId) {
      return NextResponse.json({ error: 'Sport not found' }, { status: 404 })
    }

    // Get user's location if not provided
    if (!cityId || !countryId) {
      const userLocation = await getUserLocation(db, session.user.id)
      if (!cityId) cityId = userLocation.cityId || undefined
      if (!countryId) countryId = userLocation.countryId || undefined
    }

    let rankings: { players: typeof response.rankings; total: number }
    let location: { id: string; name: string } | null = null

    // Get rankings based on level
    switch (level) {
      case 'city':
        if (!cityId) {
          return NextResponse.json({ error: 'City ID required for city rankings' }, { status: 400 })
        }
        rankings = await getCityRankings(db, sportId, cityId, limit)
        location = await getLocationInfo(db, 'city', cityId)
        break

      case 'country':
        if (!countryId) {
          return NextResponse.json(
            { error: 'Country ID required for country rankings' },
            { status: 400 }
          )
        }
        rankings = await getCountryRankings(db, sportId, countryId, limit)
        location = await getLocationInfo(db, 'country', undefined, countryId)
        break

      case 'venue':
        // For now, fall back to global rankings
        // Venue rankings will require tracking which venue users play at
        rankings = await getGlobalRankings(db, sportId, limit)
        break

      default:
        rankings = await getGlobalRankings(db, sportId, limit)
    }

    // Get current user's rank
    const currentUser = await getUserRank(db, session.user.id, sportId, cityId)

    // Find the king (rank 1)
    const king = rankings.players.find((p) => p.rank === 1) || null

    const response: RankingsResponse = {
      level,
      sport,
      location,
      king,
      rankings: rankings.players,
      currentUser,
      totalPlayers: rankings.total,
    }

    logger.info({ level, sport, totalPlayers: rankings.total }, 'Rankings fetched')

    return NextResponse.json(response)
  } catch (error) {
    logger.error({ error }, 'Failed to get rankings')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
