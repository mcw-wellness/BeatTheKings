'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { VenueItem } from '@/components/map'

interface UseMapCheckInProps {
  latitude: number | null
  longitude: number | null
  venues: VenueItem[]
  isLoading: boolean
  venueIdFromUrl: string | null
  selectedVenueId: string | null
  isSelectedVenueCheckedIn: boolean
}

interface UseMapCheckInReturn {
  checkedInVenueId: string | null
  handleVenueListCheckIn: (venue: VenueItem) => Promise<void>
  autoSelectVenueId: string | null
}

async function performCheckIn(venueId: string, lat: number, lng: number): Promise<boolean> {
  try {
    const statusRes = await fetch(`/api/venues/${venueId}/check-in`)
    if (statusRes.ok) {
      const status = await statusRes.json()
      if (status.isCheckedIn) return true
    }
    const res = await fetch(`/api/venues/${venueId}/check-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude: lat, longitude: lng }),
    })
    return res.ok
  } catch {
    return false
  }
}

export function useMapCheckIn({
  latitude,
  longitude,
  venues,
  isLoading,
  venueIdFromUrl,
  selectedVenueId,
  isSelectedVenueCheckedIn,
}: UseMapCheckInProps): UseMapCheckInReturn {
  const [checkedInVenueId, setCheckedInVenueId] = useState<string | null>(null)
  const [autoSelectVenueId, setAutoSelectVenueId] = useState<string | null>(null)
  const hasAutoSelected = useRef(false)

  // Auto-select and auto check-in to nearest venue within 200m
  useEffect(() => {
    if (hasAutoSelected.current || venueIdFromUrl || isLoading) return
    if (!latitude || !longitude || venues.length === 0) return

    let nearest: VenueItem | null = null
    let nearestDist = Infinity
    for (const v of venues) {
      if (v.distance !== null && v.distance < nearestDist) {
        nearest = v
        nearestDist = v.distance
      }
    }

    if (nearest && nearestDist <= 0.2) {
      hasAutoSelected.current = true
      setAutoSelectVenueId(nearest.id)
      performCheckIn(nearest.id, latitude, longitude).then((ok) => {
        if (ok) setCheckedInVenueId(nearest!.id)
      })
    }
  }, [latitude, longitude, venues, isLoading, venueIdFromUrl])

  // Sync with selected venue panel check-in state
  useEffect(() => {
    if (isSelectedVenueCheckedIn && selectedVenueId) {
      setCheckedInVenueId(selectedVenueId)
    } else if (!isSelectedVenueCheckedIn && selectedVenueId === checkedInVenueId) {
      setCheckedInVenueId(null)
    }
  }, [isSelectedVenueCheckedIn, selectedVenueId, checkedInVenueId])

  const handleVenueListCheckIn = useCallback(async (venue: VenueItem): Promise<void> => {
    if (!latitude || !longitude) return
    const ok = await performCheckIn(venue.id, latitude, longitude)
    if (ok) setCheckedInVenueId(venue.id)
  }, [latitude, longitude])

  return { checkedInVenueId, handleVenueListCheckIn, autoSelectVenueId }
}
