'use client'

import { ChallengeTypeList } from '@/components/challenges'
import { useChallengesByType } from '@/lib/hooks/useChallengesByType'

export default function FreeThrowPage(): JSX.Element {
  const { data, isLoading, error } = useChallengesByType('free_throw')

  return (
    <ChallengeTypeList
      title="Free Throw"
      challenges={data?.challenges ?? []}
      total={data?.total ?? 0}
      completed={data?.completed ?? 0}
      isLoading={isLoading}
      error={error}
    />
  )
}
