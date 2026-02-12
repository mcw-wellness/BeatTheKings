'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Logo } from '@/components/layout/Logo'
import { MatchCard, FilterTabs, InvitationCard } from '@/components/matches'
import type { Invitation } from '@/components/matches'
import { logger } from '@/lib/utils/logger'

type MatchStatus =
  | 'pending'
  | 'scheduled'
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

const ACTIVE_STATUSES = ['pending', 'scheduled', 'accepted', 'in_progress', 'uploading', 'analyzing']

export default function MatchesPage() {
  const router = useRouter()
  const [matches, setMatches] = useState<Match[]>([])
  const [receivedInvitations, setReceivedInvitations] = useState<Invitation[]>([])
  const [sentInvitations, setSentInvitations] = useState<Invitation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('all')
  const [respondingId, setRespondingId] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [matchesRes, receivedRes, sentRes] = await Promise.all([
        fetch('/api/matches'),
        fetch('/api/match-invitations?type=received'),
        fetch('/api/match-invitations?type=sent'),
      ])

      if (matchesRes.ok) {
        const data = await matchesRes.json()
        setMatches(data.matches || [])
      }
      if (receivedRes.ok) {
        const data = await receivedRes.json()
        setReceivedInvitations(data.invitations || [])
      }
      if (sentRes.ok) {
        const data = await sentRes.json()
        setSentInvitations(data.invitations || [])
      }
    } catch (err) {
      logger.error({ error: err }, 'Failed to fetch matches data')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleRespond = async (invitationId: string, accept: boolean): Promise<void> => {
    setRespondingId(invitationId)
    try {
      const res = await fetch(`/api/match-invitations/${invitationId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accept }),
      })
      if (res.ok) {
        await fetchData()
      }
    } catch (err) {
      logger.error({ error: err }, 'Failed to respond to invitation')
    } finally {
      setRespondingId(null)
    }
  }

  const handleCancel = async (invitationId: string): Promise<void> => {
    setRespondingId(invitationId)
    try {
      const res = await fetch(`/api/match-invitations/${invitationId}`, { method: 'DELETE' })
      if (res.ok) {
        await fetchData()
      }
    } catch (err) {
      logger.error({ error: err }, 'Failed to cancel invitation')
    } finally {
      setRespondingId(null)
    }
  }

  const getFilteredMatches = (): Match[] => {
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

  const handleMatchClick = (match: Match): void => {
    const routes: Record<string, string> = {
      scheduled: `/challenges/1v1/${match.id}/ready`,
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

  const pendingCount = matches.filter((m) => ACTIVE_STATUSES.includes(m.status)).length
  const disputedCount = matches.filter((m) => m.status === 'disputed').length
  const pendingInvitations = receivedInvitations.filter((i) => i.status === 'pending')
  const pendingSentInvitations = sentInvitations.filter((i) => i.status === 'pending')
  const filteredMatches = getFilteredMatches()

  // Sort: scheduled first (soonest), then rest by createdAt
  const sortedMatches = [...filteredMatches].sort((a, b) => {
    if (a.status === 'scheduled' && b.status !== 'scheduled') return -1
    if (b.status === 'scheduled' && a.status !== 'scheduled') return 1
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  return (
    <main className="h-dvh flex flex-col overflow-hidden relative" style={backgroundStyle}>
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none" />
      <div className="max-w-lg mx-auto p-4 space-y-4 relative z-10 flex-1 overflow-y-auto">
        <Header invitationCount={pendingInvitations.length} />
        <FilterTabs
          filter={filter}
          setFilter={setFilter}
          pendingCount={pendingCount}
          disputedCount={disputedCount}
        />

        {isLoading ? (
          <LoadingState />
        ) : (
          <div className="space-y-3">
            {/* Pending Received Invitations — always at top */}
            {pendingInvitations.length > 0 && (
              <div className="space-y-3">
                {pendingInvitations.map((inv) => (
                  <InvitationCard
                    key={inv.id}
                    invitation={inv}
                    type="received"
                    isResponding={respondingId === inv.id}
                    onAccept={() => handleRespond(inv.id, true)}
                    onDecline={() => handleRespond(inv.id, false)}
                    onCancel={() => {}}
                  />
                ))}
              </div>
            )}

            {/* Pending Sent Invitations */}
            {pendingSentInvitations.length > 0 && (
              <div className="space-y-3">
                {pendingSentInvitations.map((inv) => (
                  <InvitationCard
                    key={inv.id}
                    invitation={inv}
                    type="sent"
                    isResponding={respondingId === inv.id}
                    onAccept={() => {}}
                    onDecline={() => {}}
                    onCancel={() => handleCancel(inv.id)}
                  />
                ))}
              </div>
            )}

            {/* Matches */}
            {sortedMatches.length > 0 ? (
              sortedMatches.map((match) => (
                <MatchCard key={match.id} match={match} onClick={() => handleMatchClick(match)} />
              ))
            ) : pendingInvitations.length === 0 && pendingSentInvitations.length === 0 ? (
              <EmptyState onFindChallenge={() => router.push('/challenges')} filter={filter} />
            ) : null}
          </div>
        )}
      </div>
    </main>
  )
}

const backgroundStyle = {
  backgroundImage: 'url(/backgrounds/stadium.png)',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
}

function Header({ invitationCount }: { invitationCount: number }): JSX.Element {
  return (
    <>
      <div className="flex items-center justify-between">
        <Logo size="sm" linkToHome className="w-10 h-10" />
        {invitationCount > 0 && (
          <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            {invitationCount} new
          </span>
        )}
      </div>
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white">My Matches</h1>
        <p className="text-sm text-white/60">1x1 Match History</p>
      </div>
    </>
  )
}

function LoadingState(): JSX.Element {
  return (
    <div className="text-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent mx-auto" />
      <p className="text-white/60 mt-4">Loading matches...</p>
    </div>
  )
}

function EmptyState({
  onFindChallenge,
  filter,
}: {
  onFindChallenge: () => void
  filter: string
}): JSX.Element {
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
