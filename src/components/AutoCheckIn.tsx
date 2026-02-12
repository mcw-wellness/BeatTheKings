'use client'

import { useEffect, useRef } from 'react'
import { useLocation } from '@/context/LocationContext'
import { calculateDistance } from '@/lib/utils/distance'

const AUTO_CHECKIN_RADIUS_KM = 0.2 // 200m

/**
 * Background component that auto checks-in the user
 * to the nearest venue within 200m when the app loads.
 * If location is not enabled, prompts the browser permission dialog.
 * Renders nothing — just runs side effects once.
 */
export function AutoCheckIn(): null {
  const { latitude, longitude, permission, requestPermission } = useLocation()
  const hasRequestedPermission = useRef(false)
  const hasRun = useRef(false)

  // Prompt for location if not yet granted
  useEffect(() => {
    if (hasRequestedPermission.current) return
    if (permission === 'granted') return // Already have it
    if (permission === 'denied') return // User said no, don't nag

    // permission is 'prompt' or 'unknown' — ask the user
    hasRequestedPermission.current = true
    requestPermission()
  }, [permission, requestPermission])

  // Auto check-in once location is available
  useEffect(() => {
    if (hasRun.current || !latitude || !longitude) return

    hasRun.current = true

    const run = async (): Promise<void> => {
      try {
        const res = await fetch(
          `/api/venues?limit=50&lat=${latitude}&lng=${longitude}`
        )
        if (!res.ok) return

        const { venues } = await res.json()
        if (!venues || venues.length === 0) return

        // Find nearest venue within 200m
        let nearest: { id: string; distance: number } | null = null
        for (const v of venues) {
          if (v.latitude != null && v.longitude != null) {
            const dist = calculateDistance(
              latitude, longitude,
              v.latitude, v.longitude
            )
            if (dist <= AUTO_CHECKIN_RADIUS_KM) {
              if (!nearest || dist < nearest.distance) {
                nearest = { id: v.id, distance: dist }
              }
            }
          }
        }

        if (!nearest) return

        // Check if already checked in
        const statusRes = await fetch(
          `/api/venues/${nearest.id}/check-in`
        )
        if (statusRes.ok) {
          const status = await statusRes.json()
          if (status.isCheckedIn) return
        }

        // Auto check-in
        await fetch(`/api/venues/${nearest.id}/check-in`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ latitude, longitude }),
        })
      } catch {
        // Silently fail — not critical
      }
    }

    run()
  }, [latitude, longitude])

  return null
}
