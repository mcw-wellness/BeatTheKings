/**
 * Gemini API Client
 * Centralized client initialization for all Gemini operations
 * Uses @google/genai SDK (recommended over deprecated @google/generative-ai)
 */

import { GoogleGenAI } from '@google/genai'
import { logger } from '@/lib/utils/logger'

const apiKey = process.env.GEMINI_API_KEY

if (!apiKey) {
  logger.warn('GEMINI_API_KEY is not configured')
}

/**
 * Unified Gemini client for all operations (avatar, video analysis)
 * Uses @google/genai package
 */
export const geminiClient = apiKey ? new GoogleGenAI({ apiKey }) : null

// Legacy export for backwards compatibility with avatar generation
export const imageClient = geminiClient

/**
 * Check if Gemini is configured
 */
export function isGeminiConfigured(): boolean {
  return !!apiKey
}

/**
 * Get the Gemini client
 */
export function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    throw new Error('Gemini AI is not configured. Set GEMINI_API_KEY.')
  }
  return geminiClient
}
