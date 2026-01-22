'use client'

import Image from 'next/image'
import type { VenueItem, ActivePlayer } from './types'

interface VenuePanelProps {
  venue: VenueItem
  activePlayers: ActivePlayer[]
  isLoading: boolean
  onClose: () => void
  onPlayerClick: (playerId: string) => void
  onDirections: () => void
  onChallenges: () => void
}

export function VenuePanel({
  venue,
  activePlayers,
  isLoading,
  onClose,
  onPlayerClick,
  onDirections,
  onChallenges,
}: VenuePanelProps): JSX.Element {
  return (
    <div className="bg-white/10 backdrop-blur rounded-xl md:rounded-2xl border border-white/20 p-4 md:p-6 space-y-4">
      <VenueHeader venue={venue} onClose={onClose} />
      {venue.king && <KingCard king={venue.king} onClick={() => onPlayerClick(venue.king!.id)} />}
      <ActivePlayersSection
        players={activePlayers}
        isLoading={isLoading}
        onPlayerClick={onPlayerClick}
      />
      <ActionButtons
        hasLocation={!!(venue.latitude && venue.longitude)}
        challengeCount={venue.challengeCount}
        onDirections={onDirections}
        onChallenges={onChallenges}
      />
    </div>
  )
}

function VenueHeader({ venue, onClose }: { venue: VenueItem; onClose: () => void }): JSX.Element {
  return (
    <div className="flex items-start justify-between">
      <div>
        <h2 className="text-lg md:text-xl font-bold text-white">{venue.name}</h2>
        {venue.district && <p className="text-sm text-white/60">{venue.district}</p>}
        {venue.distanceFormatted && (
          <p className="text-sm text-white/80">📍 {venue.distanceFormatted}</p>
        )}
      </div>
      <button onClick={onClose} className="text-white/60 hover:text-white text-xl">
        ×
      </button>
    </div>
  )
}

function KingCard({
  king,
  onClick,
}: {
  king: { id: string; name: string | null; xp: number; avatar: { imageUrl: string } }
  onClick: () => void
}): JSX.Element {
  return (
    <div
      onClick={onClick}
      className="bg-yellow-500/20 border border-yellow-500/40 rounded-lg p-3 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform"
    >
      <span className="text-xl">👑</span>
      <div className="w-10 h-10 rounded-full bg-yellow-500/30 overflow-hidden border-2 border-yellow-500/60">
        <Image
          src={king.avatar.imageUrl}
          alt="King"
          width={40}
          height={40}
          className="object-cover w-full h-full"
          unoptimized
        />
      </div>
      <span className="text-yellow-300 font-semibold text-sm">King of the Court</span>
      <span className="text-yellow-300/80 text-xs ml-auto">{king.xp.toLocaleString()} XP</span>
    </div>
  )
}

function ActivePlayersSection({
  players,
  isLoading,
  onPlayerClick,
}: {
  players: ActivePlayer[]
  isLoading: boolean
  onPlayerClick: (id: string) => void
}): JSX.Element {
  return (
    <div>
      <h3 className="text-sm font-semibold text-white/80 mb-2">
        Active Players ({players.length})
      </h3>
      {isLoading ? (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent mx-auto" />
        </div>
      ) : players.length === 0 ? (
        <p className="text-white/50 text-sm text-center py-4">No active players at this venue</p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {players.map((player) => (
            <PlayerAvatar
              key={player.id}
              player={player}
              onClick={() => onPlayerClick(player.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function PlayerAvatar({
  player,
  onClick,
}: {
  player: ActivePlayer
  onClick: () => void
}): JSX.Element {
  return (
    <div
      onClick={onClick}
      className="flex flex-col items-center p-2 bg-white/10 rounded-lg cursor-pointer active:scale-95 transition-transform"
    >
      <div className="w-12 h-12 rounded-full bg-white/20 overflow-hidden border-2 border-white/30">
        <Image
          src={player.avatar.imageUrl}
          alt="Player"
          width={48}
          height={48}
          className="object-cover w-full h-full"
          unoptimized
        />
      </div>
      <span className="text-xs font-semibold text-white/80 mt-1">#{player.rank}</span>
    </div>
  )
}

function ActionButtons({
  hasLocation,
  challengeCount,
  onDirections,
  onChallenges,
}: {
  hasLocation: boolean
  challengeCount: number
  onDirections: () => void
  onChallenges: () => void
}): JSX.Element {
  return (
    <div className="flex gap-2">
      {hasLocation && (
        <button
          onClick={onDirections}
          className="flex-1 py-3 md:py-4 bg-gradient-to-r from-orange-500 to-yellow-400 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-yellow-500 transition-colors flex items-center justify-center gap-2"
        >
          <span>🗺️</span> Get Directions
        </button>
      )}
      <button
        onClick={onChallenges}
        className="flex-1 py-3 md:py-4 bg-white/20 text-white font-semibold rounded-xl hover:bg-white/30 transition-colors border border-white/30"
      >
        🏀 Challenges ({challengeCount})
      </button>
    </div>
  )
}
