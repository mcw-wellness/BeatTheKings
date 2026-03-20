import { NextResponse } from 'next/server'
import { getDb } from '@/db'
import { getSession } from '@/lib/auth'
import { getMatchById, saveMatchVideo, updateMatchStatus } from '@/lib/matches'
import { uploadMatchVideo } from '@/lib/azure-storage'
import { logger } from '@/lib/utils/logger'
import { withErrorLogging } from '@/lib/utils/api-handler'

interface RouteParams {
  params: Promise<{ matchId: string }>
}

/**
 * POST /api/challenges/1v1/[matchId]/upload
 * Upload match video. Scores are entered manually after upload.
 */
const _POST = async (request: Request, { params }: RouteParams): Promise<NextResponse> => {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { matchId } = await params
    const db = getDb()

    // Verify match exists and user is participant
    const match = await getMatchById(db, matchId)
    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    const isPlayer1 = match.player1.id === session.user.id
    const isPlayer2 = match.player2.id === session.user.id

    if (!isPlayer1 && !isPlayer2) {
      return NextResponse.json({ error: 'Not a participant' }, { status: 403 })
    }

    if (match.status !== 'in_progress') {
      return NextResponse.json({ error: 'Match not in progress' }, { status: 400 })
    }

    // Check if video was already uploaded
    if (match.videoUrl) {
      return NextResponse.json({ error: 'Video already uploaded.' }, { status: 400 })
    }

    // Allow upload if recordingBy is null (any participant) or matches user
    if (match.recordingBy !== null && match.recordingBy !== session.user.id) {
      return NextResponse.json(
        { error: 'Only the recording player can upload the video' },
        { status: 403 }
      )
    }

    // Get video from form data
    const formData = await request.formData()
    const video = formData.get('video') as File | null

    if (!video) {
      return NextResponse.json({ error: 'No video file provided' }, { status: 400 })
    }

    // Validate video
    if (!video.type.startsWith('video/')) {
      return NextResponse.json({ error: 'Invalid file type. Must be a video.' }, { status: 400 })
    }

    const maxSize = 100 * 1024 * 1024 // 100MB
    if (video.size > maxSize) {
      return NextResponse.json({ error: 'Video too large. Max 100MB.' }, { status: 400 })
    }

    // Update status to uploading
    await updateMatchStatus(db, matchId, 'uploading')

    // Upload to Azure
    const videoBuffer = Buffer.from(await video.arrayBuffer())
    const videoUrl = await uploadMatchVideo(matchId, videoBuffer)

    // Save video URL — status stays in_progress for manual score entry
    await saveMatchVideo(db, matchId, videoUrl)
    await updateMatchStatus(db, matchId, 'in_progress')

    logger.info({ matchId, videoUrl }, 'Match video uploaded, awaiting manual score entry')

    return NextResponse.json({
      success: true,
      status: 'in_progress',
      videoUrl,
    })
  } catch (error) {
    logger.error({ error }, 'Failed to upload match video')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const POST = withErrorLogging(_POST)
