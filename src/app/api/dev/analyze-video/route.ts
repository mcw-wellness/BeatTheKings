/**
 * Dev API Route - Video Analysis Testing
 * For internal testing of Gemini video analysis
 * TODO: Remove or protect this route in production
 */

import { NextRequest, NextResponse } from 'next/server'
import { createPartFromUri, createUserContent } from '@google/genai'
import { logger } from '@/lib/utils/logger'
import { getGeminiClient, isGeminiConfigured } from '@/lib/gemini/client'
import { MATCH_ANALYSIS_PROMPT } from '@/lib/gemini/prompts'

const VIDEO_ANALYSIS_MODEL = 'gemini-2.0-flash'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    if (!isGeminiConfigured()) {
      return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 })
    }

    const formData = await request.formData()
    const videoFile = formData.get('video') as File | null
    const customPrompt = formData.get('prompt') as string | null

    if (!videoFile) {
      return NextResponse.json({ error: 'No video file provided' }, { status: 400 })
    }

    const client = getGeminiClient()
    const prompt = customPrompt || MATCH_ANALYSIS_PROMPT

    // Get video buffer
    const videoBuffer = await videoFile.arrayBuffer()
    const contentType = videoFile.type || 'video/mp4'

    logger.info(
      { fileName: videoFile.name, size: videoBuffer.byteLength, contentType },
      '[Dev] Uploading video to Gemini'
    )

    // Upload to Gemini File API
    const videoBlob = new Blob([videoBuffer], { type: contentType })
    const uploadedFile = await client.files.upload({
      file: videoBlob,
      config: { mimeType: contentType },
    })

    logger.info({ fileName: uploadedFile.name, uri: uploadedFile.uri }, '[Dev] Video uploaded')

    // Generate content
    const startTime = Date.now()
    const response = await client.models.generateContent({
      model: VIDEO_ANALYSIS_MODEL,
      contents: createUserContent([
        createPartFromUri(uploadedFile.uri!, uploadedFile.mimeType!),
        prompt,
      ]),
    })
    const analysisTime = Date.now() - startTime

    const rawResponse = response.text ?? ''

    // Try to parse JSON from response
    let parsedResult = null
    let parseError = null
    try {
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsedResult = JSON.parse(jsonMatch[0])
      } else {
        parseError = 'No JSON object found in response'
      }
    } catch (e) {
      parseError = e instanceof Error ? e.message : 'Failed to parse JSON'
    }

    logger.info({ analysisTime, hasResult: !!parsedResult }, '[Dev] Analysis complete')

    return NextResponse.json({
      success: true,
      promptUsed: prompt,
      rawResponse,
      parsedResult,
      parseError,
      metadata: {
        fileName: videoFile.name,
        fileSize: videoBuffer.byteLength,
        contentType,
        model: VIDEO_ANALYSIS_MODEL,
        analysisTimeMs: analysisTime,
        geminiFile: {
          name: uploadedFile.name,
          uri: uploadedFile.uri,
        },
      },
    })
  } catch (error) {
    logger.error({ error }, '[Dev] Video analysis failed')
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Analysis failed',
      },
      { status: 500 }
    )
  }
}
