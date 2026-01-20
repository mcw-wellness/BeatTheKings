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
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#4361EE] border-t-transparent mb-4" />
        <p className="text-gray-600">
          {status === 'analyzing' ? 'AI is analyzing the match...' : 'Loading results...'}
        </p>
      </main>
    )
  }

  if (error && !result) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center p-4">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={() => router.push('/matches')} className="text-[#4361EE] underline">
          Back to Matches
        </button>
      </main>
    )
  }

  if (!result) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#4361EE] border-t-transparent" />
      </main>
    )
  }

  const showAgreementButtons = !result.userAgreed && status === 'completed'

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-lg mx-auto min-h-screen flex flex-col p-4 md:p-6">
        {/* Result Banner */}
        <div
          className={`rounded-xl p-6 md:p-8 text-center text-white mb-6 ${
            result.isWinner
              ? 'bg-gradient-to-r from-green-500 to-green-600'
              : 'bg-gradient-to-r from-gray-500 to-gray-600'
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
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-center gap-6 md:gap-10">
            {/* You */}
            <div className="text-center">
              <p className="text-4xl md:text-5xl font-bold text-gray-900">
                {result.userScore ?? '-'}
              </p>
              <p className="text-sm text-gray-500 mt-1">You</p>
            </div>

            <span className="text-2xl text-gray-400">-</span>

            {/* Opponent */}
            <div className="text-center flex flex-col items-center">
              <p className="text-4xl md:text-5xl font-bold text-gray-900">
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
                <p className="text-sm text-gray-500">{result.opponent.name || 'Opponent'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Rewards */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Rewards Earned</h2>
          <div className="flex gap-4">
            <div className="flex-1 bg-yellow-50 rounded-lg p-4 text-center">
              <p className="text-2xl md:text-3xl font-bold text-yellow-600">+{result.xpEarned}</p>
              <p className="text-sm text-yellow-700">XP</p>
            </div>
            <div className="flex-1 bg-purple-50 rounded-lg p-4 text-center">
              <p className="text-2xl md:text-3xl font-bold text-purple-600">+{result.rpEarned}</p>
              <p className="text-sm text-purple-700">RP</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 text-center mt-3">
            Rewards applied when both players agree
          </p>
        </div>

        {/* Agreement Status */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Agreement Status</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">You</span>
              {result.userAgreed ? (
                <span className="text-green-600 font-medium">✓ Agreed</span>
              ) : (
                <span className="text-gray-400">Pending</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">{result.opponent.name || 'Opponent'}</span>
              {result.opponentAgreed ? (
                <span className="text-green-600 font-medium">✓ Agreed</span>
              ) : (
                <span className="text-gray-400">Pending</span>
              )}
            </div>
          </div>

          {status === 'disputed' && (
            <div className="mt-4 p-3 bg-red-50 rounded-lg">
              <p className="text-red-700 text-sm text-center">
                Match disputed. An admin will review.
              </p>
            </div>
          )}

          {status === 'finalized' && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg">
              <p className="text-green-700 text-sm text-center">
                Match finalized! Stats have been updated.
              </p>
            </div>
          )}
        </div>

        {/* Error */}
        {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}

        {/* Action Buttons */}
        {showAgreementButtons && (
          <div className="flex gap-4 mb-6">
            <button
              onClick={handleDispute}
              disabled={isSubmitting}
              className="flex-1 py-4 bg-red-100 hover:bg-red-200 text-red-700 font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              Dispute
            </button>
            <button
              onClick={handleAgree}
              disabled={isSubmitting}
              className="flex-1 py-4 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
          className="w-full py-4 bg-[#4361EE] hover:bg-[#3651DE] text-white font-semibold rounded-xl transition-colors"
        >
          Back to Matches
        </button>

        {/* Venue */}
        <p className="text-xs text-gray-400 text-center mt-4">{result.venueName}</p>
      </div>
    </main>
  )
}
