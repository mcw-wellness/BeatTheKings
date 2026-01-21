'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'

interface ResultData {
  isWinner: boolean
  userScore: number | null
  opponentScore: number | null
  opponent: {
    id: string
    name: string | null
    imageUrl: string
  }
  xpEarned: number
  rpEarned: number
  userAgreed: boolean
  opponentAgreed: boolean
  venueName: string
}

export default function MatchResultsPage(): JSX.Element {
  const router = useRouter()
  const params = useParams()
  const matchId = params.matchId as string

  const [result, setResult] = useState<ResultData | null>(null)
  const [status, setStatus] = useState<string>('loading')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchResults = useCallback(async () => {
    try {
      const response = await fetch(`/api/challenges/1v1/${matchId}/results`)
      const data = await response.json()

      if (data.analyzing) {
        setStatus('analyzing')
        setTimeout(fetchResults, 2000)
        return
      }

      setStatus(data.status)
      setResult(data.result)
    } catch {
      setError('Failed to load results')
    }
  }, [matchId])

  useEffect(() => {
    fetchResults()
  }, [fetchResults])

  const handleAgree = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/challenges/1v1/${matchId}/agree`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agree: true }),
      })

      const data = await response.json()

      if (response.ok) {
        if (data.bothAgreed) {
          setStatus('finalized')
        }
        fetchResults()
      } else {
        setError(data.error || 'Failed to submit agreement')
      }
    } catch {
      setError('Failed to submit agreement')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDispute = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/challenges/1v1/${matchId}/agree`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agree: false }),
      })

      if (response.ok) {
        setStatus('disputed')
        fetchResults()
      }
    } catch {
      setError('Failed to submit dispute')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (status === 'loading' || status === 'analyzing') {
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
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-yellow-400 border-t-transparent mb-4 relative z-10" />
        <p className="text-white/80 relative z-10">
          {status === 'analyzing' ? 'AI is analyzing the match...' : 'Loading results...'}
        </p>
      </main>
    )
  }

  if (error && !result) {
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
        <p className="text-red-300 mb-4 relative z-10">{error}</p>
        <button
          onClick={() => router.push('/matches')}
          className="text-white/80 hover:text-white underline relative z-10"
        >
          Back to Matches
        </button>
      </main>
    )
  }

  if (!result) {
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

  const showAgreementButtons = !result.userAgreed && status === 'completed'

  return (
    <main
      className="min-h-screen relative"
      style={{
        backgroundImage: 'url(/backgrounds/stadium.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none" />
      <div className="max-w-lg mx-auto min-h-screen flex flex-col p-4 md:p-6 relative z-10">
        {/* Result Banner */}
        <div
          className={`rounded-xl p-6 md:p-8 text-center text-white mb-6 backdrop-blur ${
            result.isWinner
              ? 'bg-green-500/30 border border-green-500/50'
              : 'bg-white/10 border border-white/20'
          }`}
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            {result.isWinner ? 'Victory!' : 'Defeat'}
          </h1>
          <p className="text-white/80">
            {result.isWinner ? 'Congratulations!' : 'Better luck next time!'}
          </p>
        </div>

        {/* Score */}
        <div className="bg-white/10 backdrop-blur rounded-xl border border-white/20 p-6 mb-6">
          <div className="flex items-center justify-center gap-6 md:gap-10">
            {/* You */}
            <div className="text-center">
              <p className="text-4xl md:text-5xl font-bold text-white">{result.userScore ?? '-'}</p>
              <p className="text-sm text-white/60 mt-1">You</p>
            </div>

            <span className="text-2xl text-white/40">-</span>

            {/* Opponent */}
            <div className="text-center flex flex-col items-center">
              <p className="text-4xl md:text-5xl font-bold text-white">
                {result.opponentScore ?? '-'}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Image
                  src={result.opponent.imageUrl}
                  alt={result.opponent.name || 'Opponent'}
                  width={20}
                  height={20}
                  className="w-5 h-5 rounded-full"
                />
                <p className="text-sm text-white/60">{result.opponent.name || 'Opponent'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Rewards */}
        <div className="bg-white/10 backdrop-blur rounded-xl border border-white/20 p-6 mb-6">
          <h2 className="font-semibold text-white mb-4">Rewards Earned</h2>
          <div className="flex gap-4">
            <div className="flex-1 bg-yellow-500/20 rounded-lg p-4 text-center">
              <p className="text-2xl md:text-3xl font-bold text-yellow-400">+{result.xpEarned}</p>
              <p className="text-sm text-yellow-300">XP</p>
            </div>
            <div className="flex-1 bg-purple-500/20 rounded-lg p-4 text-center">
              <p className="text-2xl md:text-3xl font-bold text-purple-400">+{result.rpEarned}</p>
              <p className="text-sm text-purple-300">RP</p>
            </div>
          </div>
          <p className="text-xs text-white/50 text-center mt-3">
            Rewards applied when both players agree
          </p>
        </div>

        {/* Agreement Status */}
        <div className="bg-white/10 backdrop-blur rounded-xl border border-white/20 p-6 mb-6">
          <h2 className="font-semibold text-white mb-4">Agreement Status</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-white/70">You</span>
              {result.userAgreed ? (
                <span className="text-green-400 font-medium">✓ Agreed</span>
              ) : (
                <span className="text-white/40">Pending</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/70">{result.opponent.name || 'Opponent'}</span>
              {result.opponentAgreed ? (
                <span className="text-green-400 font-medium">✓ Agreed</span>
              ) : (
                <span className="text-white/40">Pending</span>
              )}
            </div>
          </div>

          {status === 'disputed' && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500/40 rounded-lg">
              <p className="text-red-300 text-sm text-center">
                Match disputed. An admin will review.
              </p>
            </div>
          )}

          {status === 'finalized' && (
            <div className="mt-4 p-3 bg-green-500/20 border border-green-500/40 rounded-lg">
              <p className="text-green-300 text-sm text-center">
                Match finalized! Stats have been updated.
              </p>
            </div>
          )}
        </div>

        {/* Error */}
        {error && <p className="text-red-300 text-sm text-center mb-4">{error}</p>}

        {/* Action Buttons */}
        {showAgreementButtons && (
          <div className="flex gap-4 mb-6">
            <button
              onClick={handleDispute}
              disabled={isSubmitting}
              className="flex-1 py-4 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              Dispute
            </button>
            <button
              onClick={handleAgree}
              disabled={isSubmitting}
              className="flex-1 py-4 bg-green-500/80 hover:bg-green-500 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              ) : (
                'Agree'
              )}
            </button>
          </div>
        )}

        {/* Back Button - Always visible */}
        <button
          onClick={() => router.push('/matches')}
          className="w-full py-4 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-xl transition-colors border border-white/30"
        >
          Back to Matches
        </button>

        {/* Venue */}
        <p className="text-xs text-white/40 text-center mt-4">{result.venueName}</p>
      </div>
    </main>
  )
}
