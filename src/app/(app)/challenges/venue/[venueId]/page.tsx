'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import { useLocation } from '@/context/LocationContext'

interface VenueDetail {
  id: string
  name: string
  district: string | null
  distanceFormatted: string | null
}

interface Challenge {
  id: string
  name: string
  description: string
  challengeType: string
  difficulty: string
  xpReward: number
  rpReward: number
  myAttempts: number
  completed: boolean
}

interface Opponent {
  id: string
  name: string | null
  rank: number
  avatar: { imageUrl: string }
}

interface VenueData {
  venue: VenueDetail
  challenges: Challenge[]
  opponents: Opponent[]
}

export default function VenueChallengesPage(): JSX.Element {
  const router = useRouter()
  const params = useParams()
  const venueId = params.venueId as string
  const { latitude, longitude } = useLocation()

  const [data, setData] = useState<VenueData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async (): Promise<void> => {
    if (!venueId) return

    setIsLoading(true)
    setError(null)

    try {
      let url = `/api/challenges/venues/${venueId}`
      if (latitude && longitude) {
        url += `?lat=${latitude}&lng=${longitude}`
      }

      const response = await fetch(url)

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Venue not found')
        }
        throw new Error('Failed to load venue')
      }

      const json = await response.json()
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }, [venueId, latitude, longitude])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const getDifficultyColor = (difficulty: string): string => {
    if (difficulty === 'easy') return 'bg-green-100 text-green-700'
    if (difficulty === 'medium') return 'bg-yellow-100 text-yellow-700'
    return 'bg-red-100 text-red-700'
  }

  const navigateToChallenge = (challengeId: string): void => {
    router.push(`/challenges/${challengeId}`)
  }

  const navigateToPlayer = (playerId: string): void => {
    router.push(`/player/${playerId}`)
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#4361EE] border-t-transparent" />
      </main>
    )
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center p-4">
        <p className="text-red-500 mb-4">{error || 'Venue not found'}</p>
        <button onClick={() => router.back()} className="text-[#4361EE] underline">
          Go Back
        </button>
      </main>
    )
  }

  const { venue, challenges, opponents } = data

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-600 hover:text-gray-900">
            ← Back
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">{venue.name}</h1>
            <div className="flex items-center gap-2">
              {venue.district && <span className="text-gray-500 text-sm">{venue.district}</span>}
              {venue.distanceFormatted && (
                <span className="text-blue-600 text-sm">{venue.distanceFormatted}</span>
              )}
            </div>
          </div>
        </div>

        {/* 1v1 Challenge Section */}
        {opponents.length > 0 && (
          <div className="bg-gradient-to-r from-purple-100 to-purple-50 border border-purple-200 rounded-xl p-4">
            <h2 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <span>⚔️</span>
              <span>1v1 Challenges</span>
            </h2>
            <p className="text-gray-600 text-sm mb-3">
              {opponents.length} player{opponents.length !== 1 ? 's' : ''} available for 1v1
            </p>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {opponents.map((opponent) => (
                <div
                  key={opponent.id}
                  onClick={() => navigateToPlayer(opponent.id)}
                  className="flex flex-col items-center p-2 bg-white rounded-lg cursor-pointer active:scale-95 transition-transform min-w-[70px]"
                >
                  <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
                    <Image
                      src={opponent.avatar.imageUrl}
                      alt="Player"
                      width={48}
                      height={48}
                      className="object-cover w-full h-full"
                      unoptimized
                    />
                  </div>
                  <span className="text-xs text-gray-600 mt-1">#{opponent.rank}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Solo Challenges */}
        <div className="space-y-3">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <span>🏆</span>
            <span>Solo Challenges ({challenges.length})</span>
          </h2>

          {challenges.length === 0 ? (
            <div className="bg-white rounded-xl shadow p-6 text-center">
              <p className="text-gray-500">No challenges available at this venue yet.</p>
            </div>
          ) : (
            challenges.map((challenge) => (
              <div
                key={challenge.id}
                onClick={() => navigateToChallenge(challenge.id)}
                className="bg-white rounded-xl shadow p-4 cursor-pointer active:scale-[0.98] transition-transform border border-gray-100"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{challenge.name}</h3>
                    <p className="text-gray-500 text-sm">{challenge.description}</p>
                  </div>
                  {challenge.completed && (
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                      ✓ Done
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(challenge.difficulty)}`}
                  >
                    {challenge.difficulty.toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-600">+{challenge.xpReward} XP</span>
                  {challenge.rpReward > 0 && (
                    <span className="text-xs text-purple-600">+{challenge.rpReward} RP</span>
                  )}
                  {challenge.myAttempts > 0 && (
                    <span className="text-xs text-gray-400">{challenge.myAttempts} attempts</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  )
}
