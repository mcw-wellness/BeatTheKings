import { NextResponse } from 'next/server'
import { getDb } from '@/db'
import {
  getSession,
  validateProfileInput,
  updateUserProfile,
  getUserProfile,
  cityExists,
} from '@/lib/auth'
import { logger } from '@/lib/utils/logger'

/**
 * GET /api/users/profile
 * Get authenticated user's profile
 */
export async function GET(): Promise<NextResponse> {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = getDb()
    const profile = await getUserProfile(db, session.user.id)

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    return NextResponse.json(profile)
  } catch (error) {
    logger.error({ error }, 'Failed to get user profile')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/users/profile
 * Update authenticated user's profile (partial update supported)
 */
export async function PUT(request: Request): Promise<NextResponse> {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const validation = validateProfileInput(body)

    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      )
    }

    const db = getDb()

    // Verify city exists if cityId is being updated
    if (validation.data.cityId) {
      const cityValid = await cityExists(db, validation.data.cityId)
      if (!cityValid) {
        return NextResponse.json(
          { error: 'Validation failed', details: { cityId: 'City not found' } },
          { status: 400 }
        )
      }
    }

    const updated = await updateUserProfile(db, session.user.id, validation.data)

    if (!updated) {
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    logger.info({ userId: session.user.id }, 'User profile updated')

    return NextResponse.json({ success: true, user: updated })
  } catch (error) {
    logger.error({ error }, 'Failed to update user profile')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
