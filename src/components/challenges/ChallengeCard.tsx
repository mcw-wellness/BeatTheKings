'use client'

import { useState } from 'react'

interface BestScore {
  scoreValue: number
  maxValue: number
  accuracy: number
}

interface AttemptHistoryItem {
  id: string
  scoreValue: number
  maxValue: number
  accuracy: number
  isBest: boolean
  completedAt: string
}

export interface ChallengeWithAttempts {
  id: string
  name: string
  description: string
  difficulty: string
  xpReward: number
  venueName: string
  venueId: string
  attempts: number
  bestScore: BestScore | null
  attemptHistory?: AttemptHistoryItem[]
}

const difficultyColors: Record<string, string> = {
  easy: 'bg-green-500/20 text-green-400',
  medium: 'bg-yellow-500/20 text-yellow-400',
  hard: 'bg-red-500/20 text-red-400',
}

function formatAttemptDate(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

interface ChallengeCardProps {
  challenge: ChallengeWithAttempts
  onClick: () => void
}

export function ChallengeCard({ challenge, onClick }: ChallengeCardProps): JSX.Element {
  const [showHistory, setShowHistory] = useState(false)
  const hasHistory = challenge.attemptHistory && challenge.attemptHistory.length > 0

  const handleHistoryToggle = (e: React.MouseEvent): void => {
    e.stopPropagation()
    setShowHistory(!showHistory)
  }

  return (
    <div className="bg-[#1e2a4a]/90 backdrop-blur border border-white/10 rounded-xl overflow-hidden">
      <CardContent challenge={challenge} onClick={onClick} />
      {hasHistory && <HistoryToggle showHistory={showHistory} onToggle={handleHistoryToggle} />}
      {showHistory && hasHistory && <AttemptHistory attempts={challenge.attemptHistory!} />}
    </div>
  )
}

function CardContent({
  challenge,
  onClick,
}: {
  challenge: ChallengeWithAttempts
  onClick: () => void
}): JSX.Element {
  return (
    <div onClick={onClick} className="p-4 cursor-pointer active:scale-[0.98] transition-transform">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white">{challenge.name}</h3>
            {challenge.attempts > 0 && <span className="text-green-400 text-sm">✓</span>}
          </div>
          <p className="text-xs text-white/50 mt-1">{challenge.description}</p>
          <ScoreDisplay bestScore={challenge.bestScore} attempts={challenge.attempts} />
        </div>
        <div className="text-right">
          <DifficultyBadge difficulty={challenge.difficulty} />
          <p className="text-xs text-orange-400 mt-2">+{challenge.xpReward} XP</p>
        </div>
      </div>
    </div>
  )
}

function ScoreDisplay({
  bestScore,
  attempts,
}: {
  bestScore: BestScore | null
  attempts: number
}): JSX.Element {
  if (bestScore) {
    return (
      <p className="text-sm text-green-400 mt-2">
        ⭐ Best: {bestScore.scoreValue}/{bestScore.maxValue} ({bestScore.accuracy}%) • {attempts}{' '}
        attempts
      </p>
    )
  }
  return <p className="text-sm text-white/40 mt-2">Not attempted</p>
}

function DifficultyBadge({ difficulty }: { difficulty: string }): JSX.Element {
  return (
    <span
      className={`text-xs px-2 py-1 rounded-full ${difficultyColors[difficulty] || difficultyColors.medium}`}
    >
      {difficulty}
    </span>
  )
}

function HistoryToggle({
  showHistory,
  onToggle,
}: {
  showHistory: boolean
  onToggle: (e: React.MouseEvent) => void
}): JSX.Element {
  return (
    <button
      onClick={onToggle}
      className="w-full py-2 px-4 bg-white/5 border-t border-white/10 text-xs text-white/60 hover:text-white/80 flex items-center justify-center gap-2 transition-colors"
    >
      <span>📊</span>
      {showHistory ? 'Hide History' : 'View History'}
      <span className="text-white/40">{showHistory ? '▲' : '▼'}</span>
    </button>
  )
}

function AttemptHistory({ attempts }: { attempts: AttemptHistoryItem[] }): JSX.Element {
  return (
    <div className="px-4 pb-4 border-t border-white/10 bg-white/5">
      <p className="text-xs text-white/50 py-2 uppercase tracking-wide">Attempt History</p>
      <div className="space-y-1">
        {attempts.map((attempt) => (
          <AttemptRow key={attempt.id} attempt={attempt} />
        ))}
      </div>
    </div>
  )
}

function AttemptRow({ attempt }: { attempt: AttemptHistoryItem }): JSX.Element {
  return (
    <div
      className={`flex items-center justify-between py-1 text-sm ${
        attempt.isBest ? 'text-green-400' : 'text-white/60'
      }`}
    >
      <div className="flex items-center gap-2">
        {attempt.isBest && <span>⭐</span>}
        <span>{formatAttemptDate(attempt.completedAt)}</span>
      </div>
      <div className="flex items-center gap-3">
        <span>
          {attempt.scoreValue}/{attempt.maxValue}
        </span>
        <span className="w-12 text-right">{attempt.accuracy}%</span>
      </div>
    </div>
  )
}
