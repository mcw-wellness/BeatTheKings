'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'

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

  useEffect(() => {
    if (!userId) return

    const fetchData = async (): Promise<void> => {
      setLoading(true)
      setError(null)

      try {
        const res = await fetch(`/api/players/${userId}/trump-card`)
        if (!res.ok) {
          throw new Error('Failed to load player')
        }
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

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#1a1a2e] to-[#16213e] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-yellow-500 border-t-transparent" />
      </main>
    )
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#1a1a2e] to-[#16213e] flex flex-col items-center justify-center p-4">
        <p className="text-red-400 mb-4">{error || 'Player not found'}</p>
        <button onClick={() => router.back()} className="text-yellow-500 underline">
          Go Back
        </button>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#1a1a2e] to-[#16213e]">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white flex items-center gap-2"
        >
          ← Back
        </button>
        {isKing && (
          <span className="bg-yellow-500/20 text-yellow-400 text-xs px-3 py-1 rounded-full border border-yellow-500/50">
            👑 King
          </span>
        )}
      </div>

      {/* Card Content */}
      <div className="px-4 pb-8">
        {/* Player Name & Rank */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">{data.player.name || 'Player'}</h1>
          <div className="flex items-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-xl border border-yellow-500/50">
            <span className="text-yellow-400 text-lg">🏆</span>
            <span className="text-white font-bold text-xl">#{data.stats.rank || '-'}</span>
          </div>
        </div>

        {/* Avatar */}
        <div className="flex justify-center mb-6">
          <div className="relative w-48 h-56 bg-gradient-to-b from-amber-900/30 to-amber-950/30 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-yellow-500/30">
            <Image
              src={data.player.avatar?.imageUrl || ''}
              alt="Avatar"
              width={180}
              height={220}
              className="object-contain"
            />
            {isKing && <div className="absolute top-2 left-1/2 -translate-x-1/2 text-4xl">👑</div>}
          </div>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatCard
            icon="XP"
            label="XP"
            value={`${data.stats.xp}`}
            subValue={`+${data.stats.xpToNextLevel} to next`}
            color="purple"
          />
          <StatCard icon="🪙" label="RP" value={data.stats.rp.toString()} color="yellow" />
          <StatCard
            icon="🏀"
            label="Total Points"
            value={data.stats.totalPoints.toString()}
            color="blue"
          />
          <StatCard icon="📊" label="Win Rate" value={`${data.stats.winRate}%`} color="green" />
        </div>

        {/* Detailed Stats */}
        <div className="bg-black/30 rounded-xl p-4 mb-6">
          <h2 className="text-white font-semibold mb-3">Stats</h2>
          <div className="space-y-3">
            <DetailRow
              label="Matches"
              value={`${data.stats.matchesWon}W / ${data.stats.matchesLost}L`}
            />
            <DetailRow
              label="Challenges"
              value={`${data.stats.challengesCompleted} / ${data.stats.totalChallenges}`}
            />
            <DetailRow
              label="3-Point Accuracy"
              value={`${data.detailedStats.threePointAccuracy}%`}
            />
            <DetailRow
              label="Free Throw Accuracy"
              value={`${data.detailedStats.freeThrowAccuracy}%`}
            />
          </div>
        </div>

        {/* Events */}
        <div className="space-y-3">
          <h2 className="text-white font-semibold">Championships</h2>
          <div className="bg-gradient-to-r from-purple-600/20 to-purple-500/10 border border-purple-500/30 rounded-xl p-4">
            <p className="text-purple-300 text-xs uppercase tracking-wide">Current</p>
            <p className="text-white font-semibold">December BB Championship</p>
            <p className="text-purple-400 text-sm">sponsored by AVIS</p>
          </div>
          <div className="bg-black/30 border border-gray-700 rounded-xl p-4">
            <p className="text-gray-500 text-xs uppercase tracking-wide">Coming Soon</p>
            <p className="text-gray-400 font-semibold">3P Shooting Championship</p>
            <p className="text-gray-500 text-sm">sponsored by K1</p>
          </div>
        </div>
      </div>
    </main>
  )
}

function StatCard({
  icon,
  label,
  value,
  subValue,
  color,
}: {
  icon: string
  label: string
  value: string
  subValue?: string
  color: string
}): JSX.Element {
  const colorClasses: Record<string, string> = {
    purple: 'bg-purple-500/20 border-purple-500/30',
    yellow: 'bg-yellow-500/20 border-yellow-500/30',
    blue: 'bg-blue-500/20 border-blue-500/30',
    green: 'bg-green-500/20 border-green-500/30',
  }

  return (
    <div className={`${colorClasses[color]} border rounded-xl p-4`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm">{icon}</span>
        <span className="text-gray-400 text-sm">{label}</span>
      </div>
      <p className="text-white text-2xl font-bold">{value}</p>
      {subValue && <p className="text-gray-500 text-xs">{subValue}</p>}
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-400">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  )
}
