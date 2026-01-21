'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useLocation } from '@/context/LocationContext'
import Image from 'next/image'
import { Logo } from '@/components/layout/Logo'

interface ChallengeVenue {
  id: string
  name: string
  district: string | null
  distance: number | null
  distanceFormatted: string | null
  challengeCount: number
  activePlayerCount: number
}

interface PendingMatch {
  id: string
  status: string
  venueName: string
  isChallenger: boolean
  opponent: {
    id: string
    name: string | null
    avatar: { imageUrl: string | null }
  }
  createdAt: string
}

export default function ChallengesPage(): JSX.Element {
  const router = useRouter()
  const { latitude, longitude } = useLocation()

  const [venues, setVenues] = useState<ChallengeVenue[]>([])
  const [pendingMatches, setPendingMatches] = useState<PendingMatch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [respondingTo, setRespondingTo] = useState<string | null>(null)

  const fetchVenues = useCallback(async (): Promise<void> => {
    try {
      let url = '/api/challenges/venues'
      if (latitude && longitude) {
        url += `?lat=${latitude}&lng=${longitude}`
      }

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error('Failed to load venues')
      }

      const json = await response.json()
      setVenues(json.venues)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    }
  }, [latitude, longitude])

  const fetchPendingMatches = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch('/api/matches?status=pending,accepted,in_progress')
      if (response.ok) {
        const json = await response.json()
        setPendingMatches(json.matches || [])
      }
    } catch {
      // Silently fail for pending matches
    }
  }, [])

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await Promise.all([fetchVenues(), fetchPendingMatches()])
      setIsLoading(false)
    }
    loadData()
  }, [fetchVenues, fetchPendingMatches])

  const handleRespond = async (matchId: string, accept: boolean) => {
    setRespondingTo(matchId)
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
          // Refresh the list
          fetchPendingMatches()
        }
      }
    } catch {
      // Handle error
    } finally {
      setRespondingTo(null)
    }
  }

  const navigateToVenue = (venueId: string): void => {
    router.push(`/challenges/venue/${venueId}`)
  }

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
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent relative z-10" />
      </main>
    )
  }

  if (error) {
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
          onClick={fetchVenues}
          className="text-white/80 hover:text-white underline relative z-10"
        >
          Try Again
        </button>
      </main>
    )
  }

  // Filter matches by type
  const receivedChallenges = pendingMatches.filter((m) => !m.isChallenger && m.status === 'pending')
  const sentChallenges = pendingMatches.filter((m) => m.isChallenger && m.status === 'pending')
  const activeMatches = pendingMatches.filter(
    (m) => m.status === 'accepted' || m.status === 'in_progress'
  )

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
        <div className="flex items-center gap-3">
          <Logo size="sm" linkToHome className="w-10 h-10" />
          <h1 className="text-xl font-bold text-white flex-1">Challenges</h1>
        </div>

        {/* Received Challenges */}
        {receivedChallenges.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-white/80 uppercase tracking-wide">
              Challenge Requests
            </h2>
            {receivedChallenges.map((match) => (
              <div
                key={match.id}
                className="bg-orange-500/20 backdrop-blur border border-orange-500/40 rounded-xl p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-white/20">
                    {match.opponent.avatar?.imageUrl ? (
                      <Image
                        src={match.opponent.avatar.imageUrl}
                        alt={match.opponent.name || 'Opponent'}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">
                        👤
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-white">
                      {match.opponent.name || 'Player'} challenged you!
                    </p>
                    <p className="text-sm text-white/60">{match.venueName}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleRespond(match.id, true)}
                    disabled={respondingTo === match.id}
                    className="flex-1 py-2 bg-green-500/80 hover:bg-green-500 disabled:bg-white/30 text-white font-semibold rounded-lg transition-colors"
                  >
                    {respondingTo === match.id ? '...' : 'Accept'}
                  </button>
                  <button
                    onClick={() => handleRespond(match.id, false)}
                    disabled={respondingTo === match.id}
                    className="flex-1 py-2 bg-red-500/80 hover:bg-red-500 disabled:bg-white/30 text-white font-semibold rounded-lg transition-colors"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sent Challenges (Waiting) */}
        {sentChallenges.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-white/80 uppercase tracking-wide">
              Waiting for Response
            </h2>
            {sentChallenges.map((match) => (
              <div
                key={match.id}
                onClick={() => router.push(`/challenges/1v1/${match.id}/pending`)}
                className="bg-yellow-500/20 backdrop-blur border border-yellow-500/40 rounded-xl p-4 cursor-pointer active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-white/20">
                    {match.opponent.avatar?.imageUrl ? (
                      <Image
                        src={match.opponent.avatar.imageUrl}
                        alt={match.opponent.name || 'Opponent'}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">
                        👤
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-white">
                      Challenge to {match.opponent.name || 'Player'}
                    </p>
                    <p className="text-sm text-yellow-300">Waiting for response...</p>
                  </div>
                  <span className="text-white/50">→</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Active Matches */}
        {activeMatches.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-white/80 uppercase tracking-wide">
              Active Matches
            </h2>
            {activeMatches.map((match) => (
              <div
                key={match.id}
                onClick={() =>
                  router.push(
                    `/challenges/1v1/${match.id}/${match.status === 'accepted' ? 'ready' : 'record'}`
                  )
                }
                className="bg-green-500/20 backdrop-blur border border-green-500/40 rounded-xl p-4 cursor-pointer active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-white/20">
                    {match.opponent.avatar?.imageUrl ? (
                      <Image
                        src={match.opponent.avatar.imageUrl}
                        alt={match.opponent.name || 'Opponent'}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">
                        👤
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-white">vs {match.opponent.name || 'Player'}</p>
                    <p className="text-sm text-green-300">
                      {match.status === 'accepted' ? 'Ready to play!' : 'In progress'}
                    </p>
                  </div>
                  <span className="text-green-300 font-bold">GO →</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Solo Challenges Section */}
        <div className="pt-2">
          <h2 className="text-sm font-semibold text-white/80 uppercase tracking-wide mb-2">
            Solo Challenges
          </h2>
          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-lg p-3 mb-3">
            <p className="text-white/80 text-sm">
              Select a venue to see available challenges. Venues are sorted by distance.
            </p>
          </div>
        </div>

        {/* Venue List */}
        {venues.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-white/60">No venues available</p>
          </div>
        ) : (
          <div className="space-y-3">
            {venues.map((venue) => (
              <div
                key={venue.id}
                onClick={() => navigateToVenue(venue.id)}
                className="bg-white/10 backdrop-blur rounded-xl border border-white/20 p-4 cursor-pointer active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">{venue.name}</h3>
                    {venue.district && <p className="text-white/60 text-sm">{venue.district}</p>}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-white/60 flex items-center gap-1">
                        <span>🏆</span>
                        <span>{venue.challengeCount} challenges</span>
                      </span>
                      <span className="text-xs text-white/60 flex items-center gap-1">
                        <span>👥</span>
                        <span>{venue.activePlayerCount} active</span>
                      </span>
                    </div>
                  </div>
                  {venue.distanceFormatted && (
                    <span className="bg-white/20 text-white text-sm px-3 py-1 rounded-full">
                      {venue.distanceFormatted}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Location Hint */}
        {!latitude && (
          <p className="text-center text-yellow-300 text-xs">
            Enable location to sort venues by distance
          </p>
        )}
      </div>
    </main>
  )
}
