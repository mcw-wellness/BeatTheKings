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
}

export default function MatchRespondPage(): JSX.Element {
  const router = useRouter()
  const params = useParams()
  const matchId = params.matchId as string

  const [match, setMatch] = useState<Match | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isResponding, setIsResponding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMatch = useCallback(async () => {
    try {
      const response = await fetch(`/api/challenges/1v1/${matchId}`)
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to load challenge')
        return
      }

      setMatch(data.match)

      if (data.match.status !== 'pending') {
        router.push(`/challenges/1v1/${matchId}/ready`)
      }
    } catch {
      setError('Failed to load challenge')
    } finally {
      setIsLoading(false)
    }
  }, [matchId, router])

  useEffect(() => {
    fetchMatch()
  }, [fetchMatch])

  const handleRespond = async (accept: boolean): Promise<void> => {
    setIsResponding(true)
    setError(null)

    try {
      const response = await fetch(`/api/challenges/1v1/${matchId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accept }),
      })

      if (response.ok) {
        if (accept) {
          router.push(`/challenges/1v1/${matchId}/ready`)
        } else {
          router.push('/matches')
        }
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to respond')
        setIsResponding(false)
      }
    } catch {
      setError('Failed to respond')
      setIsResponding(false)
    }
  }

  if (isLoading) {
    return (
      <main className="h-dvh flex items-center justify-center relative" style={bgStyle}>
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none" />
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent relative z-10" />
      </main>
    )
  }

  if (error || !match) {
    return (
      <main
        className="h-dvh flex flex-col items-center justify-center p-4 relative"
        style={bgStyle}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none" />
        <p className="text-red-300 mb-4 relative z-10">{error || 'Challenge not found'}</p>
        <button
          onClick={() => router.push('/matches')}
          className="text-white/80 hover:text-white underline relative z-10"
        >
          Back to Matches
        </button>
      </main>
    )
  }

  const challenger = match.player1

  return (
    <main className="h-dvh relative" style={bgStyle}>
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none" />
      <div className="h-full flex flex-col relative z-10">
        <header className="p-4 border-b border-white/20 bg-black/20 backdrop-blur">
          <h1 className="text-xl font-bold text-white text-center">Challenge Received</h1>
          <p className="text-sm text-white/60 text-center mt-1">{match.venueName}</p>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="relative mb-6">
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-yellow-400/60 mx-auto">
              {challenger.avatar?.imageUrl ? (
                <Image
                  src={challenger.avatar.imageUrl}
                  alt={challenger.name || 'Challenger'}
                  width={112}
                  height={112}
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <div className="w-full h-full bg-white/20 flex items-center justify-center">
                  <span className="text-4xl">👤</span>
                </div>
              )}
            </div>
          </div>

          <h2 className="text-xl font-bold text-white mb-2">
            {challenger.name || 'A player'} challenged you!
          </h2>
          <p className="text-white/60 text-sm mb-8">Do you accept the 1v1 challenge?</p>
        </div>

        <div className="p-4 border-t border-white/20 bg-black/20 backdrop-blur space-y-3">
          <button
            onClick={() => handleRespond(true)}
            disabled={isResponding}
            className="w-full py-4 bg-gradient-to-r from-orange-500 to-yellow-400 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            {isResponding ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
            ) : (
              'Accept Challenge'
            )}
          </button>
          <button
            onClick={() => handleRespond(false)}
            disabled={isResponding}
            className="w-full py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-colors border border-white/20 disabled:opacity-50"
          >
            Decline
          </button>
        </div>
      </div>
    </main>
  )
}

const bgStyle = {
  backgroundImage: 'url(/backgrounds/stadium.png)',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
}
