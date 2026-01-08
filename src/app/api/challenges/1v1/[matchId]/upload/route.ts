import { NextResponse } from 'next/server'
import { getDb } from '@/db'
import { getSession } from '@/lib/auth'
import { getMatchById, saveMatchVideo, saveMatchResults, updateMatchStatus } from '@/lib/matches'
import { analyzeMatchVideo, calculateRewards } from '@/lib/gemini'
import { uploadMatchVideo, saveMatchAnalysis } from '@/lib/azure-storage'
import { logger } from '@/lib/utils/logger'

interface RouteParams {
  params: Promise<{ matchId: string }>
}

/**
 * POST /api/challenges/1v1/[matchId]/upload
 * Upload match video and trigger AI analysis
 */
export async function POST(request: Request, { params }: RouteParams): Promise<NextResponse> {
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

    // Check if video was already uploaded (prevent duplicate analysis)
    if (match.videoUrl) {
      return NextResponse.json(
        { error: 'Video already uploaded. Analysis in progress or completed.' },
        { status: 400 }
      )
    }

    // Verify uploader is the one with recording lock
    if (match.recordingBy && match.recordingBy !== session.user.id) {
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

    // Save video URL and update status to analyzing
    await saveMatchVideo(db, matchId, videoUrl)

    logger.info({ matchId, videoUrl }, 'Match video uploaded, starting analysis')

    // Trigger AI analysis (async - don't wait)
    analyzeAndSaveResults(matchId, videoUrl, match.player1.id, match.player2.id)

    return NextResponse.json({
      success: true,
      status: 'analyzing',
      videoUrl,
    })
  } catch (error) {
    logger.error({ error }, 'Failed to upload match video')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Analyze video and save results (runs async)
 */
async function analyzeAndSaveResults(
  matchId: string,
  videoUrl: string,
  player1Id: string,
  player2Id: string
): Promise<void> {
  const db = getDb()

  try {
    const analysis = await analyzeMatchVideo(videoUrl)

    // Save raw analysis to Azure Blob for debugging/audit
    const analysisData = {
      matchId,
      videoUrl,
      player1Id,
      player2Id,
      analyzedAt: new Date().toISOString(),
      rawAnalysis: analysis,
    }

    try {
      await saveMatchAnalysis(matchId, analysisData)
    } catch (blobError) {
      logger.error({ blobError, matchId }, 'Failed to save analysis to blob, continuing...')
    }

    if (!analysis) {
      logger.error({ matchId }, 'Analysis returned null')
      await updateMatchStatus(db, matchId, 'completed')
      return
    }

    // Determine winner
    const player1Score = analysis.player1Score
    const player2Score = analysis.player2Score
    const winnerId = player1Score > player2Score ? player1Id : player2Id

    // Calculate rewards
    const winnerScore = Math.max(player1Score, player2Score)
    const loserScore = Math.min(player1Score, player2Score)
    const rewards = calculateRewards(winnerScore, loserScore)

    // Save results
    await saveMatchResults(db, matchId, {
      player1Score,
      player2Score,
      winnerId,
      winnerXp: rewards.winnerXp,
      winnerRp: rewards.winnerRp,
      loserXp: rewards.loserXp,
    })

    logger.info({ matchId, player1Score, player2Score, winnerId }, 'Match analysis complete')
  } catch (error) {
    logger.error({ error, matchId }, 'Failed to analyze and save match results')
    await updateMatchStatus(db, matchId, 'completed')
  }
}
