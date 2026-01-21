'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface ChallengeDetail {
  id: string
  name: string
  description: string
  instructions: string
  challengeType: string
  difficulty: string
  xpReward: number
  rpReward: number
  sportName: string
  venueName: string
  myAttempts: number
  myBestScore: { scoreValue: number; maxValue: number } | null
}

export default function ChallengeDetailPage(): JSX.Element {
  const router = useRouter()
  const params = useParams()
  const challengeId = params.challengeId as string

  const [challenge, setChallenge] = useState<ChallengeDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchChallenge = useCallback(async (): Promise<void> => {
    if (!challengeId) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/challenges/${challengeId}`)

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Challenge not found')
        }
        throw new Error('Failed to load challenge')
      }

      const json = await response.json()
      setChallenge(json.challenge)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }, [challengeId])

  useEffect(() => {
    fetchChallenge()
  }, [fetchChallenge])

  const getDifficultyColor = (difficulty: string): string => {
    if (difficulty === 'easy') return 'bg-green-500/20 text-green-300'
    if (difficulty === 'medium') return 'bg-yellow-500/20 text-yellow-300'
    return 'bg-red-500/20 text-red-300'
  }

  const startChallenge = (): void => {
    router.push(`/challenges/${challengeId}/play`)
  }

  if (isLoading) {
    return (
      <main
        className="min-h-screen flex items-center justify-center relative"
        style={{
          backgroundImage: 'url(/backgrounds/stadium.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none" />
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent relative z-10" />
      </main>
    )
  }

  if (error || !challenge) {
    return (
      <main
        className="min-h-screen flex flex-col items-center justify-center p-4 relative"
        style={{
          backgroundImage: 'url(/backgrounds/stadium.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none" />
        <p className="text-red-300 mb-4 relative z-10">{error || 'Challenge not found'}</p>
        <button
          onClick={() => router.back()}
          className="text-white/80 hover:text-white underline relative z-10"
        >
          Go Back
        </button>
      </main>
    )
  }

  const bestAccuracy = challenge.myBestScore
    ? Math.round((challenge.myBestScore.scoreValue / challenge.myBestScore.maxValue) * 100)
    : null

  return (
    <main
      className="min-h-screen relative"
      style={{
        backgroundImage: 'url(/backgrounds/stadium.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Light overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none" />

      <div className="max-w-lg mx-auto p-4 space-y-4 relative z-10">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-white/80 hover:text-white">
            ← Back
          </button>
          <h1 className="text-xl font-bold text-white flex-1">{challenge.name}</h1>
        </div>

        {/* Challenge Info Card */}
        <div className="bg-white/10 backdrop-blur rounded-xl border border-white/20 p-4">
          <div className="flex items-center gap-2 mb-3">
            <span
              className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(challenge.difficulty)}`}
            >
              {challenge.difficulty.toUpperCase()}
            </span>
            <span className="text-white/50 text-xs">{challenge.sportName}</span>
          </div>

          <p className="text-white/70 mb-3">{challenge.description}</p>

          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <span className="text-yellow-400">⭐</span>
              <span className="text-white font-medium">{challenge.xpReward} XP</span>
            </div>
            {challenge.rpReward > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-purple-400">💎</span>
                <span className="text-white font-medium">{challenge.rpReward} RP</span>
              </div>
            )}
          </div>

          <p className="text-white/50 text-xs mt-2">📍 {challenge.venueName}</p>
        </div>

        {/* Instructions Card */}
        <div className="bg-white/10 backdrop-blur rounded-xl border border-white/20 p-4">
          <h2 className="font-semibold text-white mb-2 flex items-center gap-2">
            <span>📋</span>
            <span>Instructions</span>
          </h2>
          <p className="text-white/70 whitespace-pre-line">{challenge.instructions}</p>
        </div>

        {/* Stats Card */}
        {challenge.myAttempts > 0 && (
          <div className="bg-green-500/20 backdrop-blur border border-green-500/40 rounded-xl p-4">
            <h2 className="font-semibold text-white mb-2 flex items-center gap-2">
              <span>📊</span>
              <span>Your Stats</span>
            </h2>
            <div className="flex items-center gap-6">
              <div>
                <p className="text-white/60 text-xs">Attempts</p>
                <p className="text-white font-bold text-lg">{challenge.myAttempts}</p>
              </div>
              {challenge.myBestScore && (
                <div>
                  <p className="text-white/60 text-xs">Best Score</p>
                  <p className="text-white font-bold text-lg">
                    {challenge.myBestScore.scoreValue}/{challenge.myBestScore.maxValue}
                    <span className="text-green-300 text-sm ml-1">({bestAccuracy}%)</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* RP Hint */}
        <div className="bg-purple-500/20 border border-purple-500/40 rounded-lg p-3">
          <p className="text-purple-300 text-xs">
            💡 Tip: Achieve 80% accuracy or higher to earn {challenge.rpReward} RP!
          </p>
        </div>

        {/* Start Button */}
        <button
          onClick={startChallenge}
          className="w-full py-4 bg-green-500/80 hover:bg-green-500 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <span>🎯</span>
          <span>Start Challenge</span>
        </button>
      </div>
    </main>
  )
}
