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
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#4361EE] border-t-transparent" />
      </main>
    )
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center p-4">
        <p className="text-red-500 mb-4">{error || 'Player not found'}</p>
        <button onClick={() => router.back()} className="text-[#4361EE] underline">
          Go Back
        </button>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
        >
          ← Back
        </button>
        {isKing && (
          <span className="bg-yellow-100 text-yellow-700 text-xs px-3 py-1 rounded-full border border-yellow-300">
            👑 King
          </span>
        )}
      </div>

      {/* Card Content */}
      <div className="px-4 pb-8">
        {/* Player Name & Rank */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{data.player.name || 'Player'}</h1>
          <div className="flex items-center gap-2 bg-yellow-100 px-4 py-2 rounded-xl border border-yellow-300">
            <span className="text-yellow-600 text-lg">🏆</span>
            <span className="text-gray-900 font-bold text-xl">#{data.stats.rank || '-'}</span>
          </div>
        </div>

        {/* Avatar */}
        <div className="flex justify-center mb-6">
          <div className="relative w-48 h-56 bg-gradient-to-b from-blue-100 to-blue-50 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-blue-200 shadow-lg">
            <Image
              src={data.player.avatar?.imageUrl || ''}
              alt="Avatar"
              width={180}
              height={220}
              className="object-contain"
              unoptimized
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
        <div className="bg-white rounded-xl p-4 mb-6 shadow">
          <h2 className="text-gray-900 font-semibold mb-3">Stats</h2>
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
          <h2 className="text-gray-900 font-semibold">Championships</h2>
          <div className="bg-gradient-to-r from-purple-100 to-purple-50 border border-purple-200 rounded-xl p-4 shadow">
            <p className="text-purple-600 text-xs uppercase tracking-wide">Current</p>
            <p className="text-gray-900 font-semibold">December BB Championship</p>
            <p className="text-purple-500 text-sm">sponsored by AVIS</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow">
            <p className="text-gray-400 text-xs uppercase tracking-wide">Coming Soon</p>
            <p className="text-gray-600 font-semibold">3P Shooting Championship</p>
            <p className="text-gray-400 text-sm">sponsored by K1</p>
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
    purple: 'bg-purple-50 border-purple-200',
    yellow: 'bg-yellow-50 border-yellow-200',
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
  }

  const textClasses: Record<string, string> = {
    purple: 'text-purple-600',
    yellow: 'text-yellow-600',
    blue: 'text-blue-600',
    green: 'text-green-600',
  }

  return (
    <div className={`${colorClasses[color]} border rounded-xl p-4 shadow`}>
      <div className="flex items-center gap-2 mb-1">
        <span className={`text-sm ${textClasses[color]}`}>{icon}</span>
        <span className="text-gray-500 text-sm">{label}</span>
      </div>
      <p className="text-gray-900 text-2xl font-bold">{value}</p>
      {subValue && <p className="text-gray-400 text-xs">{subValue}</p>}
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-900 font-medium">{value}</span>
    </div>
  )
}
