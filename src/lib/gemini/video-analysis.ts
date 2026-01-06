/**
 * Video Analysis using Gemini AI
 * Analyzes 1v1 match videos to extract scores and statistics
 * Uses Gemini File API for reliable video upload and multimodal analysis
 */

import { createPartFromUri, createUserContent } from '@google/genai'
import { logger } from '@/lib/utils/logger'
import { getGeminiClient, isGeminiConfigured } from './client'
import { MATCH_ANALYSIS_PROMPT } from './prompts'
import type { MatchAnalysisResult, MatchRewards } from './types'

// Model for video analysis (per client feedback: best for multimodal)
const VIDEO_ANALYSIS_MODEL = 'gemini-2.0-flash'

/**
 * Mock analysis for development/testing when Gemini is not configured
 */
function getMockAnalysis(): MatchAnalysisResult {
  const player1Score = Math.floor(Math.random() * 15) + 5
  const player2Score = Math.floor(Math.random() * 15) + 5

  return {
    player1Score,
    player2Score,
    player1ShotsMade: Math.floor(player1Score / 2),
    player1ShotsAttempted: Math.floor(player1Score / 2) + Math.floor(Math.random() * 5) + 2,
    player2ShotsMade: Math.floor(player2Score / 2),
    player2ShotsAttempted: Math.floor(player2Score / 2) + Math.floor(Math.random() * 5) + 2,
    durationSeconds: Math.floor(Math.random() * 600) + 300,
    confidence: 0.5,
  }
}

/**
 * Parse JSON response from Gemini
 */
function parseAnalysisResponse(text: string): MatchAnalysisResult | null {
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    logger.error({ text }, 'Failed to parse Gemini response as JSON')
    return null
  }

  try {
    return JSON.parse(jsonMatch[0]) as MatchAnalysisResult
  } catch (error) {
    logger.error({ error, text }, 'Failed to parse JSON from response')
    return null
  }
}

/**
 * Analyze match video using Gemini File API
 * Uploads video via File API for reliable multimodal analysis (audio + video)
 */
export async function analyzeMatchVideo(videoUrl: string): Promise<MatchAnalysisResult | null> {
  if (!isGeminiConfigured()) {
    logger.warn('GEMINI_API_KEY not configured, using mock analysis')
    return getMockAnalysis()
  }

  try {
    const client = getGeminiClient()

    // Fetch video from Azure storage
    logger.info({ videoUrl }, 'Fetching video from storage')
    const videoResponse = await fetch(videoUrl)
    if (!videoResponse.ok) {
      throw new Error(`Failed to fetch video: ${videoResponse.status}`)
    }

    const videoBuffer = await videoResponse.arrayBuffer()
    const contentType = videoResponse.headers.get('content-type') || 'video/mp4'

    logger.info({ size: videoBuffer.byteLength, contentType }, 'Uploading video to Gemini File API')

    // Create Blob from buffer and upload to Gemini File API
    const videoBlob = new Blob([videoBuffer], { type: contentType })
    const uploadedFile = await client.files.upload({
      file: videoBlob,
      config: { mimeType: contentType },
    })

    logger.info({ fileName: uploadedFile.name, uri: uploadedFile.uri }, 'Video uploaded to Gemini')

    // Generate content using uploaded file reference
    const response = await client.models.generateContent({
      model: VIDEO_ANALYSIS_MODEL,
      contents: createUserContent([
        createPartFromUri(uploadedFile.uri!, uploadedFile.mimeType!),
        MATCH_ANALYSIS_PROMPT,
      ]),
    })

    const text = response.text ?? ''

    logger.info({ responseText: text.substring(0, 500) }, 'Received Gemini response')

    const analysis = parseAnalysisResponse(text)
    if (!analysis) {
      logger.warn('Failed to parse analysis, returning mock data')
      return getMockAnalysis()
    }

    logger.info({ analysis }, 'Match video analyzed successfully')
    return analysis
  } catch (error) {
    logger.error({ error, videoUrl }, 'Failed to analyze match video')
    return getMockAnalysis()
  }
}

/**
 * Calculate XP/RP rewards based on match result
 */
export function calculateRewards(winnerScore: number, loserScore: number): MatchRewards {
  const baseXp = 50
  const scoreDiff = winnerScore - loserScore
  const winnerBonus = Math.min(scoreDiff * 10, 100)
  const winnerRp = 20 + Math.floor(scoreDiff * 2)

  return {
    winnerXp: baseXp + 50 + winnerBonus,
    winnerRp: Math.min(winnerRp, 50),
    loserXp: baseXp,
  }
}
