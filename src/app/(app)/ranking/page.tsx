'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface RankedPlayer {
  id: string
  rank: number
  name: string | null
  gender: string | null
  xp: number
  avatar: {
    imageUrl: string | null
    skinTone: string | null
    hairStyle: string | null
    hairColor: string | null
  } | null
  isKing: boolean
}

interface RankingsData {
  level: string
  sport: string
  location: { id: string; name: string } | null
  king: RankedPlayer | null
  rankings: RankedPlayer[]
  currentUser: RankedPlayer | null
  totalPlayers: number
}

type TabType = 'venue' | 'city' | 'country'

export default function RankingPage(): JSX.Element {
  const router = useRouter()
  const [tab, setTab] = useState<TabType>('city')
  const [data, setData] = useState<RankingsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const tabs: { id: TabType; label: string }[] = [
    { id: 'venue', label: 'Court' },
    { id: 'city', label: 'City' },
    { id: 'country', label: 'Country' },
  ]

  const fetchRankings = useCallback(async (): Promise<void> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/rankings?level=${tab}&limit=10`)

      if (!response.ok) {
        throw new Error('Failed to load rankings')
      }

      const json = await response.json()
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }, [tab])

  useEffect(() => {
    fetchRankings()
  }, [fetchRankings])

  const openPlayerCard = (playerId: string): void => {
    router.push(`/player/${playerId}`)
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/welcome')}
              className="text-gray-400 hover:text-white"
            >
              ← Back
            </button>
            <h1 className="text-xl font-bold text-white">Rankings</h1>
          </div>
          <div className="flex gap-2">
            <span className="text-2xl">🏀</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-800 rounded-xl p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                tab === t.id ? 'bg-yellow-500 text-gray-900' : 'text-gray-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Location */}
        {data?.location && (
          <p className="text-gray-400 text-sm text-center">
            {data.location.name} • {data.totalPlayers} players
          </p>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-yellow-500 border-t-transparent" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-400">{error}</div>
        ) : data ? (
          <>
            {/* King Section */}
            {data.king && (
              <div
                onClick={() => openPlayerCard(data.king!.id)}
                className="bg-gradient-to-r from-yellow-600/20 to-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 cursor-pointer active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">👑</span>
                  <span className="text-yellow-400 font-bold text-sm uppercase tracking-wide">
                    King of the {tab === 'venue' ? 'Court' : tab === 'city' ? 'City' : 'Country'}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center overflow-hidden border-2 border-yellow-500">
                    <Image
                      src={data.king.avatar?.imageUrl || ''}
                      alt="Avatar"
                      width={64}
                      height={64}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-bold text-lg">{data.king.name || 'Player'}</p>
                    <p className="text-yellow-400 text-sm">XP: {data.king.xp.toLocaleString()}</p>
                  </div>
                  <div className="text-3xl font-bold text-yellow-400">#1</div>
                </div>
              </div>
            )}

            {/* Rankings List */}
            <div className="space-y-2">
              <h2 className="text-white font-semibold text-sm uppercase tracking-wide px-1">
                Top Players
              </h2>
              {data.rankings.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No players ranked yet</p>
              ) : (
                data.rankings.map((player) => (
                  <div
                    key={player.id}
                    onClick={() => openPlayerCard(player.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer active:scale-[0.98] transition-transform ${
                      player.isKing
                        ? 'bg-yellow-500/10 border border-yellow-500/30'
                        : 'bg-gray-800/50 active:bg-gray-700'
                    }`}
                  >
                    {/* Rank */}
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                        player.rank === 1
                          ? 'bg-yellow-500 text-gray-900'
                          : player.rank === 2
                            ? 'bg-gray-400 text-gray-900'
                            : player.rank === 3
                              ? 'bg-orange-500 text-white'
                              : 'bg-gray-700 text-gray-300'
                      }`}
                    >
                      {player.rank}
                    </div>

                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                      <Image
                        src={player.avatar?.imageUrl || ''}
                        alt="Avatar"
                        width={40}
                        height={40}
                        className="object-cover w-full h-full"
                      />
                    </div>

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">
                        {player.name || 'Player'}
                        {player.isKing && <span className="ml-2">👑</span>}
                      </p>
                    </div>

                    {/* XP */}
                    <div className="text-right">
                      <p className="text-yellow-400 font-bold">{player.xp.toLocaleString()}</p>
                      <p className="text-gray-500 text-xs">XP</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Current User Rank (if not in top 10) */}
            {data.currentUser && data.currentUser.rank > 10 && (
              <>
                <div className="border-t border-gray-700 my-4" />
                <div className="text-gray-500 text-xs text-center mb-2">Your Rank</div>
                <div
                  onClick={() => openPlayerCard(data.currentUser!.id)}
                  className="flex items-center gap-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl cursor-pointer active:scale-[0.98] transition-transform"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center font-bold text-sm text-white">
                    {data.currentUser.rank}
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                    <Image
                      src={data.currentUser.avatar?.imageUrl || ''}
                      alt="Avatar"
                      width={40}
                      height={40}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">
                      {data.currentUser.name || 'You'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-blue-400 font-bold">
                      {data.currentUser.xp.toLocaleString()}
                    </p>
                    <p className="text-gray-500 text-xs">XP</p>
                  </div>
                </div>
              </>
            )}
          </>
        ) : null}
      </div>
    </main>
  )
}
