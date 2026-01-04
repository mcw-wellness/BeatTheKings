'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useGeolocation } from '@/lib/hooks/useGeolocation'

interface ChallengeVenue {
  id: string
  name: string
  district: string | null
  distance: number | null
  distanceFormatted: string | null
  challengeCount: number
  activePlayerCount: number
}

export default function ChallengesPage(): JSX.Element {
  const router = useRouter()
  const { latitude, longitude } = useGeolocation()

  const [venues, setVenues] = useState<ChallengeVenue[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchVenues = useCallback(async (): Promise<void> => {
    setIsLoading(true)
    setError(null)

    try {
      let url = '/api/challenges/venues'
      if (latitude && longitude) {
        url += `?lat=${latitude}&lng=${longitude}`
      }

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error('Failed to load venues')
      }

      const json = await response.json()
      setVenues(json.venues)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }, [latitude, longitude])

  useEffect(() => {
    fetchVenues()
  }, [fetchVenues])

  const navigateToVenue = (venueId: string): void => {
    router.push(`/challenges/venue/${venueId}`)
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#4361EE] border-t-transparent" />
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center p-4">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={fetchVenues} className="text-[#4361EE] underline">
          Try Again
        </button>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-600 hover:text-gray-900">
            ← Back
          </button>
          <h1 className="text-xl font-bold text-gray-900 flex-1">Challenges</h1>
        </div>

        {/* Instruction */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-blue-800 text-sm">
            Select a venue to see available challenges. Venues are sorted by distance.
          </p>
        </div>

        {/* Venue List */}
        {venues.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No venues available</p>
          </div>
        ) : (
          <div className="space-y-3">
            {venues.map((venue) => (
              <div
                key={venue.id}
                onClick={() => navigateToVenue(venue.id)}
                className="bg-white rounded-xl shadow p-4 cursor-pointer active:scale-[0.98] transition-transform border border-gray-100"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{venue.name}</h3>
                    {venue.district && <p className="text-gray-500 text-sm">{venue.district}</p>}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-gray-600 flex items-center gap-1">
                        <span>🏆</span>
                        <span>{venue.challengeCount} challenges</span>
                      </span>
                      <span className="text-xs text-gray-600 flex items-center gap-1">
                        <span>👥</span>
                        <span>{venue.activePlayerCount} active</span>
                      </span>
                    </div>
                  </div>
                  {venue.distanceFormatted && (
                    <span className="bg-blue-100 text-blue-700 text-sm px-3 py-1 rounded-full">
                      {venue.distanceFormatted}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Location Hint */}
        {!latitude && (
          <p className="text-center text-yellow-600 text-xs">
            Enable location to sort venues by distance
          </p>
        )}
      </div>
    </main>
  )
}
