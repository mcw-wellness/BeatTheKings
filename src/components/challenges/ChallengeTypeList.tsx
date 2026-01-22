'use client'

import { useRouter } from 'next/navigation'
import { Logo } from '@/components/layout/Logo'
import {
  StadiumPageLayout,
  PageLoadingState,
  PageErrorState,
} from '@/components/layout/StadiumPageLayout'

interface BestScore {
  scoreValue: number
  maxValue: number
  accuracy: number
}

interface ChallengeWithAttempts {
  id: string
  name: string
  description: string
  difficulty: string
  xpReward: number
  venueName: string
  venueId: string
  attempts: number
  bestScore: BestScore | null
}

interface ChallengeTypeListProps {
  title: string
  challenges: ChallengeWithAttempts[]
  total: number
  completed: number
  isLoading: boolean
  error: string | null
}

export function ChallengeTypeList({
  title,
  challenges,
  total,
  completed,
  isLoading,
  error,
}: ChallengeTypeListProps): JSX.Element {
  const router = useRouter()
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
  const byVenue = challenges.reduce(
    (acc, ch) => {
      if (!acc[ch.venueName]) acc[ch.venueName] = []
      acc[ch.venueName].push(ch)
      return acc
    },
    {} as Record<string, ChallengeWithAttempts[]>
  )

  if (isLoading) return <PageLoadingState />
  if (error) return <PageErrorState error={error} />

  return (
    <StadiumPageLayout>
      <Header title={title} />
      <ProgressCard total={total} completed={completed} percentage={percentage} />
      <ChallengeList byVenue={byVenue} onNavigate={(id) => router.push(`/challenges/${id}`)} />
      <BackButton onClick={() => router.push('/challenges')} />
    </StadiumPageLayout>
  )
}

function Header({ title }: { title: string }): JSX.Element {
  return (
    <div className="flex items-center gap-3">
      <Logo size="sm" linkToHome className="w-10 h-10" />
      <div className="flex-1">
        <h1 className="text-xl font-bold text-white">{title}</h1>
        <p className="text-sm text-white/60">Training Challenges</p>
      </div>
    </div>
  )
}

function ProgressCard({
  total,
  completed,
  percentage,
}: {
  total: number
  completed: number
  percentage: number
}): JSX.Element {
  return (
    <div className="bg-[#1e2a4a]/90 backdrop-blur rounded-xl p-4 border border-white/10">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-white/80">Progress</span>
        <span className="text-sm font-bold text-white">
          {completed}/{total} completed
        </span>
      </div>
      <div className="h-3 bg-white/20 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-orange-500 to-yellow-400 rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-white/50 mt-2 text-center">{percentage}% complete</p>
    </div>
  )
}

function ChallengeList({
  byVenue,
  onNavigate,
}: {
  byVenue: Record<string, ChallengeWithAttempts[]>
  onNavigate: (id: string) => void
}): JSX.Element {
  if (Object.keys(byVenue).length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-white/60">No challenges available</p>
      </div>
    )
  }

  return (
    <>
      {Object.entries(byVenue).map(([venueName, challenges]) => (
        <div key={venueName} className="space-y-2">
          <h2 className="text-sm font-semibold text-white/80 uppercase tracking-wide flex items-center gap-2">
            <span>📍</span> {venueName}
          </h2>
          {challenges.map((ch) => (
            <ChallengeCard key={ch.id} challenge={ch} onClick={() => onNavigate(ch.id)} />
          ))}
        </div>
      ))}
    </>
  )
}

const difficultyColors: Record<string, string> = {
  easy: 'bg-green-500/20 text-green-400',
  medium: 'bg-yellow-500/20 text-yellow-400',
  hard: 'bg-red-500/20 text-red-400',
}

function ChallengeCard({
  challenge,
  onClick,
}: {
  challenge: ChallengeWithAttempts
  onClick: () => void
}): JSX.Element {
  return (
    <div
      onClick={onClick}
      className="bg-[#1e2a4a]/90 backdrop-blur border border-white/10 rounded-xl p-4 cursor-pointer active:scale-[0.98] transition-transform"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white">{challenge.name}</h3>
            {challenge.attempts > 0 && <span className="text-green-400 text-sm">✓</span>}
          </div>
          <p className="text-xs text-white/50 mt-1">{challenge.description}</p>
          {challenge.bestScore ? (
            <p className="text-sm text-green-400 mt-2">
              Best: {challenge.bestScore.scoreValue}/{challenge.bestScore.maxValue} (
              {challenge.bestScore.accuracy}%)
            </p>
          ) : (
            <p className="text-sm text-white/40 mt-2">Not attempted</p>
          )}
        </div>
        <div className="text-right">
          <span
            className={`text-xs px-2 py-1 rounded-full ${difficultyColors[challenge.difficulty] || difficultyColors.medium}`}
          >
            {challenge.difficulty}
          </span>
          <p className="text-xs text-orange-400 mt-2">+{challenge.xpReward} XP</p>
        </div>
      </div>
    </div>
  )
}

function BackButton({ onClick }: { onClick: () => void }): JSX.Element {
  return (
    <button
      onClick={onClick}
      className="w-full bg-[#1e2a4a]/80 border border-white/10 text-white font-medium py-3 rounded-xl transition-colors hover:bg-[#1e2a4a]"
    >
      ← Back to Challenges
    </button>
  )
}
