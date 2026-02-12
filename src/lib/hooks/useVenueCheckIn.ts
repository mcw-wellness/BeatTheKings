'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useLocation } from '@/context/LocationContext'
import { calculateDistance } from '@/lib/utils/distance'

const AUTO_CHECKIN_RADIUS_KM = 0.2 // 200m
const AUTO_CHECKOUT_RADIUS_KM = 0.3 // 300m
const HEARTBEAT_INTERVAL_MS = 60_000 // 60s

interface UseVenueCheckInProps {
  venueId: string | null
  venueLat: number | null
  venueLng: number | null
}

export interface UseVenueCheckInReturn {
  isCheckedIn: boolean
  isCheckingIn: boolean
  isCheckingOut: boolean
  checkInError: string | null
  distanceToVenue: number | null
  isWithinRange: boolean
  checkIn: () => Promise<void>
  checkOut: () => Promise<void>
}

export function useVenueCheckIn({
  venueId,
  venueLat,
  venueLng,
}: UseVenueCheckInProps): UseVenueCheckInReturn {
  const { latitude, longitude } = useLocation()

  const [isCheckedIn, setIsCheckedIn] = useState(false)
  const [isCheckingIn, setIsCheckingIn] = useState(false)
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [checkInError, setCheckInError] = useState<string | null>(null)

  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const hasAutoCheckedIn = useRef(false)

  // Calculate distance client-side
  const distanceToVenue =
    latitude && longitude && venueLat && venueLng
      ? calculateDistance(latitude, longitude, venueLat, venueLng)
      : null

  const isWithinRange = distanceToVenue !== null && distanceToVenue <= AUTO_CHECKIN_RADIUS_KM

  // Fetch initial check-in status on mount / venue change
  useEffect(() => {
    if (!venueId) return
    hasAutoCheckedIn.current = false

    const fetchStatus = async (): Promise<void> => {
      try {
        const res = await fetch(`/api/venues/${venueId}/check-in`)
        if (res.ok) {
          const data = await res.json()
          setIsCheckedIn(data.isCheckedIn)
        }
      } catch {
        // Silently fail — status will be corrected on next action
      }
    }

    fetchStatus()
  }, [venueId])

  // Check in
  const checkIn = useCallback(async (): Promise<void> => {
    if (!venueId || !latitude || !longitude) return

    setIsCheckingIn(true)
    setCheckInError(null)

    try {
      const res = await fetch(`/api/venues/${venueId}/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude, longitude }),
      })

      if (res.ok) {
        setIsCheckedIn(true)
      } else {
        const data = await res.json()
        setCheckInError(data.error || 'Failed to check in')
      }
    } catch {
      setCheckInError('Failed to check in')
    } finally {
      setIsCheckingIn(false)
    }
  }, [venueId, latitude, longitude])

  // Check out
  const checkOut = useCallback(async (): Promise<void> => {
    if (!venueId) return

    setIsCheckingOut(true)
    setCheckInError(null)

    try {
      const res = await fetch(`/api/venues/${venueId}/check-in`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setIsCheckedIn(false)
      }
    } catch {
      setCheckInError('Failed to check out')
    } finally {
      setIsCheckingOut(false)
    }
  }, [venueId])

  // Auto check-in when within range
  useEffect(() => {
    if (
      !venueId ||
      !latitude ||
      !longitude ||
      isCheckedIn ||
      isCheckingIn ||
      hasAutoCheckedIn.current
    ) {
      return
    }

    if (isWithinRange) {
      hasAutoCheckedIn.current = true
      checkIn()
    }
  }, [venueId, latitude, longitude, isCheckedIn, isCheckingIn, isWithinRange, checkIn])

  // Heartbeat polling while checked in
  useEffect(() => {
    if (!isCheckedIn || !venueId || !latitude || !longitude) {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current)
        heartbeatRef.current = null
      }
      return
    }

    const heartbeat = async (): Promise<void> => {
      if (!latitude || !longitude || !venueLat || !venueLng) return

      const dist = calculateDistance(latitude, longitude, venueLat, venueLng)

      // Auto check-out if moved beyond 300m
      if (dist > AUTO_CHECKOUT_RADIUS_KM) {
        await checkOut()
        return
      }

      // Refresh lastSeenAt
      try {
        await fetch(`/api/venues/${venueId}/check-in`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ latitude, longitude }),
        })
      } catch {
        // Silently fail — stale timeout is the safety net
      }
    }

    heartbeatRef.current = setInterval(heartbeat, HEARTBEAT_INTERVAL_MS)

    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current)
        heartbeatRef.current = null
      }
    }
  }, [isCheckedIn, venueId, latitude, longitude, venueLat, venueLng, checkOut])

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current)
      }
    }
  }, [])

  return {
    isCheckedIn,
    isCheckingIn,
    isCheckingOut,
    checkInError,
    distanceToVenue,
    isWithinRange,
    checkIn,
    checkOut,
  }
}
