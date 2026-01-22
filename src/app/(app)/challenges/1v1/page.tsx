'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Logo } from '@/components/layout/Logo'
import {
  StadiumPageLayout,
  PageLoadingState,
  PageErrorState,
} from '@/components/layout/StadiumPageLayout'
import { UserAvatar } from '@/components/ui/UserAvatar'

interface Match1v1History {
  id: string
  opponent: { id: string; name: string | null; avatarUrl: string | null }
  venueName: string
  myScore: number
  opponentScore: number
  won: boolean
  completedAt: string
}

interface HistoryResponse {
  stats: { totalMatches: number; wins: number; losses: number }
  matches: Match1v1History[]
}

export default function OneVsOnePage(): JSX.Element {
  const router = useRouter()
  const [data, setData] = useState<HistoryResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch('/api/challenges/1v1/history')
        if (!response.ok) throw new Error('Failed to load history')
        setData(await response.json())
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
      } finally {
        setIsLoading(false)
      }
    }
    fetchHistory()
  }, [])

  if (isLoading) return <PageLoadingState />
  if (error) return <PageErrorState error={error} />

  return (
    <StadiumPageLayout>
      <Header />
      <StatsCard stats={data?.stats} />
      <MatchList matches={data?.matches ?? []} router={router} />
      {(data?.matches.length ?? 0) > 0 && (
        <button
          onClick={() => router.push('/challenges')}
          className="w-full bg-gradient-to-r from-orange-500 to-yellow-400 hover:from-orange-600 hover:to-yellow-500 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          Find New Opponent
        </button>
      )}
    </StadiumPageLayout>
  )
}

function Header(): JSX.Element {
  return (
    <div className="flex items-center gap-3">
      <Logo size="sm" linkToHome className="w-10 h-10" />
      <div className="flex-1">
        <h1 className="text-xl font-bold text-white">1v1 Challenges</h1>
        <p className="text-sm text-white/60">Match History</p>
      </div>
    </div>
  )
}

function StatsCard({
  stats,
}: {
  stats?: { totalMatches: number; wins: number; losses: number }
}): JSX.Element {
  return (
    <div className="bg-[#1e2a4a]/90 backdrop-blur rounded-xl p-4 border border-white/10">
      <div className="flex justify-around text-center">
        <div>
          <p className="text-2xl font-bold text-white">{stats?.totalMatches ?? 0}</p>
          <p className="text-xs text-white/60">Matches</p>
        </div>
        <div className="border-l border-white/20 pl-6">
          <p className="text-2xl font-bold text-green-400">{stats?.wins ?? 0}</p>
          <p className="text-xs text-white/60">Wins</p>
        </div>
        <div className="border-l border-white/20 pl-6">
          <p className="text-2xl font-bold text-red-400">{stats?.losses ?? 0}</p>
          <p className="text-xs text-white/60">Losses</p>
        </div>
      </div>
    </div>
  )
}

interface MatchListProps {
  matches: Match1v1History[]
  router: ReturnType<typeof useRouter>
}

function MatchList({ matches, router }: MatchListProps): JSX.Element {
  if (matches.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-white/60 mb-4">No matches played yet</p>
        <button
          onClick={() => router.push('/challenges')}
          className="bg-gradient-to-r from-orange-500 to-yellow-400 hover:from-orange-600 hover:to-yellow-500 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
        >
          Find Opponent
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-white/80 uppercase tracking-wide">
        Recent Matches
      </h2>
      {matches.map((match) => (
        <MatchCard
          key={match.id}
          match={match}
          onClick={() => router.push(`/matches/${match.id}`)}
        />
      ))}
    </div>
  )
}

function MatchCard({
  match,
  onClick,
}: {
  match: Match1v1History
  onClick: () => void
}): JSX.Element {
  const date = new Date(match.completedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div
      onClick={onClick}
      className="bg-[#1e2a4a]/90 backdrop-blur border border-white/10 rounded-xl p-4 cursor-pointer active:scale-[0.98] transition-transform"
    >
      <div className="flex items-center gap-3">
        <UserAvatar size="md" showXp xpAmount={150} />
        <div className="flex-1 text-center">
          <p className="text-sm text-white/60 mb-1">vs {match.opponent.name || 'Player'}</p>
          <div className={`text-2xl font-bold ${match.won ? 'text-green-400' : 'text-red-400'}`}>
            {match.myScore}-{match.opponentScore}
          </div>
          <p className={`text-xs mt-1 ${match.won ? 'text-green-400' : 'text-red-400'}`}>
            {match.won ? '✓ Won' : '✗ Lost'}
          </p>
        </div>
        <OpponentAvatar opponent={match.opponent} />
      </div>
      <p className="text-xs text-white/40 text-center mt-2">
        {match.venueName} • {date}
      </p>
    </div>
  )
}

function OpponentAvatar({
  opponent,
}: {
  opponent: { name: string | null; avatarUrl: string | null }
}): JSX.Element {
  return (
    <div className="flex flex-col items-center">
      <div className="w-16 h-16 rounded-lg overflow-hidden bg-white/10">
        {opponent.avatarUrl ? (
          <Image
            src={opponent.avatarUrl}
            alt={opponent.name || 'Opponent'}
            width={64}
            height={64}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl">👤</div>
        )}
      </div>
    </div>
  )
}
