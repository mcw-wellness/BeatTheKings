'use client'

import type { VenueItem } from './types'

interface VenueListProps {
  venues: VenueItem[]
  selectedVenueId: string | null
  isLoading: boolean
  onVenueSelect: (venue: VenueItem) => void
}

export function VenueList({
  venues,
  selectedVenueId,
  isLoading,
  onVenueSelect,
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
              onClick={() => onVenueSelect(venue)}
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
  onClick,
}: {
  venue: VenueItem
  isSelected: boolean
  onClick: () => void
}): JSX.Element {
  return (
    <div
      onClick={onClick}
      className={`bg-white/10 backdrop-blur rounded-xl md:rounded-2xl border border-white/20 p-4 md:p-5 cursor-pointer active:scale-[0.98] transition-transform ${
        isSelected ? 'ring-2 ring-white/50' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-white font-semibold">{venue.name}</h4>
            {venue.king && <span className="text-yellow-500">👑</span>}
          </div>
          {venue.district && <p className="text-white/60 text-sm">{venue.district}</p>}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-white/60 text-sm">👥 {venue.activePlayerCount}</span>
          {venue.distanceFormatted && (
            <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full">
              {venue.distanceFormatted}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
