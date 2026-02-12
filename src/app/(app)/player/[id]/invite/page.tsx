'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import { Logo } from '@/components/layout/Logo'

interface Venue {
  id: string
  name: string
  district: string | null
}

interface PlayerInfo {
  name: string | null
  avatarUrl: string | null
}

export default function InvitePage(): JSX.Element {
  const router = useRouter()
  const params = useParams()
  const playerId = params.id as string

  const [player, setPlayer] = useState<PlayerInfo | null>(null)
  const [venues, setVenues] = useState<Venue[]>([])
  const [selectedVenueId, setSelectedVenueId] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Get tomorrow's date as minimum
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

  useEffect(() => {
    fetchPlayer()
    fetchVenues()
  }, [playerId])

  const fetchPlayer = async (): Promise<void> => {
    try {
      const res = await fetch(`/api/players/${playerId}/trump-card`)
      if (res.ok) {
        const data = await res.json()
        setPlayer({
          name: data.player.name,
          avatarUrl: data.player.avatar?.imageUrl || null,
        })
      }
    } catch {
      // Silently fail — name will show as "Player"
    }
  }

  const fetchVenues = async (): Promise<void> => {
    try {
      const res = await fetch('/api/venues?limit=50')
      if (res.ok) {
        const data = await res.json()
        setVenues(data.venues || [])
      }
    } catch {
      // Silently fail
    }
  }

  const handleSend = async (): Promise<void> => {
    if (!selectedVenueId || !scheduledDate || !scheduledTime) {
      setError('Please fill in all fields')
      return
    }

    setIsSending(true)
    setError(null)

    try {
      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}:00`)

      // Get default sport (basketball)
      const sportRes = await fetch('/api/sports')
      let sportId = ''
      if (sportRes.ok) {
        const sportData = await sportRes.json()
        sportId = sportData.sports?.[0]?.id || ''
      }

      if (!sportId) {
        setError('Could not determine sport')
        setIsSending(false)
        return
      }

      const res = await fetch('/api/match-invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: playerId,
          venueId: selectedVenueId,
          sportId,
          scheduledAt: scheduledAt.toISOString(),
          message: message || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to send invitation')
        setIsSending(false)
        return
      }

      setSuccess(true)
      setTimeout(() => router.back(), 1500)
    } catch {
      setError('Failed to send invitation')
      setIsSending(false)
    }
  }

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
      <div className="max-w-lg mx-auto p-4 space-y-4 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Logo size="sm" linkToHome className="w-10 h-10" />
          <button onClick={() => router.back()} className="text-white/60 text-sm">
            Cancel
          </button>
        </div>

        {/* Player Info */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-white/10">
            {player?.avatarUrl ? (
              <Image
                src={player.avatarUrl}
                alt={player.name || 'Player'}
                width={80}
                height={80}
                className="w-full h-full object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl">👤</div>
            )}
          </div>
          <p className="text-white font-semibold text-lg">{player?.name || 'Player'}</p>
          <p className="text-white/50 text-sm">Invite to a scheduled match</p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Venue Selector */}
          <div>
            <label className="text-white/70 text-sm mb-1 block">Venue</label>
            <select
              value={selectedVenueId}
              onChange={(e) => setSelectedVenueId(e.target.value)}
              className="w-full bg-[#1e2a4a]/90 backdrop-blur border border-white/20 rounded-xl px-4 py-3 text-white appearance-none"
            >
              <option value="">Select a venue</option>
              {venues.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}{v.district ? ` — ${v.district}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="text-white/70 text-sm mb-1 block">Date</label>
            <input
              type="date"
              value={scheduledDate}
              min={minDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full bg-[#1e2a4a]/90 backdrop-blur border border-white/20 rounded-xl px-4 py-3 text-white"
            />
          </div>

          {/* Time */}
          <div>
            <label className="text-white/70 text-sm mb-1 block">Time</label>
            <input
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full bg-[#1e2a4a]/90 backdrop-blur border border-white/20 rounded-xl px-4 py-3 text-white"
            />
          </div>

          {/* Message */}
          <div>
            <label className="text-white/70 text-sm mb-1 block">Message (optional)</label>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Let's play!"
              maxLength={200}
              className="w-full bg-[#1e2a4a]/90 backdrop-blur border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30"
            />
          </div>

          {/* Error */}
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          {/* Success */}
          {success && (
            <p className="text-green-400 text-sm text-center">Invitation sent!</p>
          )}

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={isSending || success}
            className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 disabled:from-gray-500 disabled:to-gray-600 text-white text-base font-bold rounded-xl transition-all flex items-center justify-center gap-2"
          >
            {isSending ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
            ) : success ? (
              'Sent!'
            ) : (
              'Send Invitation'
            )}
          </button>
        </div>
      </div>
    </main>
  )
}
