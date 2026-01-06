'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'

interface Player {
  id: string
  name: string | null
  avatar: { imageUrl: string }
}

interface Match {
  id: string
  status: string
  venueName: string
  player1: Player
  player2: Player
}

export default function MatchReadyPage(): JSX.Element {
  const router = useRouter()
  const params = useParams()
  const matchId = params.matchId as string

  const [match, setMatch] = useState<Match | null>(null)
  const [isChallenger, setIsChallenger] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isStarting, setIsStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMatch = useCallback(async () => {
    try {
      const response = await fetch(`/api/challenges/1v1/${matchId}`)
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to load match')
        return
      }

      setMatch(data.match)
      setIsChallenger(data.isChallenger)

      // Redirect if not accepted yet
      if (data.match.status === 'pending') {
        router.push(`/challenges/1v1/${matchId}/pending`)
      } else if (data.match.status === 'in_progress') {
        router.push(`/challenges/1v1/${matchId}/record`)
      }
    } catch {
      setError('Failed to load match')
    } finally {
      setIsLoading(false)
    }
  }, [matchId, router])

  useEffect(() => {
    fetchMatch()
  }, [fetchMatch])

  const handleStartRecording = async () => {
    setIsStarting(true)
    setError(null)

    try {
      const response = await fetch(`/api/challenges/1v1/${matchId}`, {
        method: 'POST',
      })

      if (response.ok) {
        router.push(`/challenges/1v1/${matchId}/record`)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to start match')
        setIsStarting(false)
      }
    } catch {
      setError('Failed to start match')
      setIsStarting(false)
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#4361EE] border-t-transparent" />
      </main>
    )
  }

  if (error || !match) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center p-4">
        <p className="text-red-500 mb-4">{error || 'Match not found'}</p>
        <button onClick={() => router.back()} className="text-[#4361EE] underline">
          Go Back
        </button>
      </main>
    )
  }

  const you = isChallenger ? match.player1 : match.player2
  const opponent = isChallenger ? match.player2 : match.player1

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-lg mx-auto min-h-screen flex flex-col">
        {/* Header */}
        <header className="p-4 border-b border-gray-200 bg-white">
          <h1 className="text-xl font-bold text-gray-900 text-center">Ready to Play!</h1>
          <p className="text-sm text-gray-500 text-center mt-1">{match.venueName}</p>
        </header>

        {/* VS Display */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
          <div className="flex items-center gap-4 md:gap-8 mb-8">
            {/* You */}
            <div className="text-center">
              <div className="w-20 h-20 md:w-28 md:h-28 rounded-full overflow-hidden border-4 border-green-500 mx-auto mb-2">
                <Image
                  src={you.avatar.imageUrl}
                  alt={you.name || 'You'}
                  width={112}
                  height={112}
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="font-semibold text-gray-900 text-sm md:text-base">
                {you.name || 'You'}
              </p>
              <span className="text-xs text-green-600">Ready</span>
            </div>

            {/* VS */}
            <div className="text-2xl md:text-4xl font-bold text-gray-400">VS</div>

            {/* Opponent */}
            <div className="text-center">
              <div className="w-20 h-20 md:w-28 md:h-28 rounded-full overflow-hidden border-4 border-blue-500 mx-auto mb-2">
                <Image
                  src={opponent.avatar.imageUrl}
                  alt={opponent.name || 'Opponent'}
                  width={112}
                  height={112}
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="font-semibold text-gray-900 text-sm md:text-base">
                {opponent.name || 'Opponent'}
              </p>
              <span className="text-xs text-blue-600">Ready</span>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 w-full max-w-sm mb-6">
            <h2 className="font-semibold text-gray-900 mb-3 text-center">Recording Tips</h2>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                Position phone to capture both players
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                Ensure good lighting
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                Record the entire match
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                AI will count scores automatically
              </li>
            </ul>
          </div>
        </div>

        {/* Start Button */}
        <div className="p-4 md:p-6 border-t border-gray-200 bg-white">
          <button
            onClick={handleStartRecording}
            disabled={isStarting}
            className="w-full py-4 md:py-5 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white text-lg font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {isStarting ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
            ) : (
              <>
                <span className="text-2xl">●</span>
                <span>Start Recording</span>
              </>
            )}
          </button>
          <p className="text-gray-500 text-xs text-center mt-2">
            Both players should be ready before starting
          </p>
        </div>
      </div>
    </main>
  )
}
