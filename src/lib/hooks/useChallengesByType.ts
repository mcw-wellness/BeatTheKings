import { useState, useEffect } from 'react'
import { logger } from '@/lib/utils/logger'

interface BestScore {
  scoreValue: number
  maxValue: number
  accuracy: number
}

interface ChallengeWithAttempts {
  id: string
  name: string
  description: string
  difficulty: string
  xpReward: number
  venueName: string
  venueId: string
  attempts: number
  bestScore: BestScore | null
}

interface ByTypeResponse {
  challengeType: string
  displayName: string
  total: number
  completed: number
  challenges: ChallengeWithAttempts[]
}

interface UseChallengesByTypeResult {
  data: ByTypeResponse | null
  isLoading: boolean
  error: string | null
}

export function useChallengesByType(type: string): UseChallengesByTypeResult {
  const [data, setData] = useState<ByTypeResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        const response = await fetch(`/api/challenges/by-type/${type}`)
        if (!response.ok) {
          throw new Error('Failed to load challenges')
        }
        const json = await response.json()
        setData(json)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Something went wrong'
        logger.error({ error: err, type }, 'Failed to fetch challenges by type')
        setError(message)
      } finally {
        setIsLoading(false)
      }
    }
    fetchChallenges()
  }, [type])

  return { data, isLoading, error }
}
