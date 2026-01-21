'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Logo } from '@/components/layout/Logo'

interface MatchDetails {
  id: string
  opponentName: string
  opponentId: string
  venue: string
  date: Date
  status: 'pending' | 'verified' | 'disputed'
  result?: {
    winner: 'you' | 'opponent'
    yourScore: number
    opponentScore: number
    xpEarned: number
    duration: string
    accuracy: string
  }
  canDispute: boolean
  recordingUrl?: string
}

export default function MatchDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const matchId = params.id as string
  const [match, setMatch] = useState<MatchDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Fetch match details
    fetch(`/api/matches/${matchId}`)
      .then((res) => res.json())
      .then((data) => setMatch(data))
      .catch((err) => console.error('Failed to fetch match:', err))
      .finally(() => setIsLoading(false))
  }, [matchId])

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
        <div className="text-white/60 relative z-10">Loading match details...</div>
      </main>
    )
  }

  if (!match) {
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
        <div className="text-white/60 relative z-10">Match not found</div>
      </main>
    )
  }

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

      <div className="w-full max-w-4xl mx-auto p-4 md:p-8 space-y-4 relative z-10">
        {/* Header with Logo */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-start gap-2">
            <Logo size="sm" linkToHome className="w-10 h-10 flex-shrink-0" />
            <div>
              <h1 className="text-xl font-bold text-white">Match Details</h1>
              <p className="text-sm text-white/60">vs {match.opponentName}</p>
            </div>
          </div>
          <button
            onClick={() => router.back()}
            className="text-white/80 hover:text-white text-sm font-medium flex-shrink-0 mt-1"
          >
            ← Back
          </button>
        </div>

        {/* Status Badge */}
        <div className="flex justify-start">
          {match.status === 'pending' && (
            <span className="px-3 py-1 bg-yellow-500/30 text-yellow-300 text-sm font-semibold rounded-full">
              ⏳ Verifying
            </span>
          )}
          {match.status === 'disputed' && (
            <span className="px-3 py-1 bg-red-500/30 text-red-300 text-sm font-semibold rounded-full">
              ⚠️ Disputed
            </span>
          )}
          {match.status === 'verified' && (
            <span className="px-3 py-1 bg-green-500/30 text-green-300 text-sm font-semibold rounded-full">
              ✓ Verified
            </span>
          )}
        </div>

        {/* Match Info Card */}
        <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white/80 mb-4">Match Information</h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-white/10">
              <span className="text-sm text-white/60">Venue</span>
              <span className="text-sm font-semibold text-white">{match.venue}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-white/10">
              <span className="text-sm text-white/60">Date & Time</span>
              <span className="text-sm font-semibold text-white">
                {new Date(match.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-white/60">Opponent</span>
              <span className="text-sm font-semibold text-white">{match.opponentName}</span>
            </div>
          </div>
        </div>

        {/* Result Card (if verified) */}
        {match.result && match.status === 'verified' && (
          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-white/80 mb-4">Match Result</h2>

            {/* Score */}
            <div className="bg-white/10 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-center gap-8">
                <div className="text-center">
                  <p className="text-xs text-white/60 mb-1">You</p>
                  <p
                    className={`text-3xl font-bold ${
                      match.result.winner === 'you' ? 'text-green-400' : 'text-white/60'
                    }`}
                  >
                    {match.result.yourScore}
                  </p>
                </div>
                <div className="text-2xl font-bold text-white/40">-</div>
                <div className="text-center">
                  <p className="text-xs text-white/60 mb-1">{match.opponentName}</p>
                  <p
                    className={`text-3xl font-bold ${
                      match.result.winner === 'opponent' ? 'text-green-400' : 'text-white/60'
                    }`}
                  >
                    {match.result.opponentScore}
                  </p>
                </div>
              </div>
            </div>

            {/* Winner Badge */}
            <div className="text-center mb-4">
              {match.result.winner === 'you' ? (
                <div className="inline-block bg-green-500/30 text-green-300 px-4 py-2 rounded-lg">
                  <p className="text-sm font-bold">🏆 You Won!</p>
                </div>
              ) : (
                <div className="inline-block bg-white/20 text-white/80 px-4 py-2 rounded-lg">
                  <p className="text-sm font-bold">You Lost</p>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <p className="text-xs text-white/60 mb-1">XP Earned</p>
                <p className="text-sm font-bold text-white">+{match.result.xpEarned}</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <p className="text-xs text-white/60 mb-1">Duration</p>
                <p className="text-sm font-bold text-white">{match.result.duration}</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <p className="text-xs text-white/60 mb-1">Accuracy</p>
                <p className="text-sm font-bold text-white">{match.result.accuracy}</p>
              </div>
            </div>
          </div>
        )}

        {/* Pending Message */}
        {match.status === 'pending' && (
          <div className="bg-yellow-500/20 border border-yellow-500/40 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-yellow-500/30 rounded-full flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-6 h-6 text-yellow-300 animate-spin"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-yellow-300 mb-1">
                  Verification in Progress
                </p>
                <p className="text-xs text-yellow-300/80">
                  Our AI is analyzing your match recording to verify players, track points, and
                  determine the winner. This usually takes 1-2 minutes. You will receive a
                  notification when verification is complete.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Disputed Message */}
        {match.status === 'disputed' && (
          <div className="bg-red-500/20 border border-red-500/40 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-red-500/30 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-red-300" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-red-300 mb-1">Match Under Review</p>
                <p className="text-xs text-red-300/80">
                  This match has been disputed and is currently under review by our team. We will
                  resolve the dispute within 24 hours and notify both players of the decision.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        {match.status === 'verified' && match.canDispute && (
          <button
            onClick={() => router.push(`/matches/${match.id}/dispute`)}
            className="w-full bg-red-500/30 hover:bg-red-500/40 text-red-300 font-semibold py-3 px-6 rounded-lg transition-colors border border-red-500/40"
          >
            Dispute This Result
          </button>
        )}
      </div>
    </main>
  )
}
