'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import { Logo } from '@/components/layout/Logo'

interface UserVenue {
  venueId: string
  venueName: string
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

  const handleChallenge = async () => {
    if (!userVenue) {
      setChallengeError('Check in to a venue first')
      return
    }

    setIsChallengeSending(true)
    setChallengeError(null)

    try {
      const res = await fetch('/api/challenges/1v1/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opponentId: userId,
          venueId: userVenue.venueId,
        }),
      })

      const json = await res.json()

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
      <main className="h-screen flex items-center justify-center bg-[#0a0a1a]">
        <div className="animate-spin rounded-full h-10 w-10 border-3 border-yellow-400 border-t-transparent" />
      </main>
    )
  }

  if (error || !data) {
    return (
      <main className="h-screen flex flex-col items-center justify-center p-4 bg-[#0a0a1a]">
        <p className="text-red-400 mb-4">{error || 'Player not found'}</p>
        <button onClick={() => router.back()} className="text-yellow-400 underline">
          Go Back
        </button>
      </main>
    )
  }

  return (
    <main className="h-screen overflow-hidden flex flex-col bg-[#0a0a1a]">
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

        {/* Challenge Button */}
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
                <span>Challenge to 1v1</span>
              </>
            )}
          </button>
          {!userVenue && (
            <p className="text-center text-white/40 text-xs">Check in to a venue to challenge</p>
          )}
        </div>
      </div>
    </main>
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
