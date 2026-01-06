import { GoogleGenAI } from '@google/genai'
import { buildAvatarPrompt } from '../src/lib/avatar/prompts'
import * as dotenv from 'dotenv'
dotenv.config()

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

async function test() {
  console.log('Testing Gemini 2.5 Flash Image generation...\n')

  const prompt = buildAvatarPrompt({
    gender: 'male',
    skinTone: 'medium',
    hairStyle: 'short',
    hairColor: 'black',
    sport: 'basketball',
  })

  console.log('Prompt:', prompt, '\n')

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: prompt,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    })

    console.log('✓ Success!')

    const parts = response.candidates?.[0]?.content?.parts || []

    for (const part of parts) {
      if (part.text) {
        console.log('  Text:', part.text.slice(0, 100))
      }
      if (part.inlineData) {
        console.log('  Got image data!')
        console.log('  MIME type:', part.inlineData.mimeType)
        console.log('  Data length:', part.inlineData.data?.length, 'chars')
      }
    }
  } catch (e: unknown) {
    const err = e as { message?: string }
    console.log('✗ Error:', err.message)
  }
}

test()
