'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useLocation } from '@/context/LocationContext'

interface ActiveVenue {
  id: string
  name: string
  distanceFormatted: string
  activePlayerCount: number
  activePlayers: Array<{
    id: string
    avatarUrl: string
    rank: number
  }>
}

interface ActiveVenuesResponse {
  venues: ActiveVenue[]
  totalActiveVenues: number
}

export function OneVsOneSlot(): JSX.Element {
  const router = useRouter()
  const { latitude, longitude, permission } = useLocation()
  const [data, setData] = useState<ActiveVenuesResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!latitude || !longitude) {
      setIsLoading(false)
      return
    }

    const fetchActiveVenues = async () => {
      try {
        const res = await fetch(
          `/api/challenges/1v1/active-venues?lat=${latitude}&lng=${longitude}&limit=3`
        )
        if (res.ok) {
          setData(await res.json())
        }
      } catch {
        // Silent fail - show empty state
      } finally {
        setIsLoading(false)
      }
    }
    fetchActiveVenues()
  }, [latitude, longitude])

  const handleVenueClick = (venueId: string) => {
    router.push(`/map?venueId=${venueId}`)
  }

  return (
    <div className="bg-[#1e2a4a]/90 backdrop-blur border border-white/10 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚔️</span>
          <span className="font-medium text-white">1v1 Challenge</span>
        </div>
      </div>

      <div className="p-3">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
          </div>
        ) : permission === 'denied' ? (
          <p className="text-white/50 text-sm text-center py-3">
            Enable location to find opponents
          </p>
        ) : !data?.venues.length ? (
          <div className="text-center py-3">
            <p className="text-white/50 text-sm">No active players nearby</p>
            <p className="text-white/40 text-xs mt-1">Check back later!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.venues.map((venue) => (
              <VenueRow key={venue.id} venue={venue} onClick={() => handleVenueClick(venue.id)} />
            ))}
            {data.totalActiveVenues > 3 && (
              <button
                onClick={() => router.push('/challenges/1v1')}
                className="w-full text-center text-orange-400 text-sm py-2 hover:text-orange-300"
              >
                View all {data.totalActiveVenues} venues →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function VenueRow({ venue, onClick }: { venue: ActiveVenue; onClick: () => void }): JSX.Element {
  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between p-2 rounded-lg bg-white/5 cursor-pointer hover:bg-white/10 active:scale-[0.98] transition-all"
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-sm">📍</span>
        <span className="text-sm text-white truncate">{venue.name}</span>
      </div>

      <div className="flex items-center gap-3">
        {/* Player avatars preview */}
        <div className="flex -space-x-2">
          {venue.activePlayers.slice(0, 3).map((player) => (
            <div
              key={player.id}
              className="w-6 h-6 rounded-full border-2 border-[#1e2a4a] overflow-hidden bg-white/10"
            >
              <Image
                src={player.avatarUrl}
                alt=""
                width={24}
                height={24}
                className="w-full h-full object-cover"
                unoptimized
              />
            </div>
          ))}
        </div>

        <div className="flex items-center gap-1 text-white/70">
          <span className="text-xs">👥</span>
          <span className="text-xs font-medium">{venue.activePlayerCount}</span>
        </div>

        <span className="text-xs text-white/50 w-16 text-right">{venue.distanceFormatted}</span>
      </div>
    </div>
  )
}
