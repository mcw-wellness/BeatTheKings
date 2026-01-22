'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Logo } from '@/components/layout/Logo'
import {
  StadiumPageLayout,
  PageLoadingState,
  PageErrorState,
} from '@/components/layout/StadiumPageLayout'
import { OneVsOneSlot } from '@/components/challenges'

interface ChallengeSummary {
  total: number
  completed: number
}

interface ChallengesSummaryResponse {
  freeThrow: ChallengeSummary
  threePointShot: ChallengeSummary
  aroundTheWorld: ChallengeSummary
  sponsoredChallenge: {
    name: string
    sponsor: string
    total: number
    completed: number
  } | null
}

export default function ChallengesPage(): JSX.Element {
  const router = useRouter()
  const [data, setData] = useState<ChallengesSummaryResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await fetch('/api/challenges/summary')
        if (!response.ok) throw new Error('Failed to load challenges')
        setData(await response.json())
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
      } finally {
        setIsLoading(false)
      }
    }
    fetchSummary()
  }, [])

  if (isLoading) return <PageLoadingState />
  if (error) return <PageErrorState error={error} />

  const challengeRows = [
    {
      id: 'free-throw',
      title: 'Free Throw',
      icon: '🏀',
      total: data?.freeThrow.total ?? 0,
      completed: data?.freeThrow.completed ?? 0,
    },
    {
      id: 'three-point',
      title: '3-Point Shot',
      icon: '🎯',
      total: data?.threePointShot.total ?? 0,
      completed: data?.threePointShot.completed ?? 0,
    },
    {
      id: 'around-the-world',
      title: 'Around the World',
      icon: '🌍',
      total: data?.aroundTheWorld.total ?? 0,
      completed: data?.aroundTheWorld.completed ?? 0,
    },
  ]

  return (
    <StadiumPageLayout>
      <div className="flex items-center gap-3">
        <Logo size="sm" linkToHome className="w-10 h-10" />
        <h1 className="text-xl font-bold text-white flex-1">Challenges</h1>
      </div>

      <div className="space-y-3">
        {/* 1v1 Challenge Slot with Active Venues */}
        <OneVsOneSlot />

        {/* Other Challenge Types */}
        {challengeRows.map((row) => (
          <ChallengeRow
            key={row.id}
            row={row}
            onClick={() => router.push(`/challenges/${row.id}`)}
          />
        ))}

        {/* Sponsored Challenge */}
        <SponsoredCard
          data={data?.sponsoredChallenge ?? null}
          onClick={() => router.push('/challenges/sponsored')}
        />
      </div>

      <p className="text-center text-white/50 text-sm pt-4">
        Complete challenges to earn XP and unlock rewards
      </p>
    </StadiumPageLayout>
  )
}

interface ChallengeRowData {
  id: string
  title: string
  icon: string
  total: number
  completed: number
}

function ChallengeRow({
  row,
  onClick,
}: {
  row: ChallengeRowData
  onClick: () => void
}): JSX.Element {
  return (
    <div
      onClick={onClick}
      className="bg-[#1e2a4a]/90 backdrop-blur border border-white/10 rounded-xl p-4 cursor-pointer active:scale-[0.98] transition-transform"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{row.icon}</span>
          <span className="font-medium text-white">{row.title}</span>
        </div>
        <span className="text-xl font-bold text-white">
          {row.total}/{row.completed}
        </span>
      </div>
    </div>
  )
}

interface SponsoredData {
  name: string
  sponsor: string
  total: number
  completed: number
}

function SponsoredCard({
  data,
  onClick,
}: {
  data: SponsoredData | null
  onClick: () => void
}): JSX.Element {
  if (data) {
    return (
      <div
        onClick={onClick}
        className="bg-gradient-to-r from-orange-500/20 to-yellow-500/20 backdrop-blur border border-orange-500/40 rounded-xl p-4 cursor-pointer active:scale-[0.98] transition-transform"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏆</span>
            <div>
              <span className="font-medium text-white">{data.name}</span>
              <p className="text-xs text-orange-300">Sponsored by {data.sponsor}</p>
            </div>
          </div>
          <span className="text-xl font-bold text-white">
            {data.total}/{data.completed}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={onClick}
      className="bg-[#1e2a4a]/60 backdrop-blur border border-white/10 rounded-xl p-4 cursor-pointer active:scale-[0.98] transition-transform"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl opacity-50">🏆</span>
          <div>
            <span className="font-medium text-white/60">A1 Super Challenge</span>
            <p className="text-xs text-white/40">Coming Soon</p>
          </div>
        </div>
        <span className="text-xl font-bold text-white/40">—</span>
      </div>
    </div>
  )
}
