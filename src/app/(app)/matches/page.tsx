'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Logo } from '@/components/layout/Logo'
import { MatchCard, FilterTabs } from '@/components/matches'
import { logger } from '@/lib/utils/logger'

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

type FilterType = 'all' | 'pending' | 'verified' | 'disputed'

const ACTIVE_STATUSES = ['pending', 'accepted', 'in_progress', 'uploading', 'analyzing']

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
      logger.error({ error: err }, 'Failed to fetch matches')
    } finally {
      setIsLoading(false)
    }
  }

  const getFilteredMatches = () => {
    switch (filter) {
      case 'pending':
        return matches.filter((m) => ACTIVE_STATUSES.includes(m.status))
      case 'verified':
        return matches.filter((m) => m.status === 'completed')
      case 'disputed':
        return matches.filter((m) => m.status === 'disputed')
      default:
        return matches
    }
  }

  const pendingCount = matches.filter((m) => ACTIVE_STATUSES.includes(m.status)).length
  const disputedCount = matches.filter((m) => m.status === 'disputed').length

  const handleMatchClick = (match: Match) => {
    const routes: Record<string, string> = {
      pending: match.isChallenger ? `/challenges/1v1/${match.id}/pending` : '/challenges',
      accepted: `/challenges/1v1/${match.id}/ready`,
      in_progress: `/challenges/1v1/${match.id}/record`,
      uploading: `/challenges/1v1/${match.id}/upload`,
      analyzing: `/challenges/1v1/${match.id}/results`,
      completed: `/challenges/1v1/${match.id}/results`,
      disputed: `/challenges/1v1/${match.id}/results`,
    }
    router.push(routes[match.status] || `/matches/${match.id}`)
  }

  const filteredMatches = getFilteredMatches()

  return (
    <main className="min-h-screen relative" style={backgroundStyle}>
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none" />
      <div className="max-w-lg mx-auto p-4 space-y-4 relative z-10">
        <Header />
        <FilterTabs
          filter={filter}
          setFilter={setFilter}
          pendingCount={pendingCount}
          disputedCount={disputedCount}
        />
        <MatchList
          matches={filteredMatches}
          isLoading={isLoading}
          filter={filter}
          onMatchClick={handleMatchClick}
          onFindChallenge={() => router.push('/challenges')}
        />
      </div>
    </main>
  )
}

const backgroundStyle = {
  backgroundImage: 'url(/backgrounds/stadium.png)',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
}

function Header(): JSX.Element {
  return (
    <>
      <div className="flex items-center justify-between">
        <Logo size="sm" linkToHome className="w-10 h-10" />
        <div className="flex-1" />
      </div>
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white">My Matches</h1>
        <p className="text-sm text-white/60">1v1 Challenge History</p>
      </div>
    </>
  )
}

interface MatchListProps {
  matches: Match[]
  isLoading: boolean
  filter: FilterType
  onMatchClick: (match: Match) => void
  onFindChallenge: () => void
}

function MatchList({
  matches,
  isLoading,
  filter,
  onMatchClick,
  onFindChallenge,
}: MatchListProps): JSX.Element {
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent mx-auto" />
        <p className="text-white/60 mt-4">Loading matches...</p>
      </div>
    )
  }

  if (matches.length === 0) {
    return (
      <div className="text-center py-12 bg-[#1e2a4a]/90 backdrop-blur rounded-xl border border-white/10">
        <p className="text-white/60 mb-4">
          {filter === 'all' ? 'No matches yet' : `No ${filter} matches`}
        </p>
        <button
          onClick={onFindChallenge}
          className="bg-gradient-to-r from-orange-500 to-yellow-400 hover:from-orange-600 hover:to-yellow-500 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
        >
          Find a Challenge
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {matches.map((match) => (
        <MatchCard key={match.id} match={match} onClick={() => onMatchClick(match)} />
      ))}
    </div>
  )
}
