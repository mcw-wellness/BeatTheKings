'use client'

import { useEffect, useCallback, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Logo } from '@/components/layout/Logo'
import { useNotifications } from '@/lib/hooks/useNotifications'

interface MatchState {
  status: string
  recordingBy: string | null
  videoUrl: string | null
  player1: { score: number | null }
  player2: { score: number | null }
}

export default function MatchWaitingPage(): JSX.Element {
  const router = useRouter()
  const params = useParams()
  const matchId = params.matchId as string

  const [phase, setPhase] = useState<'recording' | 'scoring'>('recording')
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/challenges/1v1/${matchId}`, { cache: 'no-store' })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to load match')
        return
      }

      const match = data.match as MatchState

      if (match.status === 'completed' || match.status === 'disputed') {
        router.push(`/challenges/1v1/${matchId}/results`)
        return
      }

      if (match.status === 'accepted' || match.status === 'scheduled') {
        router.push(`/challenges/1v1/${matchId}/ready`)
        return
      }

      if (match.status === 'cancelled' || match.status === 'declined') {
        router.push('/matches')
        return
      }

      const hasScores = match.player1.score !== null && match.player2.score !== null
      if (hasScores) {
        router.push(`/challenges/1v1/${matchId}/results`)
        return
      }

      setPhase(match.videoUrl ? 'scoring' : 'recording')
    } catch {
      setError('Failed to load match')
    }
  }, [matchId, router])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 3000)
    return () => clearInterval(interval)
  }, [refresh])

  useNotifications({
    onEvent: (event) => {
      const eventMatchId = (event.data as { matchId?: string })?.matchId
      if (eventMatchId !== matchId) return
      if (['score-submitted', 'match-completed', 'challenge-cancelled'].includes(event.type)) {
        refresh()
      }
    },
  })

  return (
    <main className="h-dvh flex items-center justify-center p-4 relative" style={bgStyle}>
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none" />
      <div className="absolute top-3 left-3 z-20">
        <Logo size="sm" linkToHome className="w-10 h-10" />
      </div>
      <div className="relative z-10 bg-white/10 backdrop-blur rounded-xl border border-white/20 p-6 max-w-sm w-full text-center">
        <div className="w-16 h-16 bg-blue-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">⏳</span>
        </div>
        <h1 className="text-xl font-bold text-white mb-2">
          {phase === 'recording' ? 'Opponent is recording' : 'Opponent is entering scores'}
        </h1>
        <p className="text-white/70 mb-4">
          {phase === 'recording'
            ? 'Please wait while they record the full match video.'
            : 'Scores are being submitted. You will see results shortly.'}
        </p>
        {error && <p className="text-red-300 text-sm mb-3">{error}</p>}
        <button
          onClick={() => router.push('/matches')}
          className="w-full py-3 bg-white/20 hover:bg-white/30 text-white rounded-lg border border-white/30"
        >
          Back to Matches
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
