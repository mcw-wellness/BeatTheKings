import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { getDb } from '@/db'
import { users } from '@/db/schema'
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
  type RankedPlayer,
} from '@/lib/rankings'
import { logger } from '@/lib/utils/logger'

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

    // Get user's age group (optional - will show empty rankings if not set)
    const [currentUser] = await db
      .select({ ageGroup: users.ageGroup })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1)

    const ageGroup = currentUser?.ageGroup || null

    // Get user's location if not provided
    if (!cityId || !countryId) {
      const userLocation = await getUserLocation(db, session.user.id)
      if (!cityId) cityId = userLocation.cityId || undefined
      if (!countryId) countryId = userLocation.countryId || undefined
    }

    let rankings: { players: RankedPlayer[]; total: number }
    let location: { id: string; name: string } | null = null

    // Return empty rankings if age group not set
    if (!ageGroup) {
      const response: RankingsResponse = {
        level,
        sport,
        location: null,
        king: null,
        rankings: [],
        currentUser: null,
        totalPlayers: 0,
      }
      return NextResponse.json(response)
    }

    // Get rankings based on level (filtered by user's age group)
    switch (level) {
      case 'city':
        if (!cityId) {
          // Return empty rankings if city not set
          const response: RankingsResponse = {
            level,
            sport,
            location: null,
            king: null,
            rankings: [],
            currentUser: null,
            totalPlayers: 0,
          }
          return NextResponse.json(response)
        }
        rankings = await getCityRankings(db, sportId, cityId, ageGroup, limit)
        location = await getLocationInfo(db, 'city', cityId)
        break

      case 'country':
        if (!countryId) {
          // Return empty rankings if country not set
          const response: RankingsResponse = {
            level,
            sport,
            location: null,
            king: null,
            rankings: [],
            currentUser: null,
            totalPlayers: 0,
          }
          return NextResponse.json(response)
        }
        rankings = await getCountryRankings(db, sportId, countryId, ageGroup, limit)
        location = await getLocationInfo(db, 'country', undefined, countryId)
        break

      case 'venue':
        // For now, fall back to global rankings
        // Venue rankings will require tracking which venue users play at
        rankings = await getGlobalRankings(db, sportId, ageGroup, limit)
        break

      default:
        rankings = await getGlobalRankings(db, sportId, ageGroup, limit)
    }

    // Get current user's rank (within their age group)
    const userRank = await getUserRank(db, session.user.id, sportId, ageGroup, cityId)

    // Find the king (rank 1)
    const king = rankings.players.find((p) => p.rank === 1) || null

    const response: RankingsResponse = {
      level,
      sport,
      location,
      king,
      rankings: rankings.players,
      currentUser: userRank,
      totalPlayers: rankings.total,
    }

    logger.info({ level, sport, totalPlayers: rankings.total }, 'Rankings fetched')

    return NextResponse.json(response)
  } catch (error) {
    logger.error({ error }, 'Failed to get rankings')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
