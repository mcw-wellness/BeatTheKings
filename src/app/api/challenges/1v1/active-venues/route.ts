import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { db } from '@/db'
import { getVenuesWithActivePlayers } from '@/lib/venues'
import { logger } from '@/lib/utils/logger'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')
    const limitParam = searchParams.get('limit')

    if (!lat || !lng) {
      return NextResponse.json({ error: 'Location required (lat, lng)' }, { status: 400 })
    }

    const userLat = parseFloat(lat)
    const userLng = parseFloat(lng)
    const limit = limitParam ? Math.min(parseInt(limitParam, 10), 10) : 5

    if (isNaN(userLat) || isNaN(userLng)) {
      return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 })
    }

    const result = await getVenuesWithActivePlayers(db(), {
      userLat,
      userLng,
      limit,
      excludeUserId: session.user.id,
    })

    return NextResponse.json(result)
  } catch (error) {
    logger.error({ error }, 'Failed to fetch active venues for 1v1')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
