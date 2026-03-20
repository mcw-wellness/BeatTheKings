'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useNotifications } from '@/lib/hooks/useNotifications'

type ChallengeReceivedPayload = {
  matchId: string
  challengerName: string
  venueName: string
}

export function ChallengeNotificationPopup(): JSX.Element {
  const router = useRouter()
  const [pending, setPending] = useState<ChallengeReceivedPayload | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useNotifications({
    onEvent: (event) => {
      if (event.type !== 'challenge-received') return
      const data = event.data as ChallengeReceivedPayload
      setPending((prev) => (prev?.matchId === data.matchId ? prev : data))
    },
  })

  const handleRespond = async (accept: boolean): Promise<void> => {
    if (!pending) return

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/challenges/1v1/${pending.matchId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accept }),
      })

      if (!res.ok) return

      const matchId = pending.matchId
      setPending(null)
      if (accept) {
        router.push(`/challenges/1v1/${matchId}/ready`)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!pending) return <></>

  return (
    <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md bg-[#1e2a4a] border border-white/20 rounded-2xl p-5 shadow-2xl">
        <p className="text-xs text-orange-300 font-semibold mb-2">NEW CHALLENGE</p>
        <h3 className="text-white text-lg font-bold mb-1">
          {pending.challengerName} challenged you
        </h3>
        <p className="text-white/70 text-sm mb-5">Venue: {pending.venueName}</p>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleRespond(false)}
            disabled={isSubmitting}
            className="py-3 rounded-xl bg-white/10 text-white border border-white/20 disabled:opacity-50"
          >
            Decline
          </button>
          <button
            onClick={() => handleRespond(true)}
            disabled={isSubmitting}
            className="py-3 rounded-xl bg-gradient-to-r from-orange-500 to-yellow-400 text-white font-semibold disabled:opacity-50"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}
