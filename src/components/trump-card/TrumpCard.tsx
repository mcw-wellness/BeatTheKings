'use client'

import { useEffect, useState } from 'react'
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

interface TrumpCardProps {
  userId: string
  isOpen: boolean
  onClose: () => void
}

export function TrumpCard({ userId, isOpen, onClose }: TrumpCardProps): JSX.Element | null {
  const [data, setData] = useState<TrumpCardData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen || !userId) return

    const fetchData = async (): Promise<void> => {
      setLoading(true)
      setError(null)

      try {
        const res = await fetch(`/api/players/${userId}/trump-card`)
        if (!res.ok) {
          throw new Error('Failed to load Trump Card')
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
  }, [isOpen, userId])

  if (!isOpen) return null

  const isKing =
    data?.crowns.isKingOfCourt || data?.crowns.isKingOfCity || data?.crowns.isKingOfCountry

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Card */}
      <div className="relative w-full max-w-md bg-gradient-to-b from-[#1a1a2e] to-[#16213e] rounded-2xl border-2 border-yellow-500/50 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        {/* Gold corner decorations */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-yellow-500 rounded-tl-2xl" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-yellow-500 rounded-tr-2xl" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-yellow-500 rounded-bl-2xl" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-yellow-500 rounded-br-2xl" />

        {loading ? (
          <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-yellow-500 border-t-transparent" />
            <p className="text-white mt-4">Loading...</p>
          </div>
        ) : error ? (
          <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
            <p className="text-red-400">{error}</p>
            <button onClick={onClose} className="mt-4 text-yellow-500 underline">
              Close
            </button>
          </div>
        ) : data ? (
          <div className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">{data.player.name || 'Player'}</h2>
              <div className="flex items-center gap-2">
                {isKing && (
                  <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-1 rounded-full border border-yellow-500/50">
                    👑 I&apos;m the King
                  </span>
                )}
                <div className="flex items-center gap-1 bg-yellow-500/20 px-3 py-1 rounded-lg border border-yellow-500/50">
                  <span className="text-yellow-400">🏆</span>
                  <span className="text-white font-bold">#{data.stats.rank || '-'}</span>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex gap-4">
              {/* Avatar */}
              <div className="flex-shrink-0 w-32 h-40 bg-gradient-to-b from-amber-900/30 to-amber-950/30 rounded-xl flex items-center justify-center overflow-hidden border border-yellow-500/30 relative">
                <Image
                  src={data.player.avatar?.imageUrl || ''}
                  alt="Avatar"
                  width={120}
                  height={150}
                  className="object-contain"
                />
                {isKing && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-2xl">👑</div>
                )}
              </div>

              {/* Stats Panel */}
              <div className="flex-1 space-y-2">
                <StatRow
                  icon="XP"
                  label="XP"
                  value={`${data.stats.xp}/${data.stats.xp + data.stats.xpToNextLevel}`}
                  color="purple"
                />
                <StatRow icon="🪙" label="RP" value={data.stats.rp.toString()} color="yellow" />
                <StatRow
                  icon="🏀"
                  label="Total Points"
                  value={data.stats.totalPoints.toString()}
                  color="white"
                />
                <StatRow icon="📊" label="WinRate" value={`${data.stats.winRate}%`} color="green" />
              </div>
            </div>

            {/* Achievement Badge */}
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-2 bg-yellow-500/20 px-3 py-2 rounded-lg">
                <span className="text-yellow-400">⭐</span>
                <span className="text-white font-bold">{data.stats.winRate}%</span>
              </div>

              {/* Detailed Stats */}
              <div className="flex-1 bg-black/30 rounded-lg p-3 space-y-1">
                <DetailRow
                  icon="🏀"
                  label="Marks"
                  value={`${data.stats.matchesWon}/${data.stats.matchesPlayed}`}
                />
                <DetailRow
                  icon="🏀"
                  label="Challenges"
                  value={`${data.stats.challengesCompleted}/${data.stats.totalChallenges}`}
                />
                <DetailRow
                  icon="🏀"
                  label="Total Points"
                  value={data.stats.totalPoints.toString()}
                />
                <DetailRow icon="🏀" label="WinRate" value={`${data.stats.winRate}%`} />
              </div>
            </div>

            {/* Events Section */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className="bg-black/30 rounded-lg p-3 border border-yellow-500/20">
                <p className="text-xs text-gray-400">December</p>
                <p className="text-sm text-white font-semibold">BB Championship</p>
                <p className="text-xs text-yellow-400">sponsored by AVIS</p>
              </div>
              <div className="bg-black/30 rounded-lg p-3 border border-gray-500/20">
                <p className="text-xs text-gray-500">COMING SOON</p>
                <p className="text-sm text-gray-400 font-semibold">3P Shooting Championship</p>
                <p className="text-xs text-gray-500">sponsored by K1</p>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-12 h-12 mx-auto mt-4 flex items-center justify-center bg-red-500 hover:bg-red-600 rounded-full text-white text-xl transition-colors"
            >
              ✕
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function StatRow({
  icon,
  label,
  value,
  color,
}: {
  icon: string
  label: string
  value: string
  color: string
}): JSX.Element {
  const colorClasses: Record<string, string> = {
    purple: 'bg-purple-500/20 text-purple-300',
    yellow: 'bg-yellow-500/20 text-yellow-300',
    white: 'bg-white/10 text-white',
    green: 'bg-green-500/20 text-green-300',
  }

  return (
    <div
      className={`flex items-center justify-between px-3 py-2 rounded-lg ${colorClasses[color] || colorClasses.white}`}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm">{icon}</span>
        <span className="text-sm font-medium">{label}</span>
      </div>
      <span className="font-bold">{value}</span>
    </div>
  )
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: string
  label: string
  value: string
}): JSX.Element {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        <span>{icon}</span>
        <span className="text-gray-300">{label}</span>
      </div>
      <span className="text-white font-medium">{value}</span>
    </div>
  )
}

export default TrumpCard
