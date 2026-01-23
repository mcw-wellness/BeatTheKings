/**
 * Generate reference images for avatar items (jerseys, shoes)
 * Run with: npx tsx scripts/generate-item-images.ts
 */

import 'dotenv/config'
import * as fs from 'fs'
import * as path from 'path'
import { Pool } from 'pg'
import {
  JERSEY_DESIGNS,
  SHOE_DESIGNS,
  buildJerseyImagePrompt,
  buildShoesImagePrompt,
} from '../src/lib/gemini/prompts'

async function generateImage(prompt: string): Promise<Buffer | null> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error('GEMINI_API_KEY not set')
    return null
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
        }),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error('Gemini API error:', error)
      return null
    }

    const data = await response.json()
    const parts = data.candidates?.[0]?.content?.parts || []

    for (const part of parts) {
      if (part.inlineData?.data) {
        return Buffer.from(part.inlineData.data, 'base64')
      }
    }

    console.error('No image in response')
    return null
  } catch (error) {
    console.error('Failed to generate image:', error)
    return null
  }
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })

  const jerseysDir = path.join(process.cwd(), 'public', 'items', 'jerseys')
  const shoesDir = path.join(process.cwd(), 'public', 'items', 'shoes')

  fs.mkdirSync(jerseysDir, { recursive: true })
  fs.mkdirSync(shoesDir, { recursive: true })

  console.log('Generating jersey images...\n')

  for (const [name, description] of Object.entries(JERSEY_DESIGNS)) {
    const fileName = name.toLowerCase().replace(/\s+/g, '-') + '.png'
    const filePath = path.join(jerseysDir, fileName)
    const publicUrl = `/items/jerseys/${fileName}`

    // Check if already exists in DB with image
    const existing = await pool.query('SELECT "imageUrl" FROM "AvatarItem" WHERE name = $1', [name])
    if (existing.rows[0]?.imageUrl) {
      console.log(`  [SKIP] ${name} - already has image`)
      continue
    }

    console.log(`  Generating: ${name}...`)
    const prompt = buildJerseyImagePrompt(description)

    const imageBuffer = await generateImage(prompt)
    if (imageBuffer) {
      fs.writeFileSync(filePath, imageBuffer)
      await pool.query('UPDATE "AvatarItem" SET "imageUrl" = $1 WHERE name = $2', [publicUrl, name])
      console.log(`  [OK] ${name}`)
    } else {
      console.log(`  [FAIL] ${name}`)
    }

    await new Promise((r) => setTimeout(r, 3000)) // Rate limit
  }

  console.log('\nGenerating shoe images...\n')

  for (const [name, description] of Object.entries(SHOE_DESIGNS)) {
    const fileName = name.toLowerCase().replace(/\s+/g, '-') + '.png'
    const filePath = path.join(shoesDir, fileName)
    const publicUrl = `/items/shoes/${fileName}`

    const existing = await pool.query('SELECT "imageUrl" FROM "AvatarItem" WHERE name = $1', [name])
    if (existing.rows[0]?.imageUrl) {
      console.log(`  [SKIP] ${name} - already has image`)
      continue
    }

    console.log(`  Generating: ${name}...`)
    const prompt = buildShoesImagePrompt(description)

    const imageBuffer = await generateImage(prompt)
    if (imageBuffer) {
      fs.writeFileSync(filePath, imageBuffer)
      await pool.query('UPDATE "AvatarItem" SET "imageUrl" = $1 WHERE name = $2', [publicUrl, name])
      console.log(`  [OK] ${name}`)
    } else {
      console.log(`  [FAIL] ${name}`)
    }

    await new Promise((r) => setTimeout(r, 3000)) // Rate limit
  }

  console.log('\nDone! Checking results...\n')

  const items = await pool.query(
    `SELECT name, "itemType", "imageUrl" FROM "AvatarItem" WHERE "itemType" IN ('jersey', 'shoes') ORDER BY "itemType", name`
  )
  items.rows.forEach((i) => console.log(`  ${i.itemType}: ${i.name} ${i.imageUrl ? '✓' : '✗'}`))

  await pool.end()
}

main().catch(console.error)
