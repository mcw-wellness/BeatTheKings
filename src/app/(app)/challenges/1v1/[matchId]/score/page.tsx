'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface MatchData {
  status: string
  recordingBy: string | null
  videoUrl: string | null
  player1: { id: string; name: string | null }
  player2: { id: string; name: string | null }
}

export default function MatchScorePage(): JSX.Element {
  const router = useRouter()
  const params = useParams()
  const matchId = params.matchId as string

  const [match, setMatch] = useState<MatchData | null>(null)
  const [player1Score, setPlayer1Score] = useState('')
  const [player2Score, setPlayer2Score] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMatch = useCallback(async () => {
    const res = await fetch(`/api/challenges/1v1/${matchId}`, { cache: 'no-store' })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Failed to load match')
      return
    }

    const currentUserId = data.isChallenger ? data.match.player1.id : data.match.player2.id
    if (data.match.recordingBy !== currentUserId) {
      router.push(`/challenges/1v1/${matchId}/waiting`)
      return
    }

    if (!data.match.videoUrl) {
      router.push(`/challenges/1v1/${matchId}/record`)
      return
    }

    if (data.match.status === 'completed' || data.match.status === 'disputed') {
      router.push(`/challenges/1v1/${matchId}/results`)
      return
    }

    setMatch(data.match)
  }, [matchId, router])

  useEffect(() => {
    fetchMatch()
  }, [fetchMatch])

  const handleSubmit = async (): Promise<void> => {
    const p1 = Number(player1Score)
    const p2 = Number(player2Score)

    if (!Number.isFinite(p1) || !Number.isFinite(p2)) {
      setError('Both scores are required')
      return
    }
    if (p1 < 0 || p2 < 0) {
      setError('Scores cannot be negative')
      return
    }

    setIsSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/matches/${matchId}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player1Score: p1, player2Score: p2 }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to submit scores')
        setIsSubmitting(false)
        return
      }

      router.push(`/challenges/1v1/${matchId}/results`)
    } catch {
      setError('Failed to submit scores')
      setIsSubmitting(false)
    }
  }

  if (!match) {
    return (
      <main className="h-dvh flex items-center justify-center relative" style={bgStyle}>
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none" />
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent relative z-10" />
      </main>
    )
  }

  return (
    <main className="h-dvh flex items-center justify-center p-4 relative" style={bgStyle}>
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none" />
      <div className="relative z-10 bg-white/10 backdrop-blur rounded-xl border border-white/20 p-6 max-w-sm w-full">
        <h1 className="text-xl font-bold text-white mb-1">Enter Match Scores</h1>
        <p className="text-white/60 text-sm mb-5">Enter both players’ final scores</p>

        <div className="space-y-4">
          <label className="block">
            <span className="text-white/80 text-sm">{match.player1.name || 'Player 1'} score</span>
            <input
              type="number"
              min={0}
              value={player1Score}
              onChange={(e) => setPlayer1Score(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
            />
          </label>

          <label className="block">
            <span className="text-white/80 text-sm">{match.player2.name || 'Player 2'} score</span>
            <input
              type="number"
              min={0}
              value={player2Score}
              onChange={(e) => setPlayer2Score(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
            />
          </label>
        </div>

        {error && <p className="text-red-300 text-sm mt-3">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full mt-5 py-3 bg-gradient-to-r from-orange-500 to-yellow-400 text-white font-semibold rounded-lg disabled:opacity-50"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Scores'}
        </button>
      </div>
    </main>
  )
}

const bgStyle = {
  backgroundImage: 'url(/backgrounds/stadium.png)',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
}
