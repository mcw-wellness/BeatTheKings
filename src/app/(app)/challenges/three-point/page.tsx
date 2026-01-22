'use client'

import { ChallengeTypeList } from '@/components/challenges'
import { useChallengesByType } from '@/lib/hooks/useChallengesByType'

export default function ThreePointPage(): JSX.Element {
  const { data, isLoading, error } = useChallengesByType('three_point')

  return (
    <ChallengeTypeList
      title="3-Point Shot"
      challenges={data?.challenges ?? []}
      total={data?.total ?? 0}
      completed={data?.completed ?? 0}
      isLoading={isLoading}
      error={error}
    />
  )
}
