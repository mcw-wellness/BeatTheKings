'use client'

import { calculateDistance } from '@/lib/utils/distance'
import type { VenueItem } from './types'

const CHECKIN_RADIUS_KM = 0.2

type CheckInStatus = 'checked-in' | 'in-range' | 'too-far' | 'no-location'

interface VenueListProps {
  venues: VenueItem[]
  selectedVenueId: string | null
  checkedInVenueId: string | null
  isLoading: boolean
  userLatitude: number | null
  userLongitude: number | null
  onVenueSelect: (venue: VenueItem) => void
  onCheckIn: (venue: VenueItem) => void
}

function getCheckInStatus(
  venue: VenueItem,
  checkedInVenueId: string | null,
  userLat: number | null,
  userLng: number | null,
): CheckInStatus {
  if (checkedInVenueId === venue.id) return 'checked-in'
  if (!userLat || !userLng) return 'no-location'
  if (!venue.latitude || !venue.longitude) return 'no-location'
  const dist = calculateDistance(userLat, userLng, venue.latitude, venue.longitude)
  return dist <= CHECKIN_RADIUS_KM ? 'in-range' : 'too-far'
}

export function VenueList({
  venues,
  selectedVenueId,
  checkedInVenueId,
  isLoading,
  userLatitude,
  userLongitude,
  onVenueSelect,
  onCheckIn,
}: VenueListProps): JSX.Element {
  return (
    <div>
      <h3 className="text-lg md:text-xl font-bold text-white mb-3">
        Nearby Venues ({venues.length})
      </h3>
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent mx-auto" />
        </div>
      ) : venues.length === 0 ? (
        <div className="bg-white/10 backdrop-blur rounded-xl border border-white/20 p-8 text-center">
          <p className="text-white/60">No venues found</p>
        </div>
      ) : (
        <div className="space-y-2 md:space-y-3">
          {venues.map((venue) => (
            <VenueCard
              key={venue.id}
              venue={venue}
              isSelected={selectedVenueId === venue.id}
              checkInStatus={getCheckInStatus(venue, checkedInVenueId, userLatitude, userLongitude)}
              onClick={() => onVenueSelect(venue)}
              onCheckIn={() => onCheckIn(venue)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function VenueCard({
  venue,
  isSelected,
  checkInStatus,
  onClick,
  onCheckIn,
}: {
  venue: VenueItem
  isSelected: boolean
  checkInStatus: CheckInStatus
  onClick: () => void
  onCheckIn: () => void
}): JSX.Element {
  return (
    <div
      onClick={onClick}
      className={`bg-white/10 backdrop-blur rounded-xl md:rounded-2xl border border-white/20 p-4 md:p-5 cursor-pointer active:scale-[0.98] transition-transform ${
        isSelected ? 'ring-2 ring-white/50' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-white font-semibold truncate">{venue.name}</h4>
            {venue.king && <span className="text-yellow-500">👑</span>}
          </div>
          {venue.district && <p className="text-white/60 text-sm">{venue.district}</p>}
        </div>
        <div className="flex items-center gap-2 ml-2 shrink-0">
          <span className="text-white/60 text-sm">👥 {venue.activePlayerCount}</span>
          <CheckInBadge
            status={checkInStatus}
            distance={venue.distanceFormatted}
            onCheckIn={onCheckIn}
          />
        </div>
      </div>
    </div>
  )
}

function CheckInBadge({
  status,
  distance,
  onCheckIn,
}: {
  status: CheckInStatus
  distance: string | null
  onCheckIn: () => void
}): JSX.Element | null {
  if (status === 'checked-in') {
    return (
      <span className="bg-green-500/30 text-green-300 text-xs font-semibold px-2 py-1 rounded-full border border-green-500/40">
        Checked In
      </span>
    )
  }

  if (status === 'in-range') {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation()
          onCheckIn()
        }}
        className="bg-green-500/80 text-white text-xs font-semibold px-3 py-1.5 rounded-lg active:scale-95 transition-transform"
      >
        Check In
      </button>
    )
  }

  if (distance) {
    return (
      <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full">
        {distance}
      </span>
    )
  }

  return null
}
