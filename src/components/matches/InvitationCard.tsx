'use client'

import Image from 'next/image'

export interface Invitation {
  id: string
  sender: { id: string; name: string | null; avatar: string }
  receiver: { id: string; name: string | null; avatar: string }
  venue: { id: string; name: string; district: string | null }
  scheduledAt: string
  status: string
  message: string | null
  createdAt: string
}

interface InvitationCardProps {
  invitation: Invitation
  type: 'received' | 'sent'
  isResponding: boolean
  onAccept: () => void
  onDecline: () => void
  onCancel: () => void
}

export function InvitationCard({
  invitation,
  type,
  isResponding,
  onAccept,
  onDecline,
  onCancel,
}: InvitationCardProps): JSX.Element {
  const opponent = type === 'received' ? invitation.sender : invitation.receiver
  const scheduledDate = new Date(invitation.scheduledAt)

  const dateStr = scheduledDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
  const timeStr = scheduledDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="bg-[#1e2a4a]/90 backdrop-blur rounded-xl border border-blue-400/30 p-4">
      {/* Badge */}
      <div className="flex items-center justify-between mb-3">
        <span className="bg-blue-500/20 text-blue-400 text-xs font-medium px-2 py-0.5 rounded-full">
          {type === 'received' ? 'Invitation' : 'Sent'}
        </span>
        <span className="text-white/40 text-xs">{dateStr} at {timeStr}</span>
      </div>

      {/* Player + Venue */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-white/10 shrink-0">
          {opponent.avatar ? (
            <Image
              src={opponent.avatar}
              alt={opponent.name || 'Player'}
              width={48}
              height={48}
              className="w-full h-full object-cover object-top"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xl">👤</div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold truncate">{opponent.name || 'Player'}</p>
          <p className="text-white/50 text-sm truncate">
            📍 {invitation.venue.name}
          </p>
        </div>
      </div>

      {/* Message */}
      {invitation.message && (
        <p className="text-white/60 text-sm italic mb-3">"{invitation.message}"</p>
      )}

      {/* Actions */}
      {type === 'received' && invitation.status === 'pending' && (
        <div className="flex gap-2">
          <button
            onClick={onAccept}
            disabled={isResponding}
            className="flex-1 py-2 bg-green-500 hover:bg-green-400 disabled:bg-gray-500 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {isResponding ? '...' : 'Accept'}
          </button>
          <button
            onClick={onDecline}
            disabled={isResponding}
            className="flex-1 py-2 bg-white/10 hover:bg-white/20 disabled:bg-gray-500 text-white/80 text-sm font-semibold rounded-lg transition-colors"
          >
            Decline
          </button>
        </div>
      )}

      {type === 'sent' && invitation.status === 'pending' && (
        <button
          onClick={onCancel}
          disabled={isResponding}
          className="w-full py-2 bg-white/10 hover:bg-white/20 disabled:bg-gray-500 text-white/60 text-sm font-medium rounded-lg transition-colors"
        >
          Cancel Invitation
        </button>
      )}
    </div>
  )
}
