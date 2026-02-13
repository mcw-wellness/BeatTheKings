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
      <main
        className="h-dvh flex items-center justify-center relative"
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

  if (error || !match) {
    return (
      <main
        className="h-dvh flex flex-col items-center justify-center p-4 relative"
        style={{
          backgroundImage: 'url(/backgrounds/stadium.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none" />
        <p className="text-red-300 mb-4 relative z-10">{error || 'Match not found'}</p>
        <button
          onClick={() => router.back()}
          className="text-white/80 hover:text-white underline relative z-10"
        >
          Go Back
        </button>
      </main>
    )
  }

  const you = isChallenger ? match.player1 : match.player2
  const opponent = isChallenger ? match.player2 : match.player1

  return (
    <main
      className="h-dvh relative"
      style={{
        backgroundImage: 'url(/backgrounds/stadium.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none" />
      <div className="h-full flex flex-col relative z-10">
        {/* Header */}
        <header className="p-4 border-b border-white/20 bg-black/20 backdrop-blur">
          <h1 className="text-xl font-bold text-white text-center">Ready to Play!</h1>
          <p className="text-sm text-white/60 text-center mt-1">{match.venueName}</p>
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
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <p className="font-semibold text-white text-sm md:text-base">{you.name || 'You'}</p>
              <span className="text-xs text-green-400">Ready</span>
            </div>

            {/* VS */}
            <div className="text-2xl md:text-4xl font-bold text-white/50">VS</div>

            {/* Opponent */}
            <div className="text-center">
              <div className="w-20 h-20 md:w-28 md:h-28 rounded-full overflow-hidden border-4 border-blue-500 mx-auto mb-2">
                <Image
                  src={opponent.avatar.imageUrl}
                  alt={opponent.name || 'Opponent'}
                  width={112}
                  height={112}
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <p className="font-semibold text-white text-sm md:text-base">
                {opponent.name || 'Opponent'}
              </p>
              <span className="text-xs text-blue-400">Ready</span>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-white/10 backdrop-blur rounded-xl border border-white/20 p-4 md:p-6 w-full max-w-sm mb-6">
            <h2 className="font-semibold text-white mb-3 text-center">Recording Tips</h2>
            <ul className="space-y-2 text-sm text-white/80">
              <li className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                Position phone to capture both players
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                Ensure good lighting
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                Record the entire match
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                AI will count scores automatically
              </li>
            </ul>
          </div>
        </div>

        {/* Start Button */}
        <div className="p-4 md:p-6 border-t border-white/20 bg-black/20 backdrop-blur">
          <button
            onClick={handleStartRecording}
            disabled={isStarting}
            className="w-full py-4 md:py-5 bg-red-500/80 hover:bg-red-500 disabled:bg-white/30 text-white text-lg font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
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
          <p className="text-white/50 text-xs text-center mt-2">
            Both players should be ready before starting
          </p>
        </div>
      </div>
    </main>
  )
}
