'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Logo } from '@/components/layout/Logo'

type MatchStatus =
  | 'pending'
  | 'accepted'
  | 'in_progress'
  | 'uploading'
  | 'analyzing'
  | 'completed'
  | 'disputed'
  | 'cancelled'
  | 'declined'

interface Match {
  id: string
  status: MatchStatus
  venueName: string
  isChallenger: boolean
  opponent: {
    id: string
    name: string | null
    avatar: { imageUrl: string | null }
  }
  player1Score: number | null
  player2Score: number | null
  winnerId: string | null
  createdAt: string
}

type FilterType = 'all' | 'active' | 'completed' | 'disputed'

export default function MatchesPage() {
  const router = useRouter()
  const [matches, setMatches] = useState<Match[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('all')

  useEffect(() => {
    fetchMatches()
  }, [])

  const fetchMatches = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/matches')
      if (res.ok) {
        const data = await res.json()
        setMatches(data.matches || [])
      }
    } catch (err) {
      console.error('Failed to fetch matches:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const getFilteredMatches = () => {
    switch (filter) {
      case 'active':
        return matches.filter((m) =>
          ['pending', 'accepted', 'in_progress', 'uploading', 'analyzing'].includes(m.status)
        )
      case 'completed':
        return matches.filter((m) => m.status === 'completed')
      case 'disputed':
        return matches.filter((m) => m.status === 'disputed')
      default:
        return matches
    }
  }

  const getStatusBadge = (status: MatchStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-2 py-1 bg-yellow-500/30 text-yellow-300 text-xs font-semibold rounded">
            Waiting
          </span>
        )
      case 'accepted':
        return (
          <span className="px-2 py-1 bg-blue-500/30 text-blue-300 text-xs font-semibold rounded">
            Ready
          </span>
        )
      case 'in_progress':
        return (
          <span className="px-2 py-1 bg-orange-500/30 text-orange-300 text-xs font-semibold rounded">
            In Progress
          </span>
        )
      case 'uploading':
      case 'analyzing':
        return (
          <span className="px-2 py-1 bg-purple-500/30 text-purple-300 text-xs font-semibold rounded">
            Analyzing
          </span>
        )
      case 'completed':
        return (
          <span className="px-2 py-1 bg-green-500/30 text-green-300 text-xs font-semibold rounded">
            Completed
          </span>
        )
      case 'disputed':
        return (
          <span className="px-2 py-1 bg-red-500/30 text-red-300 text-xs font-semibold rounded">
            Disputed
          </span>
        )
      case 'cancelled':
      case 'declined':
        return (
          <span className="px-2 py-1 bg-white/20 text-white/60 text-xs font-semibold rounded">
            {status === 'declined' ? 'Declined' : 'Cancelled'}
          </span>
        )
      default:
        return null
    }
  }

  const getMatchAction = (match: Match) => {
    switch (match.status) {
      case 'pending':
        return match.isChallenger ? 'View' : 'Respond'
      case 'accepted':
        return 'Start Match'
      case 'in_progress':
        return 'Continue'
      case 'uploading':
      case 'analyzing':
        return 'View Progress'
      case 'completed':
      case 'disputed':
        return 'View Results'
      default:
        return 'View'
    }
  }

  const handleMatchClick = (match: Match) => {
    switch (match.status) {
      case 'pending':
        if (match.isChallenger) {
          router.push(`/challenges/1v1/${match.id}/pending`)
        } else {
          router.push(`/challenges`)
        }
        break
      case 'accepted':
        router.push(`/challenges/1v1/${match.id}/ready`)
        break
      case 'in_progress':
        router.push(`/challenges/1v1/${match.id}/record`)
        break
      case 'uploading':
        router.push(`/challenges/1v1/${match.id}/upload`)
        break
      case 'analyzing':
      case 'completed':
      case 'disputed':
        router.push(`/challenges/1v1/${match.id}/results`)
        break
      default:
        router.push(`/matches/${match.id}`)
    }
  }

  const getUserScore = (match: Match) => {
    if (match.player1Score === null || match.player2Score === null) return null
    return match.isChallenger ? match.player1Score : match.player2Score
  }

  const getOpponentScore = (match: Match) => {
    if (match.player1Score === null || match.player2Score === null) return null
    return match.isChallenger ? match.player2Score : match.player1Score
  }

  const isWinner = (match: Match) => {
    if (!match.winnerId) return null
    const myScore = getUserScore(match)
    const oppScore = getOpponentScore(match)
    if (myScore === null || oppScore === null) return null
    return myScore > oppScore
  }

  const filteredMatches = getFilteredMatches()

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

      <div className="max-w-lg mx-auto p-4 space-y-4 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="sm" linkToHome className="w-10 h-10" />
            <h1 className="text-xl font-bold text-white">My Matches</h1>
          </div>
          <div className="w-10" />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 bg-white/10 backdrop-blur rounded-xl p-1 border border-white/20">
          {[
            { id: 'all', label: 'All' },
            { id: 'active', label: 'Active' },
            { id: 'completed', label: 'Done' },
            { id: 'disputed', label: 'Disputed' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as FilterType)}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === tab.id ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Matches List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent mx-auto" />
              <p className="text-white/60 mt-4">Loading matches...</p>
            </div>
          ) : filteredMatches.length === 0 ? (
            <div className="text-center py-12 bg-white/10 backdrop-blur rounded-xl border border-white/20">
              <p className="text-white/60 mb-4">
                {filter === 'all' ? 'No matches yet' : `No ${filter} matches`}
              </p>
              <button
                onClick={() => router.push('/challenges')}
                className="bg-white/20 hover:bg-white/30 text-white font-semibold py-3 px-6 rounded-xl transition-colors border border-white/30"
              >
                Find a Challenge
              </button>
            </div>
          ) : (
            filteredMatches.map((match) => (
              <div
                key={match.id}
                onClick={() => handleMatchClick(match)}
                className="bg-white/10 backdrop-blur rounded-xl border border-white/20 p-4 cursor-pointer active:scale-[0.98] transition-transform"
              >
                {/* Header Row */}
                <div className="flex items-center gap-3 mb-3">
                  {/* Opponent Avatar */}
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-white/20 flex-shrink-0">
                    {match.opponent.avatar?.imageUrl ? (
                      <Image
                        src={match.opponent.avatar.imageUrl}
                        alt={match.opponent.name || 'Opponent'}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">
                        👤
                      </div>
                    )}
                  </div>

                  {/* Match Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-white truncate">
                        vs {match.opponent.name || 'Player'}
                      </h3>
                      {getStatusBadge(match.status)}
                    </div>
                    <p className="text-xs text-white/60 truncate">
                      📍 {match.venueName} •{' '}
                      {new Date(match.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>

                  {/* Action Arrow */}
                  <div className="text-white/50">→</div>
                </div>

                {/* Score Display (for completed matches) */}
                {match.status === 'completed' &&
                  match.player1Score !== null &&
                  match.player2Score !== null && (
                    <div
                      className={`rounded-lg p-3 ${isWinner(match) ? 'bg-green-500/20' : 'bg-white/10'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-white">{getUserScore(match)}</p>
                          <p className="text-xs text-white/60">You</p>
                        </div>
                        <div className="text-white/50 text-lg font-bold">-</div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-white">{getOpponentScore(match)}</p>
                          <p className="text-xs text-white/60">{match.opponent.name || 'Opp'}</p>
                        </div>
                        <div
                          className={`px-3 py-1 rounded-full text-sm font-bold ${
                            isWinner(match) ? 'bg-green-500 text-white' : 'bg-white/30 text-white'
                          }`}
                        >
                          {isWinner(match) ? 'WIN' : 'LOSS'}
                        </div>
                      </div>
                    </div>
                  )}

                {/* Status Messages */}
                {match.status === 'pending' && (
                  <div className="bg-yellow-500/20 rounded-lg p-3 text-sm text-yellow-300">
                    {match.isChallenger
                      ? 'Waiting for opponent to respond...'
                      : 'You have a challenge request!'}
                  </div>
                )}

                {match.status === 'accepted' && (
                  <div className="bg-blue-500/20 rounded-lg p-3 text-sm text-blue-300">
                    Match accepted! Ready to start recording.
                  </div>
                )}

                {(match.status === 'uploading' || match.status === 'analyzing') && (
                  <div className="bg-purple-500/20 rounded-lg p-3 text-sm text-purple-300 flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-400 border-t-transparent" />
                    AI is analyzing the match video...
                  </div>
                )}

                {match.status === 'disputed' && (
                  <div className="bg-red-500/20 rounded-lg p-3 text-sm text-red-300">
                    This match is under review.
                  </div>
                )}

                {/* Action Button */}
                <button className="w-full mt-3 py-2 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-colors text-sm border border-white/20">
                  {getMatchAction(match)}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  )
}
