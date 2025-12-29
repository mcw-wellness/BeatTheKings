import { NextResponse } from 'next/server'
import { getDefaultAvatarSasUrl, getUserAvatarSasUrl } from '@/lib/azure-storage'
import { getSession } from '@/lib/auth'
import { logger } from '@/lib/logger'

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'default'
    const gender = searchParams.get('gender') || 'male'
    let userId = searchParams.get('userId')
    const sport = searchParams.get('sport') || 'basketball'

    logger.info({ type, gender, userId, sport }, 'Avatar URL request params')

    // Handle "me" as current user
    if (userId === 'me') {
      const session = await getSession()
      logger.info({ session: !!session, userId: session?.user?.id }, 'Session check for "me"')
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      userId = session.user.id
    }

    let url: string

    if (type === 'user' && userId) {
      logger.info({ userId }, 'Generating user avatar SAS URL')
      url = getUserAvatarSasUrl(userId)
    } else {
      logger.info({ gender, sport }, 'Generating default avatar SAS URL')
      url = getDefaultAvatarSasUrl(gender, sport)
    }

    return NextResponse.json({ url })
  } catch (error) {
    logger.error({ error }, 'Failed to generate avatar SAS URL')
    return NextResponse.json({ error: 'Failed to generate avatar URL' }, { status: 500 })
  }
}
