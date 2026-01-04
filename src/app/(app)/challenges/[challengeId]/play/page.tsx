'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface ChallengeDetail {
  id: string
  name: string
  challengeType: string
  difficulty: string
  xpReward: number
  rpReward: number
}

type GameState = 'ready' | 'playing' | 'submitting'

export default function ChallengePlayPage(): JSX.Element {
  const router = useRouter()
  const params = useParams()
  const challengeId = params.challengeId as string

  const [challenge, setChallenge] = useState<ChallengeDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [gameState, setGameState] = useState<GameState>('ready')
  const [scoreValue, setScoreValue] = useState(0)
  const [maxValue, setMaxValue] = useState(0)

  const fetchChallenge = useCallback(async (): Promise<void> => {
    if (!challengeId) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/challenges/${challengeId}`)

      if (!response.ok) {
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

  const handleStart = (): void => {
    setGameState('playing')
    setScoreValue(0)
    setMaxValue(0)
  }

  const handleMade = (): void => {
    setScoreValue((prev) => prev + 1)
    setMaxValue((prev) => prev + 1)
  }

  const handleMissed = (): void => {
    setMaxValue((prev) => prev + 1)
  }

  const handleStop = async (): Promise<void> => {
    if (maxValue === 0) {
      setError('You need at least one attempt')
      return
    }

    setGameState('submitting')
    setError(null)

    try {
      const response = await fetch(`/api/challenges/${challengeId}/attempt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scoreValue, maxValue }),
      })

      const result = await response.json()

      if (response.ok) {
        const params = new URLSearchParams({
          score: scoreValue.toString(),
          max: maxValue.toString(),
          xp: result.xpEarned.toString(),
          rp: result.rpEarned.toString(),
          message: result.message,
        })
        router.push(`/challenges/${challengeId}/result?${params.toString()}`)
      } else {
        setError(result.error || 'Failed to submit')
        setGameState('playing')
      }
    } catch {
      setError('Failed to submit attempt')
      setGameState('playing')
    }
  }

  const handleCancel = (): void => {
    router.back()
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#4361EE] border-t-transparent" />
      </main>
    )
  }

  if (error && gameState === 'ready') {
    return (
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center p-4">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={() => router.back()} className="text-[#4361EE] underline">
          Go Back
        </button>
      </main>
    )
  }

  if (!challenge) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center p-4">
        <p className="text-red-500 mb-4">Challenge not found</p>
        <button onClick={() => router.back()} className="text-[#4361EE] underline">
          Go Back
        </button>
      </main>
    )
  }

  const accuracy = maxValue > 0 ? Math.round((scoreValue / maxValue) * 100) : 0

  // Ready state - show start button
  if (gameState === 'ready') {
    return (
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-lg mx-auto min-h-screen flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <button onClick={handleCancel} className="text-gray-600 hover:text-gray-900">
                ← Back
              </button>
              <h1 className="text-xl font-bold text-gray-900">{challenge.name}</h1>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-10 text-center w-full max-w-sm">
              <div className="w-20 h-20 md:w-24 md:h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl md:text-5xl">🏀</span>
              </div>

              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Ready to Play?</h2>
              <p className="text-gray-600 mb-6 text-sm md:text-base">
                Tap +1 for made shots, -1 for misses. Hit STOP when done.
              </p>

              <button
                onClick={handleStart}
                className="w-full py-4 md:py-5 bg-green-500 hover:bg-green-600 text-white text-lg md:text-xl font-bold rounded-xl shadow-lg active:scale-[0.98] transition-transform"
              >
                START CHALLENGE
              </button>
            </div>
          </div>
        </div>
      </main>
    )
  }

  // Playing state - show counter
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-lg mx-auto min-h-screen flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900 text-center">{challenge.name}</h1>
        </div>

        {/* Score Display */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-10 text-center w-full max-w-sm mb-6">
            <p className="text-gray-500 text-sm mb-2">Your Score</p>
            <p className="text-5xl md:text-6xl font-bold text-gray-900">
              {scoreValue}
              <span className="text-gray-400">/{maxValue}</span>
            </p>
            <p
              className={`text-2xl md:text-3xl font-semibold mt-2 ${accuracy >= 80 ? 'text-green-500' : accuracy >= 50 ? 'text-yellow-500' : 'text-red-500'}`}
            >
              {accuracy}%
            </p>
          </div>

          {/* Counter Buttons */}
          <div className="flex items-center gap-6 md:gap-10">
            <button
              onClick={handleMissed}
              disabled={gameState === 'submitting'}
              className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white text-2xl md:text-4xl font-bold shadow-lg active:scale-95 transition-transform flex items-center justify-center"
            >
              -1
            </button>
            <button
              onClick={handleMade}
              disabled={gameState === 'submitting'}
              className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white text-2xl md:text-4xl font-bold shadow-lg active:scale-95 transition-transform flex items-center justify-center"
            >
              +1
            </button>
          </div>

          {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
        </div>

        {/* Stop Button */}
        <div className="p-4 md:p-6 border-t border-gray-200 bg-white">
          <button
            onClick={handleStop}
            disabled={gameState === 'submitting' || maxValue === 0}
            className="w-full py-4 md:py-5 bg-[#4361EE] hover:bg-[#3651DE] disabled:bg-gray-400 text-white text-lg font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {gameState === 'submitting' ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
            ) : (
              <>
                <span>STOP & Submit</span>
              </>
            )}
          </button>
          <p className="text-gray-500 text-xs text-center mt-2">
            Tap when you&apos;re done to submit your score
          </p>
        </div>
      </div>
    </main>
  )
}
