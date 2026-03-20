'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import { Logo } from '@/components/layout/Logo'

interface UserVenue {
  venueId: string
  venueName: string
}

interface ActiveChallengeConflict {
  matchId: string
  status: string
  canCancelExisting: boolean
}

interface TrumpCardData {
  player: {
    id: string
    name: string | null
    gender: string | null
    avatar: {
      imageUrl: string | null
      skinTone: string | null
      hairStyle: string | null
      hairColor: string | null
    } | null
  }
  stats: {
    rank: number
    xp: number
    xpToNextLevel: number
    rp: number
    totalPoints: number
    winRate: number
    matchesPlayed: number
    matchesWon: number
    matchesLost: number
    challengesCompleted: number
    totalChallenges: number
  }
  crowns: {
    isKingOfCourt: boolean
    isKingOfCity: boolean
    isKingOfCountry: boolean
    courtName: string | null
    cityName: string | null
    countryName: string | null
  }
  detailedStats: {
    threePointAccuracy: number
    freeThrowAccuracy: number
    totalPointsScored: number
  }
}

export default function PlayerPage(): JSX.Element {
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string

  const [data, setData] = useState<TrumpCardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userVenue, setUserVenue] = useState<UserVenue | null>(null)
  const [isChallengeSending, setIsChallengeSending] = useState(false)
  const [challengeError, setChallengeError] = useState<string | null>(null)
  const [activeChallengeConflict, setActiveChallengeConflict] =
    useState<ActiveChallengeConflict | null>(null)

  useEffect(() => {
    const fetchUserVenue = async () => {
      try {
        const res = await fetch('/api/users/profile')
        if (res.ok) {
          const profile = await res.json()
          if (profile.user?.activeVenueId) {
            setUserVenue({
              venueId: profile.user.activeVenueId,
              venueName: profile.user.activeVenueName || 'Current Venue',
            })
          }
        }
      } catch {
        // Silently fail
      }
    }
    fetchUserVenue()
  }, [])

  useEffect(() => {
    if (!userId) return

    const fetchData = async (): Promise<void> => {
      setLoading(true)
      setError(null)

      try {
        const res = await fetch(`/api/players/${userId}/trump-card`)
        if (!res.ok) throw new Error('Failed to load player')
        const json = await res.json()
        setData(json)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [userId])

  const isKing =
    data?.crowns.isKingOfCourt || data?.crowns.isKingOfCity || data?.crowns.isKingOfCountry

  const getMatchRoute = (matchId: string, status: string, isChallenger: boolean): string => {
    if (status === 'pending') {
      return isChallenger
        ? `/challenges/1v1/${matchId}/pending`
        : `/challenges/1v1/${matchId}/respond`
    }
    if (status === 'scheduled' || status === 'accepted') {
      return `/challenges/1v1/${matchId}/ready`
    }
    if (status === 'in_progress' || status === 'uploading') {
      return '/matches'
    }
    return `/challenges/1v1/${matchId}/results`
  }

  const requestChallenge = async () => {
    if (!userVenue) throw new Error('Check in to a venue first')

    const res = await fetch('/api/challenges/1v1/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        opponentId: userId,
        venueId: userVenue.venueId,
      }),
    })

    const json = await res.json()
    return { res, json }
  }

  const handleCancelAndRestart = async (): Promise<void> => {
    if (
      !activeChallengeConflict?.canCancelExisting ||
      activeChallengeConflict.status !== 'pending'
    ) {
      setChallengeError('Only pending challenges can be cancelled and restarted.')
      return
    }

    setIsChallengeSending(true)
    setChallengeError(null)

    try {
      const cancelRes = await fetch(
        `/api/challenges/1v1/${activeChallengeConflict.matchId}/cancel`,
        {
          method: 'POST',
        }
      )

      if (!cancelRes.ok) {
        const cancelJson = await cancelRes.json()
        setChallengeError(cancelJson.error || 'Failed to cancel existing challenge')
        setIsChallengeSending(false)
        return
      }

      const { res, json } = await requestChallenge()

      if (!res.ok) {
        setChallengeError(json.error || 'Failed to send challenge')
        setIsChallengeSending(false)
        return
      }

      setActiveChallengeConflict(null)
      router.push(`/challenges/1v1/${json.matchId}/pending`)
    } catch {
      setChallengeError('Failed to restart challenge')
      setIsChallengeSending(false)
    }
  }

  const handleDeclineAndRestart = async (): Promise<void> => {
    if (!activeChallengeConflict || activeChallengeConflict.canCancelExisting) return
    if (activeChallengeConflict.status !== 'pending') {
      setChallengeError(
        'This active challenge cannot be declined from here. Open it from My Matches.'
      )
      return
    }

    setIsChallengeSending(true)
    setChallengeError(null)

    try {
      const declineRes = await fetch(
        `/api/challenges/1v1/${activeChallengeConflict.matchId}/respond`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accept: false }),
        }
      )

      if (!declineRes.ok) {
        const declineJson = await declineRes.json()
        setChallengeError(declineJson.error || 'Failed to decline existing challenge')
        setIsChallengeSending(false)
        return
      }

      const { res, json } = await requestChallenge()

      if (!res.ok) {
        setChallengeError(json.error || 'Failed to send challenge')
        setIsChallengeSending(false)
        return
      }

      setActiveChallengeConflict(null)
      router.push(`/challenges/1v1/${json.matchId}/pending`)
    } catch {
      setChallengeError('Failed to restart challenge')
      setIsChallengeSending(false)
    }
  }

  const handleChallenge = async () => {
    if (!userVenue) {
      setChallengeError('Check in to a venue first')
      return
    }

    setIsChallengeSending(true)
    setChallengeError(null)

    try {
      const { res, json } = await requestChallenge()

      if (!res.ok && json.code === 'ACTIVE_CHALLENGE_EXISTS' && json.existingMatchId) {
        setActiveChallengeConflict({
          matchId: json.existingMatchId,
          status: json.existingMatchStatus,
          canCancelExisting: !!json.canCancelExisting,
        })
        setIsChallengeSending(false)
        return
      }

      if (!res.ok) {
        setChallengeError(json.error || 'Failed to send challenge')
        setIsChallengeSending(false)
        return
      }

      router.push(`/challenges/1v1/${json.matchId}/pending`)
    } catch {
      setChallengeError('Failed to send challenge')
      setIsChallengeSending(false)
    }
  }

  if (loading) {
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
        <div className="animate-spin rounded-full h-10 w-10 border-3 border-yellow-400 border-t-transparent relative z-10" />
      </main>
    )
  }

  if (error || !data) {
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
        <p className="text-red-400 mb-4 relative z-10">{error || 'Player not found'}</p>
        <button onClick={() => router.back()} className="text-yellow-400 underline relative z-10">
          Go Back
        </button>
      </main>
    )
  }

  return (
    <>
      <main className="h-dvh overflow-hidden flex flex-col bg-[#0a0a1a]">
        {/* Header - Floating over avatar */}
        <div className="absolute top-0 left-0 right-0 px-4 py-3 flex items-center justify-between z-20">
          <Logo size="sm" linkToHome className="w-10 h-10" />
          <div className="flex items-center gap-2">
            <span className="text-white font-semibold">{data.player.name || 'Player'}</span>
            <div className="flex items-center gap-1 bg-yellow-500/30 backdrop-blur-sm px-2 py-1 rounded-lg">
              <span className="text-yellow-400 text-sm">🏆</span>
              <span className="text-white font-bold text-sm">#{data.stats.rank || '-'}</span>
            </div>
          </div>
        </div>

        {/* Fullscreen Avatar Section */}
        <div className="relative flex-1 min-h-0">
          {/* Avatar Image - Fullscreen */}
          {data.player.avatar?.imageUrl ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Image
                src={data.player.avatar.imageUrl}
                alt="Avatar"
                fill
                className="object-contain"
                unoptimized
                priority
              />
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-6xl">🏀</div>
            </div>
          )}

          {/* Crown badge if king */}
          {isKing && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-10">
              <span className="text-4xl drop-shadow-lg">👑</span>
            </div>
          )}

          {/* Gradient overlay at bottom for text readability */}
          <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-[#0a0a1a] via-[#0a0a1a]/80 to-transparent pointer-events-none" />
        </div>

        {/* Stats Section - Overlaid at bottom */}
        <div className="relative z-10 px-4 pb-4 -mt-32">
          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            <StatBox label="XP" value={data.stats.xp} color="purple" />
            <StatBox label="RP" value={data.stats.rp} color="yellow" />
            <StatBox label="Points" value={data.stats.totalPoints} color="blue" />
            <StatBox label="Win %" value={`${data.stats.winRate}%`} color="green" />
          </div>

          {/* Detailed Stats */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 mb-3">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <StatRow
                label="Matches"
                value={`${data.stats.matchesWon}W / ${data.stats.matchesLost}L`}
              />
              <StatRow label="Challenges" value={`${data.stats.challengesCompleted}`} />
              <StatRow label="3PT %" value={`${data.detailedStats.threePointAccuracy}%`} />
              <StatRow label="FT %" value={`${data.detailedStats.freeThrowAccuracy}%`} />
            </div>
          </div>

          {/* Championship */}
          <div className="bg-gradient-to-r from-purple-900/30 to-purple-800/20 backdrop-blur-sm border border-purple-500/20 rounded-xl p-3 mb-3">
            <p className="text-purple-400 text-xs uppercase tracking-wide">Current Event</p>
            <p className="text-white font-semibold text-sm">December BB Championship</p>
            <p className="text-purple-400 text-xs">sponsored by AVIS</p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            {challengeError && <p className="text-red-400 text-xs text-center">{challengeError}</p>}
            <button
              onClick={handleChallenge}
              disabled={isChallengeSending}
              className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 disabled:from-gray-500 disabled:to-gray-600 text-white text-base font-bold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {isChallengeSending ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <span>🏀</span>
                  <span>Challenge to 1x1</span>
                </>
              )}
            </button>
            {!userVenue && (
              <p className="text-center text-white/40 text-xs">Check in to a venue to challenge</p>
            )}
            <button
              onClick={() => router.push(`/player/${userId}/invite`)}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 text-white text-base font-bold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <span>📅</span>
              <span>Invite to Match</span>
            </button>
          </div>
        </div>
      </main>

      {activeChallengeConflict && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#1e2a4a] border border-white/20 rounded-2xl p-5">
            <p className="text-orange-300 text-xs font-semibold mb-2">ACTIVE CHALLENGE FOUND</p>
            <h3 className="text-white font-bold text-lg mb-2">
              You already have an active challenge
            </h3>
            <p className="text-white/70 text-sm mb-4">
              {activeChallengeConflict.canCancelExisting
                ? 'You can open the existing challenge, or cancel it and start a new one.'
                : activeChallengeConflict.status === 'pending'
                  ? 'You can open the existing challenge, or decline it and start a new one.'
                  : 'You can open the existing challenge from My Matches.'}
            </p>

            {challengeError && <p className="text-red-300 text-xs mb-3">{challengeError}</p>}

            <div className="space-y-2">
              <button
                onClick={() => {
                  router.push(
                    getMatchRoute(
                      activeChallengeConflict.matchId,
                      activeChallengeConflict.status,
                      activeChallengeConflict.canCancelExisting
                    )
                  )
                  setActiveChallengeConflict(null)
                }}
                className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-xl"
              >
                Proceed with Existing
              </button>

              {activeChallengeConflict.canCancelExisting &&
                activeChallengeConflict.status === 'pending' && (
                  <button
                    onClick={handleCancelAndRestart}
                    disabled={isChallengeSending}
                    className="w-full py-3 bg-white/10 text-white border border-white/20 rounded-xl disabled:opacity-50"
                  >
                    {isChallengeSending ? 'Restarting...' : 'Cancel & Start New'}
                  </button>
                )}

              {!activeChallengeConflict.canCancelExisting &&
                activeChallengeConflict.status === 'pending' && (
                  <button
                    onClick={handleDeclineAndRestart}
                    disabled={isChallengeSending}
                    className="w-full py-3 bg-white/10 text-white border border-white/20 rounded-xl disabled:opacity-50"
                  >
                    {isChallengeSending ? 'Restarting...' : 'Decline & Start New'}
                  </button>
                )}

              <button
                onClick={() => setActiveChallengeConflict(null)}
                className="w-full py-3 text-white/70"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function StatBox({
  label,
  value,
  color,
}: {
  label: string
  value: string | number
  color: string
}): JSX.Element {
  const colors: Record<string, string> = {
    purple: 'bg-purple-500/20 text-purple-300',
    yellow: 'bg-yellow-500/20 text-yellow-300',
    blue: 'bg-blue-500/20 text-blue-300',
    green: 'bg-green-500/20 text-green-300',
  }

  return (
    <div className={`${colors[color]} backdrop-blur-sm rounded-lg p-2 text-center`}>
      <p className="text-white font-bold text-lg">{value}</p>
      <p className="text-xs opacity-80">{label}</p>
    </div>
  )
}

function StatRow({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="flex items-center justify-between">
      <span className="text-white/50">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  )
}
