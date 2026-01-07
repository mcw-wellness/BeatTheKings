'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import { useLocation } from '@/context/LocationContext'

interface VenueDetail {
  id: string
  name: string
  address: string | null
  district: string | null
  distance: number | null
  distanceFormatted: string | null
  cityName: string | null
  description: string | null
}

interface ActivePlayer {
  id: string
  rank: number
  name: string | null
  avatar: { imageUrl: string }
  distanceFormatted: string | null
}

interface Challenge {
  id: string
  name: string
  description: string
  xpReward: number
  rpReward: number
  difficulty: string
}

interface VenueData {
  venue: VenueDetail
  king: {
    id: string
    name: string | null
    rank: number
    avatar: { imageUrl: string }
  } | null
  activePlayers: ActivePlayer[]
  challenges: Challenge[]
}

export default function VenueDetailPage(): JSX.Element {
  const router = useRouter()
  const params = useParams()
  const venueId = params.id as string
  const { latitude, longitude } = useLocation()

  const [data, setData] = useState<VenueData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCheckingIn, setIsCheckingIn] = useState(false)
  const [checkInMessage, setCheckInMessage] = useState<string | null>(null)

  const fetchVenue = useCallback(async (): Promise<void> => {
    if (!venueId) return

    setIsLoading(true)
    setError(null)

    try {
      let url = `/api/venues/${venueId}`
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
    fetchVenue()
  }, [fetchVenue])

  const handleCheckIn = async (): Promise<void> => {
    if (!latitude || !longitude) {
      setCheckInMessage('Location required to check in')
      return
    }

    setIsCheckingIn(true)
    setCheckInMessage(null)

    try {
      const response = await fetch(`/api/venues/${venueId}/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude, longitude }),
      })

      const result = await response.json()

      if (response.ok) {
        setCheckInMessage(result.message)
        fetchVenue() // Refresh to show updated active players
      } else {
        setCheckInMessage(result.error || 'Failed to check in')
      }
    } catch {
      setCheckInMessage('Failed to check in')
    } finally {
      setIsCheckingIn(false)
    }
  }

  const openPlayerCard = (playerId: string): void => {
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

  const { venue, king, activePlayers, challenges } = data

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-lg mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-600 hover:text-gray-900">
            ← Back
          </button>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex-1">{venue.name}</h1>
        </div>

        {/* Venue Info Card */}
        <div className="bg-white rounded-xl md:rounded-2xl shadow p-4 md:p-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              {venue.district && (
                <p className="text-gray-500 text-sm md:text-base">{venue.district}</p>
              )}
              {venue.cityName && (
                <p className="text-gray-400 text-xs md:text-sm">{venue.cityName}</p>
              )}
            </div>
            {venue.distanceFormatted && (
              <span className="bg-blue-100 text-blue-700 text-sm md:text-base px-3 py-1 rounded-full">
                📍 {venue.distanceFormatted}
              </span>
            )}
          </div>
          {venue.description && (
            <p className="text-gray-600 text-sm md:text-base mt-2">{venue.description}</p>
          )}
        </div>

        {/* King of the Court */}
        {king && (
          <div
            onClick={() => openPlayerCard(king.id)}
            className="bg-gradient-to-r from-yellow-100 to-yellow-50 border border-yellow-300 rounded-xl md:rounded-2xl p-4 md:p-5 cursor-pointer active:scale-[0.98] transition-transform shadow"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl md:text-2xl">👑</span>
              <span className="text-yellow-700 font-bold text-sm md:text-base uppercase tracking-wide">
                King of the Court
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-yellow-200 overflow-hidden border-2 border-yellow-500">
                <Image
                  src={king.avatar.imageUrl}
                  alt="King"
                  width={56}
                  height={56}
                  className="object-cover w-full h-full"
                  unoptimized
                />
              </div>
              <div className="flex-1">
                <p className="text-gray-900 font-semibold md:text-lg">{king.name || 'Player'}</p>
                <p className="text-yellow-600 text-sm md:text-base">Rank #{king.rank}</p>
              </div>
            </div>
          </div>
        )}

        {/* Active Players */}
        <div className="bg-white rounded-xl md:rounded-2xl shadow p-4 md:p-6">
          <h2 className="text-gray-900 font-semibold md:text-lg mb-3 flex items-center gap-2">
            <span>👥</span>
            Active Players ({activePlayers.length})
          </h2>
          {activePlayers.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">
              No active players. Be the first to check in!
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {activePlayers.map((player) => (
                <div
                  key={player.id}
                  onClick={() => openPlayerCard(player.id)}
                  className="flex flex-col items-center p-2 bg-gray-50 rounded-lg cursor-pointer active:scale-95 transition-transform"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                    <Image
                      src={player.avatar.imageUrl}
                      alt="Player"
                      width={40}
                      height={40}
                      className="object-cover w-full h-full"
                      unoptimized
                    />
                  </div>
                  <span className="text-xs text-gray-600 mt-1">#{player.rank}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Challenges */}
        <div className="bg-white rounded-xl md:rounded-2xl shadow p-4 md:p-6">
          <h2 className="text-gray-900 font-semibold md:text-lg mb-3 flex items-center gap-2">
            <span>🏆</span>
            Challenges ({challenges.length})
          </h2>
          {challenges.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">
              No challenges available at this venue yet.
            </p>
          ) : (
            <div className="space-y-2 md:space-y-3">
              {challenges.map((challenge) => (
                <div
                  key={challenge.id}
                  className="flex items-center justify-between p-3 md:p-4 bg-gray-50 rounded-lg md:rounded-xl"
                >
                  <div>
                    <p className="text-gray-900 font-medium md:text-lg">{challenge.name}</p>
                    <p className="text-gray-500 text-xs md:text-sm">
                      {challenge.difficulty} • {challenge.xpReward} XP
                    </p>
                  </div>
                  <button
                    className="bg-[#4361EE] text-white px-4 md:px-5 py-2 md:py-3 rounded-lg text-sm md:text-base font-medium hover:bg-[#3651DE] transition-colors"
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/challenges/${challenge.id}`)
                    }}
                  >
                    Start
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Check-in Button */}
        <div className="space-y-2">
          <button
            onClick={handleCheckIn}
            disabled={isCheckingIn || !latitude}
            className="w-full py-4 md:py-5 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white text-lg font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {isCheckingIn ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
            ) : (
              <>
                <span>📍</span>
                <span>Check In Here</span>
              </>
            )}
          </button>
          {checkInMessage && (
            <p
              className={`text-sm text-center ${
                checkInMessage.includes('Checked in') ? 'text-green-600' : 'text-red-500'
              }`}
            >
              {checkInMessage}
            </p>
          )}
          {!latitude && (
            <p className="text-yellow-600 text-xs text-center">Enable location to check in</p>
          )}
        </div>
      </div>
    </main>
  )
}
