'use client'

import Image from 'next/image'
import { useAvatarUrlWithLoading } from '@/lib/hooks/useAvatarUrl'

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

interface MatchCardProps {
  match: Match
  onClick: () => void
}

function UserAvatar(): JSX.Element {
  const { url, isLoading } = useAvatarUrlWithLoading({})

  if (isLoading) {
    return (
      <div className="w-16 h-20 rounded-lg bg-white/10 flex items-center justify-center">
        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="w-16 h-20 rounded-lg overflow-hidden bg-white/10">
      {url ? (
        <Image src={url} alt="You" width={64} height={80} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-2xl">👤</div>
      )}
    </div>
  )
}

function getStatusDisplay(match: Match): {
  label: string
  color: string
  icon: string
  date?: string
} {
  switch (match.status) {
    case 'pending':
    case 'accepted':
    case 'in_progress':
    case 'uploading':
    case 'analyzing':
      return { label: 'Pending', color: 'text-yellow-400', icon: '⚠️' }
    case 'completed':
      return { label: 'Verified', color: 'text-green-400', icon: '✓' }
    case 'disputed':
      return {
        label: 'Disputed',
        color: 'text-red-400',
        icon: '⚠️',
        date: new Date(match.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
      }
    default:
      return { label: match.status, color: 'text-white/60', icon: '' }
  }
}

export function MatchCard({ match, onClick }: MatchCardProps): JSX.Element {
  const status = getStatusDisplay(match)
  const myScore =
    match.player1Score !== null && match.player2Score !== null
      ? match.isChallenger
        ? match.player1Score
        : match.player2Score
      : null
  const oppScore =
    match.player1Score !== null && match.player2Score !== null
      ? match.isChallenger
        ? match.player2Score
        : match.player1Score
      : null
  const hasScore = myScore !== null && oppScore !== null

  return (
    <div
      onClick={onClick}
      className="bg-[#1e2a4a]/90 backdrop-blur rounded-xl border border-white/10 p-4 cursor-pointer active:scale-[0.98] transition-transform"
    >
      <p className="text-center text-white font-semibold mb-3">{match.opponent.name || 'Player'}</p>
      <div className="flex items-center justify-between">
        <div className="flex flex-col items-center">
          <UserAvatar />
          <span className="text-xs text-green-400 mt-1">+150 XP</span>
        </div>
        <div className="flex-1 flex flex-col items-center">
          {hasScore ? (
            <div className="text-3xl font-bold text-white">
              {myScore}-{oppScore}
            </div>
          ) : (
            <div className="text-xl font-bold text-white/40">vs</div>
          )}
          <div className={`flex items-center gap-1 mt-1 ${status.color}`}>
            <span>{status.icon}</span>
            <span className="text-sm font-medium">{status.label}</span>
          </div>
          {status.date && <span className="text-xs text-white/40 mt-0.5">{status.date}</span>}
        </div>
        <div className="flex flex-col items-center">
          <div className="w-16 h-20 rounded-lg overflow-hidden bg-white/10">
            {match.opponent.avatar?.imageUrl ? (
              <Image
                src={match.opponent.avatar.imageUrl}
                alt={match.opponent.name || 'Opponent'}
                width={64}
                height={80}
                className="w-full h-full object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl">👤</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
