'use client'

import { ChallengeTypeList } from '@/components/challenges'
import { useChallengesByType } from '@/lib/hooks/useChallengesByType'

export default function AroundTheWorldPage(): JSX.Element {
  const { data, isLoading, error } = useChallengesByType('around_the_world')

  return (
    <ChallengeTypeList
      title="Around the World"
      challenges={data?.challenges ?? []}
      total={data?.total ?? 0}
      completed={data?.completed ?? 0}
      isLoading={isLoading}
      error={error}
    />
  )
}
