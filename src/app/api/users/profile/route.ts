import { NextResponse } from 'next/server'
import { getDb } from '@/db'
import {
  getSession,
  validateProfileInput,
  updateUserProfile,
  getUserProfile,
  cityExists,
  getOrCreateUser,
} from '@/lib/auth'
import { logger } from '@/lib/utils/logger'
import { withErrorLogging } from '@/lib/utils/api-handler'

/**
 * GET /api/users/profile
 * Get authenticated user's profile
 */
const _GET = async (): Promise<NextResponse> => {
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
const _PUT = async (request: Request): Promise<NextResponse> => {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      logger.warn({ session: !!session, hasUser: !!session?.user }, 'PUT /api/users/profile - no session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const validation = validateProfileInput(body)

    if (!validation.valid) {
      logger.warn({ userId, errors: validation.errors }, 'Profile validation failed')
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
        logger.warn({ userId, cityId: validation.data.cityId }, 'City not found during profile update')
        return NextResponse.json(
          { error: 'Validation failed', details: { cityId: 'City not found' } },
          { status: 400 }
        )
      }
    }

    let updated = await updateUserProfile(db, userId, validation.data)

    // If update returned null, user row doesn't exist — create it and retry
    if (!updated) {
      const email = session.user.email
      if (!email) {
        logger.error({ userId }, 'No email in session, cannot create user row')
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
      }

      logger.warn({ userId, email }, 'User row not found during profile update, creating user')
      await getOrCreateUser(db, { email, name: session.user.name })
      updated = await updateUserProfile(db, userId, validation.data)
    }

    if (!updated) {
      logger.error({ userId }, 'updateUserProfile failed after user creation')
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    logger.info({ userId }, 'User profile updated')

    return NextResponse.json({ success: true, user: updated })
  } catch (error) {
    logger.error({ error }, 'Failed to update user profile')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const GET = withErrorLogging(_GET)
export const PUT = withErrorLogging(_PUT)
