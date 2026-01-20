'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'

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
      <main className="h-screen bg-gradient-to-b from-[#1a1a2e] to-[#16213e] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-3 border-yellow-400 border-t-transparent" />
      </main>
    )
  }

  if (error || !data) {
    return (
      <main className="h-screen bg-gradient-to-b from-[#1a1a2e] to-[#16213e] flex flex-col items-center justify-center p-4">
        <p className="text-red-400 mb-4">{error || 'Player not found'}</p>
        <button onClick={() => router.back()} className="text-yellow-400 underline">
          Go Back
        </button>
      </main>
    )
  }

  return (
    <main className="h-screen bg-gradient-to-b from-[#1a1a2e] to-[#16213e] overflow-hidden flex flex-col">
      {/* Header - Compact */}
      <div className="px-4 py-2 flex items-center justify-between shrink-0">
        <button
          onClick={() => router.back()}
          className="text-white/70 hover:text-white text-sm flex items-center gap-1"
        >
          ← Back
        </button>
        {isKing && (
          <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-1 rounded-full">
            👑 King
          </span>
        )}
      </div>

      {/* Card Content - Fills remaining space */}
      <div className="flex-1 px-4 pb-4 flex flex-col min-h-0">
        {/* Player Name & Rank */}
        <div className="flex items-center justify-between mb-2 shrink-0">
          <h1 className="text-xl font-bold text-white truncate">
            {data.player.name || 'Player'}
          </h1>
          <div className="flex items-center gap-1 bg-yellow-500/20 px-3 py-1 rounded-lg">
            <span className="text-yellow-400 text-sm">🏆</span>
            <span className="text-white font-bold">#{data.stats.rank || '-'}</span>
          </div>
        </div>

        {/* Avatar - Fixed height */}
        <div className="flex justify-center mb-3 shrink-0">
          <div className="relative w-32 h-40 bg-gradient-to-b from-blue-900/50 to-purple-900/50 rounded-xl flex items-center justify-center overflow-hidden border border-yellow-500/30">
            <Image
              src={data.player.avatar?.imageUrl || ''}
              alt="Avatar"
              width={120}
              height={150}
              className="object-contain"
              unoptimized
            />
            {isKing && <div className="absolute top-1 left-1/2 -translate-x-1/2 text-2xl">👑</div>}
          </div>
        </div>

        {/* Stats Grid - 2x2 Compact */}
        <div className="grid grid-cols-4 gap-2 mb-3 shrink-0">
          <StatBox label="XP" value={data.stats.xp} color="purple" />
          <StatBox label="RP" value={data.stats.rp} color="yellow" />
          <StatBox label="Points" value={data.stats.totalPoints} color="blue" />
          <StatBox label="Win %" value={`${data.stats.winRate}%`} color="green" />
        </div>

        {/* Detailed Stats - Compact */}
        <div className="bg-white/5 rounded-xl p-3 mb-3 shrink-0">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <StatRow label="Matches" value={`${data.stats.matchesWon}W / ${data.stats.matchesLost}L`} />
            <StatRow label="Challenges" value={`${data.stats.challengesCompleted}`} />
            <StatRow label="3PT %" value={`${data.detailedStats.threePointAccuracy}%`} />
            <StatRow label="FT %" value={`${data.detailedStats.freeThrowAccuracy}%`} />
          </div>
        </div>

        {/* Championship - Compact */}
        <div className="bg-gradient-to-r from-purple-900/30 to-purple-800/20 border border-purple-500/20 rounded-xl p-3 mb-3 shrink-0">
          <p className="text-purple-400 text-xs uppercase tracking-wide">Current Event</p>
          <p className="text-white font-semibold text-sm">December BB Championship</p>
          <p className="text-purple-400 text-xs">sponsored by AVIS</p>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Challenge Button - Fixed at bottom */}
        <div className="shrink-0 space-y-2">
          {challengeError && (
            <p className="text-red-400 text-xs text-center">{challengeError}</p>
          )}
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
            <p className="text-center text-white/40 text-xs">
              Check in to a venue to challenge
            </p>
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
    <div className={`${colors[color]} rounded-lg p-2 text-center`}>
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
