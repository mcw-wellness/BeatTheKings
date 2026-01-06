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

const POLL_INTERVAL = 3000 // Poll every 3 seconds

export default function MatchPendingPage(): JSX.Element {
  const router = useRouter()
  const params = useParams()
  const matchId = params.matchId as string

  const [match, setMatch] = useState<Match | null>(null)
  const [opponent, setOpponent] = useState<Player | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCancelling, setIsCancelling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [declined, setDeclined] = useState(false)

  const fetchMatch = useCallback(async () => {
    try {
      const response = await fetch(`/api/challenges/1v1/${matchId}`)
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to load match')
        return
      }

      setMatch(data.match)
      // Challenger is player1, opponent is player2
      setOpponent(data.match.player2)

      // Handle status changes
      if (data.match.status === 'accepted') {
        router.push(`/challenges/1v1/${matchId}/ready`)
      } else if (data.match.status === 'declined') {
        setDeclined(true)
      } else if (data.match.status === 'in_progress') {
        router.push(`/challenges/1v1/${matchId}/record`)
      } else if (data.match.status === 'cancelled') {
        router.push('/challenges')
      }
    } catch {
      setError('Failed to load match')
    } finally {
      setIsLoading(false)
    }
  }, [matchId, router])

  // Initial fetch
  useEffect(() => {
    fetchMatch()
  }, [fetchMatch])

  // Poll for updates
  useEffect(() => {
    if (declined || error) return

    const interval = setInterval(fetchMatch, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchMatch, declined, error])

  const handleCancel = async () => {
    setIsCancelling(true)
    setError(null)

    try {
      const response = await fetch(`/api/challenges/1v1/${matchId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accept: false }),
      })

      if (response.ok) {
        router.push('/challenges')
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to cancel challenge')
        setIsCancelling(false)
      }
    } catch {
      setError('Failed to cancel challenge')
      setIsCancelling(false)
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
        <button onClick={() => router.push('/challenges')} className="text-[#4361EE] underline">
          Back to Challenges
        </button>
      </main>
    )
  }

  if (declined) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">😔</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Challenge Declined</h2>
          <p className="text-gray-600 mb-6">
            {opponent?.name || 'Opponent'} declined your challenge.
          </p>
          <button
            onClick={() => router.push('/challenges')}
            className="w-full py-3 bg-[#4361EE] hover:bg-[#3651DE] text-white font-semibold rounded-xl transition-colors"
          >
            Back to Challenges
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-lg mx-auto min-h-screen flex flex-col">
        {/* Header */}
        <header className="p-4 border-b border-gray-200 bg-white">
          <h1 className="text-xl font-bold text-gray-900 text-center">Challenge Sent</h1>
          <p className="text-sm text-gray-500 text-center mt-1">{match.venueName}</p>
        </header>

        {/* Waiting Display */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
          {/* Opponent Avatar */}
          <div className="relative mb-6">
            <div className="w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden border-4 border-gray-300 mx-auto">
              {opponent?.avatar?.imageUrl ? (
                <Image
                  src={opponent.avatar.imageUrl}
                  alt={opponent.name || 'Opponent'}
                  width={144}
                  height={144}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <span className="text-4xl">👤</span>
                </div>
              )}
            </div>
            {/* Pulsing ring animation */}
            <div className="absolute inset-0 rounded-full border-4 border-[#4361EE] animate-ping opacity-30" />
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {opponent?.name || 'Opponent'}
          </h2>

          {/* Waiting Status */}
          <div className="flex items-center gap-2 text-gray-600 mb-8">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-[#4361EE] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-[#4361EE] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-[#4361EE] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span>Waiting for response</span>
          </div>

          {/* Info Card */}
          <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 w-full max-w-sm">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xl">📱</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Challenge Notification Sent</h3>
                <p className="text-sm text-gray-600">
                  Your opponent will receive a notification to accept or decline the challenge.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Cancel Button */}
        <div className="p-4 md:p-6 border-t border-gray-200 bg-white">
          <button
            onClick={handleCancel}
            disabled={isCancelling}
            className="w-full py-4 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-700 font-semibold rounded-xl transition-colors flex items-center justify-center"
          >
            {isCancelling ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-500 border-t-transparent" />
            ) : (
              'Cancel Challenge'
            )}
          </button>
          <p className="text-gray-500 text-xs text-center mt-2">
            Challenge expires in 2 minutes
          </p>
        </div>
      </div>
    </main>
  )
}
