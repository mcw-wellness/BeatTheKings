'use client'

import { useEffect, useRef } from 'react'
import { useLocation } from '@/context/LocationContext'
import { calculateDistance } from '@/lib/utils/distance'

const AUTO_CHECKIN_RADIUS_KM = 0.2

/**
 * Background component that requests location permission on app load,
 * then auto checks-in the user to the nearest venue within 200m.
 * Renders nothing — just runs side effects once.
 */
export function AutoCheckIn(): null {
  const { latitude, longitude, permission, requestPermission } = useLocation()
  const hasRequestedPermission = useRef(false)
  const hasRun = useRef(false)

  // Request location permission if not yet granted
  useEffect(() => {
    if (hasRequestedPermission.current) return
    if (permission === 'granted' || permission === 'denied') return
    hasRequestedPermission.current = true
    requestPermission()
  }, [permission, requestPermission])

  // Auto check-in once location is available
  useEffect(() => {
    if (hasRun.current || !latitude || !longitude) return
    hasRun.current = true
    silentCheckIn(latitude, longitude)
  }, [latitude, longitude])

  return null
}

async function silentCheckIn(lat: number, lng: number): Promise<void> {
  try {
    const res = await fetch(`/api/venues?limit=50&lat=${lat}&lng=${lng}`)
    if (!res.ok) return

    const { venues } = await res.json()
    if (!venues?.length) return

    let nearest: { id: string; distance: number } | null = null
    for (const v of venues) {
      if (v.latitude == null || v.longitude == null) continue
      const dist = calculateDistance(lat, lng, v.latitude, v.longitude)
      if (dist <= AUTO_CHECKIN_RADIUS_KM && (!nearest || dist < nearest.distance)) {
        nearest = { id: v.id, distance: dist }
      }
    }
    if (!nearest) return

    const statusRes = await fetch(`/api/venues/${nearest.id}/check-in`)
    if (statusRes.ok) {
      const status = await statusRes.json()
      if (status.isCheckedIn) return
    }

    await fetch(`/api/venues/${nearest.id}/check-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude: lat, longitude: lng }),
    })
  } catch {
    // Silently fail
  }
}
