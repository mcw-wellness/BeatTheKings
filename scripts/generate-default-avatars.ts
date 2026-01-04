/**
 * Script to generate default avatars using Gemini AI and upload to Azure Blob Storage
 * Run with: npx tsx scripts/generate-default-avatars.ts
 */

import { BlobServiceClient } from '@azure/storage-blob'
import { GoogleGenAI } from '@google/genai'
import { buildDefaultAvatarPrompt, DEFAULT_AVATARS } from '../src/lib/avatar/prompts'
import * as dotenv from 'dotenv'

dotenv.config()

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const AZURE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING
const CONTAINER_NAME = process.env.AZURE_STORAGE_CONTAINER_NAME || 'avatar'

if (!GEMINI_API_KEY) {
  console.error('Error: GEMINI_API_KEY is not set')
  process.exit(1)
}

if (!AZURE_CONNECTION_STRING) {
  console.error('Error: AZURE_STORAGE_CONNECTION_STRING is not set')
  process.exit(1)
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY })
const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_CONNECTION_STRING)
const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME)

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function generateAvatar(gender: string, sport: string, retries = 3): Promise<Buffer> {
  console.log(`Generating ${gender} ${sport} avatar...`)

  const prompt = buildDefaultAvatarPrompt(gender, sport)
  console.log(`  Prompt: ${prompt.slice(0, 80)}...`)

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: prompt,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    })

    const parts = response.candidates?.[0]?.content?.parts || []

    for (const part of parts) {
      if (part.inlineData?.data) {
        return Buffer.from(part.inlineData.data, 'base64')
      }
    }

    throw new Error('No image data in Gemini response')
  } catch (error: unknown) {
    const err = error as { message?: string; status?: number }
    console.log(`  Error: ${err.message || 'Unknown error'}`)

    if (err.status === 429 && retries > 0) {
      console.log(`  Rate limited, waiting 60s before retry...`)
      await sleep(60000)
      return generateAvatar(gender, sport, retries - 1)
    }

    throw error
  }
}

async function uploadToAzure(fileName: string, imageBuffer: Buffer): Promise<string> {
  const blobPath = `default/${fileName}`
  const blockBlobClient = containerClient.getBlockBlobClient(blobPath)

  await blockBlobClient.upload(imageBuffer, imageBuffer.length, {
    blobHTTPHeaders: { blobContentType: 'image/png' },
  })

  console.log(`  Uploaded: ${blockBlobClient.url}`)
  return blockBlobClient.url
}

async function main() {
  console.log('=== Generating Default Avatars ===\n')

  await containerClient.createIfNotExists()
  console.log(`Container '${CONTAINER_NAME}' ready\n`)

  for (const config of DEFAULT_AVATARS) {
    try {
      const imageBuffer = await generateAvatar(config.gender, config.sport)
      await uploadToAzure(config.fileName, imageBuffer)
      console.log(`✓ ${config.fileName} created successfully\n`)
    } catch (error) {
      console.error(`✗ Failed to create ${config.fileName}:`, error)
    }

    // Small delay between requests to avoid rate limiting
    await sleep(2000)
  }

  console.log('\n=== Done ===')
}

main().catch(console.error)
