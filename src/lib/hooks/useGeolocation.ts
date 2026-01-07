'use client'

import { useState, useEffect, useCallback } from 'react'

interface GeolocationState {
  latitude: number | null
  longitude: number | null
  error: string | null
  loading: boolean
  permission: 'granted' | 'denied' | 'prompt' | 'unknown'
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean
  timeout?: number
  maximumAge?: number
}

const defaultOptions: UseGeolocationOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 60000, // Cache location for 1 minute
}

export function useGeolocation(options: UseGeolocationOptions = {}): GeolocationState & {
  refresh: () => void
  requestPermission: () => void
} {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    error: null,
    loading: false, // Don't auto-load, wait for user action on mobile
    permission: 'unknown',
  })

  const opts = { ...defaultOptions, ...options }

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: 'Geolocation is not supported by your browser',
        loading: false,
      }))
      return
    }

    setState((prev) => ({ ...prev, loading: true, error: null }))

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          error: null,
          loading: false,
          permission: 'granted',
        })
      },
      (error) => {
        let errorMessage: string
        let permission: 'granted' | 'denied' | 'prompt' | 'unknown' = 'unknown'

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied'
            permission = 'denied'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable'
            break
          case error.TIMEOUT:
            errorMessage = 'Location request timed out'
            break
          default:
            errorMessage = 'An unknown error occurred'
        }

        setState({
          latitude: null,
          longitude: null,
          error: errorMessage,
          loading: false,
          permission,
        })
      },
      {
        enableHighAccuracy: opts.enableHighAccuracy,
        timeout: opts.timeout,
        maximumAge: opts.maximumAge,
      }
    )
  }, [opts.enableHighAccuracy, opts.timeout, opts.maximumAge])

  // Check permission status on mount (without triggering prompt)
  useEffect(() => {
    if (navigator.permissions) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((result) => {
          setState((prev) => ({
            ...prev,
            permission: result.state as 'granted' | 'denied' | 'prompt',
          }))

          // Auto-get location if already granted
          if (result.state === 'granted') {
            getLocation()
          }

          // Listen for permission changes
          result.onchange = () => {
            setState((prev) => ({
              ...prev,
              permission: result.state as 'granted' | 'denied' | 'prompt',
            }))
            if (result.state === 'granted') {
              getLocation()
            }
          }
        })
        .catch(() => {
          // Permissions API not supported (Safari), try getting location directly
          getLocation()
        })
    } else {
      // Permissions API not supported, try getting location directly
      getLocation()
    }
  }, [getLocation])

  // Explicit permission request (for user-triggered actions)
  const requestPermission = useCallback(() => {
    setState((prev) => ({ ...prev, loading: true }))
    getLocation()
  }, [getLocation])

  return {
    ...state,
    refresh: getLocation,
    requestPermission,
  }
}
