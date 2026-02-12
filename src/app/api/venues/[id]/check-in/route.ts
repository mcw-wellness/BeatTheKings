import { NextResponse } from 'next/server'
import { getDb } from '@/db'
import { getSession } from '@/lib/auth'
import {
  checkInToVenue,
  checkOutFromVenue,
  getUserCheckInStatus,
  refreshCheckIn,
} from '@/lib/venues'
import { logger } from '@/lib/utils/logger'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/venues/:id/check-in
 * Check if user is currently checked in at this venue
 */
export async function GET(
  request: Request,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: venueId } = await params
    const db = getDb()

    const status = await getUserCheckInStatus(db, session.user.id, venueId)

    return NextResponse.json(status)
  } catch (error) {
    logger.error({ error }, 'Failed to get check-in status')
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/venues/:id/check-in
 * Check in to a venue (mark as active player)
 */
export async function POST(
  request: Request,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: venueId } = await params
    const body = await request.json()
    const { latitude, longitude } = body

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      )
    }

    const db = getDb()
    const result = await checkInToVenue(
      db,
      session.user.id,
      venueId,
      latitude,
      longitude
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.message, distance: result.distance },
        { status: 400 }
      )
    }

    logger.info({ userId: session.user.id, venueId }, 'User checked in')

    return NextResponse.json(result)
  } catch (error) {
    logger.error({ error }, 'Failed to check in to venue')
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/venues/:id/check-in
 * Heartbeat: refresh lastSeenAt and position
 */
export async function PATCH(
  request: Request,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: venueId } = await params
    const body = await request.json()
    const { latitude, longitude } = body

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      )
    }

    const db = getDb()
    const result = await refreshCheckIn(
      db,
      session.user.id,
      venueId,
      latitude,
      longitude
    )

    if (!result.success) {
      return NextResponse.json(
        { error: 'No active check-in found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error({ error }, 'Failed to refresh check-in')
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/venues/:id/check-in
 * Check out from a venue
 */
export async function DELETE(
  request: Request,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: venueId } = await params
    const db = getDb()

    const result = await checkOutFromVenue(db, session.user.id, venueId)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to check out' },
        { status: 400 }
      )
    }

    logger.info({ userId: session.user.id, venueId }, 'User checked out')

    return NextResponse.json({
      success: true,
      message: 'Checked out successfully',
    })
  } catch (error) {
    logger.error({ error }, 'Failed to check out from venue')
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
