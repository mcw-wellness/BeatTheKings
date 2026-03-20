'use client'

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'

interface LocationState {
  latitude: number | null
  longitude: number | null
  error: string | null
  loading: boolean
  permission: 'granted' | 'denied' | 'prompt' | 'unknown'
}

interface LocationContextType extends LocationState {
  requestPermission: () => void
  refresh: () => void
  setMockLocation: (latitude: number, longitude: number) => void
  clearMockLocation: () => void
  isMockLocation: boolean
}

const LocationContext = createContext<LocationContextType | null>(null)

const defaultOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 60000,
}

const MOCK_LOCATION_KEY = 'btk:mock-location'

export function LocationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LocationState>({
    latitude: null,
    longitude: null,
    error: null,
    loading: false,
    permission: 'unknown',
  })

  const [mockLocation, setMockLocationState] = useState<{
    latitude: number
    longitude: number
  } | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const raw = localStorage.getItem(MOCK_LOCATION_KEY)
    if (!raw) return

    try {
      const parsed = JSON.parse(raw) as { latitude?: number; longitude?: number }
      if (typeof parsed.latitude === 'number' && typeof parsed.longitude === 'number') {
        setMockLocationState({ latitude: parsed.latitude, longitude: parsed.longitude })
      }
    } catch {
      localStorage.removeItem(MOCK_LOCATION_KEY)
    }
  }, [])

  const getLocation = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: 'Geolocation is not supported',
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
        let permission: LocationState['permission'] = 'unknown'

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied'
            permission = 'denied'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location unavailable'
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
      defaultOptions
    )
  }, [])

  // Check permission on mount (without triggering prompt)
  useEffect(() => {
    if (typeof window === 'undefined') return

    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((result) => {
          setState((prev) => ({
            ...prev,
            permission: result.state as LocationState['permission'],
          }))

          // Auto-get location if already granted
          if (result.state === 'granted') {
            getLocation()
          }

          // Listen for permission changes
          result.onchange = () => {
            setState((prev) => ({
              ...prev,
              permission: result.state as LocationState['permission'],
            }))
            if (result.state === 'granted') {
              getLocation()
            }
          }
        })
        .catch(() => {
          setState((prev) => ({ ...prev, permission: 'prompt' }))
        })
    } else {
      // Safari/iOS - don't auto-request
      setState((prev) => ({ ...prev, permission: 'prompt' }))
    }
  }, [getLocation])

  const requestPermission = useCallback(() => {
    setState((prev) => ({ ...prev, loading: true }))
    getLocation()
  }, [getLocation])

  const setMockLocation = useCallback((latitude: number, longitude: number) => {
    const next = { latitude, longitude }
    setMockLocationState(next)
    if (typeof window !== 'undefined') {
      localStorage.setItem(MOCK_LOCATION_KEY, JSON.stringify(next))
    }
  }, [])

  const clearMockLocation = useCallback(() => {
    setMockLocationState(null)
    if (typeof window !== 'undefined') {
      localStorage.removeItem(MOCK_LOCATION_KEY)
    }
  }, [])

  const effectiveState = mockLocation
    ? {
        latitude: mockLocation.latitude,
        longitude: mockLocation.longitude,
        error: null,
        loading: false,
        permission: 'granted' as const,
      }
    : state

  return (
    <LocationContext.Provider
      value={{
        ...effectiveState,
        requestPermission,
        refresh: getLocation,
        setMockLocation,
        clearMockLocation,
        isMockLocation: !!mockLocation,
      }}
    >
      {children}
    </LocationContext.Provider>
  )
}

export function useLocation() {
  const context = useContext(LocationContext)
  if (!context) {
    throw new Error('useLocation must be used within LocationProvider')
  }
  return context
}
