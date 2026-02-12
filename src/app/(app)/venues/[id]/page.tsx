'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import { useLocation } from '@/context/LocationContext'
import { useVenueCheckIn } from '@/lib/hooks/useVenueCheckIn'
import { formatDistance } from '@/lib/utils/distance'
import { Logo } from '@/components/layout/Logo'

interface VenueDetail {
  id: string
  name: string
  address: string | null
  district: string | null
  latitude: number | null
  longitude: number | null
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

  const checkIn = useVenueCheckIn({
    venueId: data?.venue.id ?? null,
    venueLat: data?.venue.latitude ?? null,
    venueLng: data?.venue.longitude ?? null,
  })

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

  const openPlayerCard = (playerId: string): void => {
    router.push(`/player/${playerId}`)
  }

  if (isLoading) {
    return (
      <main
        className="min-h-screen flex items-center justify-center relative"
        style={{
          backgroundImage: 'url(/backgrounds/stadium.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none" />
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent relative z-10" />
      </main>
    )
  }

  if (error || !data) {
    return (
      <main
        className="min-h-screen flex flex-col items-center justify-center p-4 relative"
        style={{
          backgroundImage: 'url(/backgrounds/stadium.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none" />
        <p className="text-red-300 mb-4 relative z-10">{error || 'Venue not found'}</p>
        <button
          onClick={() => router.back()}
          className="text-white/80 hover:text-white underline relative z-10"
        >
          Go Back
        </button>
      </main>
    )
  }

  const { venue, king, activePlayers, challenges } = data

  return (
    <main
      className="min-h-screen relative"
      style={{
        backgroundImage: 'url(/backgrounds/stadium.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none" />

      <div className="max-w-lg mx-auto p-4 md:p-6 space-y-4 md:space-y-6 relative z-10">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Logo size="sm" linkToHome className="w-10 h-10" />
          <h1 className="text-xl md:text-2xl font-bold text-white flex-1">{venue.name}</h1>
        </div>

        {/* Venue Info Card */}
        <div className="bg-white/10 backdrop-blur rounded-xl md:rounded-2xl border border-white/20 p-4 md:p-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              {venue.district && (
                <p className="text-white/70 text-sm md:text-base">{venue.district}</p>
              )}
              {venue.cityName && (
                <p className="text-white/50 text-xs md:text-sm">{venue.cityName}</p>
              )}
            </div>
            {venue.distanceFormatted && (
              <span className="bg-white/20 text-white text-sm md:text-base px-3 py-1 rounded-full">
                {venue.distanceFormatted}
              </span>
            )}
          </div>
          {venue.description && (
            <p className="text-white/70 text-sm md:text-base mt-2">{venue.description}</p>
          )}
        </div>

        {/* Check-in Section */}
        <VenueCheckInSection checkIn={checkIn} />

        {/* King of the Court */}
        {king && (
          <div
            onClick={() => openPlayerCard(king.id)}
            className="bg-yellow-500/20 backdrop-blur border border-yellow-500/40 rounded-xl md:rounded-2xl p-4 md:p-5 cursor-pointer active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl md:text-2xl">👑</span>
              <span className="text-yellow-300 font-bold text-sm md:text-base uppercase tracking-wide">
                King of the Court
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-yellow-500/30 overflow-hidden border-2 border-yellow-500/60">
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
                <p className="text-white font-semibold md:text-lg">{king.name || 'Player'}</p>
                <p className="text-yellow-300 text-sm md:text-base">Rank #{king.rank}</p>
              </div>
            </div>
          </div>
        )}

        {/* Active Players */}
        <div className="bg-white/10 backdrop-blur rounded-xl md:rounded-2xl border border-white/20 p-4 md:p-6">
          <h2 className="text-white font-semibold md:text-lg mb-3 flex items-center gap-2">
            Active Players ({activePlayers.length})
          </h2>
          {activePlayers.length === 0 ? (
            <p className="text-white/50 text-sm text-center py-4">
              No active players. Be the first to check in!
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {activePlayers.map((player) => (
                <div
                  key={player.id}
                  onClick={() => openPlayerCard(player.id)}
                  className="flex flex-col items-center p-2 bg-white/10 rounded-lg cursor-pointer active:scale-95 transition-transform"
                >
                  <div className="w-10 h-10 rounded-full bg-white/20 overflow-hidden">
                    <Image
                      src={player.avatar.imageUrl}
                      alt="Player"
                      width={40}
                      height={40}
                      className="object-cover w-full h-full"
                      unoptimized
                    />
                  </div>
                  <span className="text-xs text-white/70 mt-1">#{player.rank}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Challenges */}
        <div className="bg-white/10 backdrop-blur rounded-xl md:rounded-2xl border border-white/20 p-4 md:p-6">
          <h2 className="text-white font-semibold md:text-lg mb-3 flex items-center gap-2">
            Challenges ({challenges.length})
          </h2>
          {challenges.length === 0 ? (
            <p className="text-white/50 text-sm text-center py-4">
              No challenges available at this venue yet.
            </p>
          ) : (
            <div className="space-y-2 md:space-y-3">
              {challenges.map((challenge) => (
                <div
                  key={challenge.id}
                  className="flex items-center justify-between p-3 md:p-4 bg-white/10 rounded-lg md:rounded-xl"
                >
                  <div>
                    <p className="text-white font-medium md:text-lg">{challenge.name}</p>
                    <p className="text-white/50 text-xs md:text-sm">
                      {challenge.difficulty} • {challenge.xpReward} XP
                    </p>
                  </div>
                  <button
                    className="bg-white/20 hover:bg-white/30 text-white px-4 md:px-5 py-2 md:py-3 rounded-lg text-sm md:text-base font-medium transition-colors border border-white/30"
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
      </div>
    </main>
  )
}

function VenueCheckInSection({
  checkIn: ci,
}: {
  checkIn: ReturnType<typeof useVenueCheckIn>
}): JSX.Element {
  // Checking in
  if (ci.isCheckingIn) {
    return (
      <div className="flex items-center gap-2 bg-white/10 backdrop-blur rounded-xl border border-white/20 p-4">
        <div className="animate-spin rounded-full h-5 w-5 border-2 border-green-400 border-t-transparent" />
        <span className="text-white/80 text-sm">Checking in...</span>
      </div>
    )
  }

  // Checked in
  if (ci.isCheckedIn) {
    return (
      <div className="flex items-center justify-between bg-green-500/20 backdrop-blur border border-green-500/40 rounded-xl p-4">
        <span className="text-green-300 font-semibold">Checked In</span>
        <button
          onClick={ci.checkOut}
          disabled={ci.isCheckingOut}
          className="bg-white/20 text-white text-sm px-4 py-2 rounded-lg active:scale-95 transition-transform disabled:opacity-50"
        >
          {ci.isCheckingOut ? 'Checking out...' : 'Check Out'}
        </button>
      </div>
    )
  }

  // No location
  if (ci.distanceToVenue === null) {
    return (
      <div className="bg-white/10 backdrop-blur rounded-xl border border-white/20 p-4">
        <p className="text-yellow-300 text-sm text-center">
          Enable location to check in
        </p>
      </div>
    )
  }

  // Within range
  if (ci.isWithinRange) {
    return (
      <div className="space-y-2">
        <button
          onClick={ci.checkIn}
          className="w-full py-4 md:py-5 bg-green-500/80 text-white text-lg font-semibold rounded-xl active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
        >
          Check In Here
        </button>
        {ci.checkInError && (
          <p className="text-red-300 text-sm text-center">{ci.checkInError}</p>
        )}
      </div>
    )
  }

  // Too far
  const distText = formatDistance(ci.distanceToVenue)

  return (
    <div className="space-y-2">
      <button
        disabled
        className="w-full py-4 md:py-5 bg-white/20 text-white/50 text-lg font-semibold rounded-xl cursor-not-allowed"
      >
        Get closer to check in ({distText} away)
      </button>
      {ci.checkInError && (
        <p className="text-red-300 text-sm text-center">{ci.checkInError}</p>
      )}
    </div>
  )
}
