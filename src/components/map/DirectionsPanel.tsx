'use client'

import { useState, useEffect, useCallback } from 'react'
import { DirectionsRenderer, DirectionsService } from '@react-google-maps/api'
import type { LatLng } from './types'

interface DirectionsPanelProps {
  origin: LatLng | null
  destination: LatLng | null
  venueName: string
  onClose: () => void
}

interface RouteStep {
  instruction: string
  distance: string
  duration: string
}

export function DirectionsPanel({
  origin,
  destination,
  venueName,
  onClose,
}: DirectionsPanelProps): JSX.Element | null {
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null)
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null)
  const [steps, setSteps] = useState<RouteStep[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [shouldFetch, setShouldFetch] = useState(true)

  const directionsCallback = useCallback(
    (result: google.maps.DirectionsResult | null, status: google.maps.DirectionsStatus): void => {
      setIsLoading(false)
      setShouldFetch(false)

      if (status === 'OK' && result) {
        setDirections(result)
        const route = result.routes[0]
        if (route?.legs[0]) {
          const leg = route.legs[0]
          setRouteInfo({
            distance: leg.distance?.text || '',
            duration: leg.duration?.text || '',
          })
          setSteps(
            leg.steps?.map((step) => ({
              instruction: step.instructions || '',
              distance: step.distance?.text || '',
              duration: step.duration?.text || '',
            })) || []
          )
        }
      } else {
        setError('Could not calculate route')
      }
    },
    []
  )

  useEffect(() => {
    if (origin && destination) {
      setIsLoading(true)
      setShouldFetch(true)
      setError(null)
    }
  }, [origin, destination])

  if (!origin || !destination) return null

  return (
    <>
      {/* Directions Service - only fetch once */}
      {shouldFetch && (
        <DirectionsService
          options={{
            origin,
            destination,
            travelMode: google.maps.TravelMode.WALKING,
          }}
          callback={directionsCallback}
        />
      )}

      {/* Directions Renderer - show route on map */}
      {directions && (
        <DirectionsRenderer
          options={{
            directions,
            suppressMarkers: false,
            polylineOptions: {
              strokeColor: '#F97316',
              strokeWeight: 5,
              strokeOpacity: 0.8,
            },
          }}
        />
      )}

      {/* Directions Panel UI */}
      <div className="bg-[#1e2a4a]/95 backdrop-blur border border-white/10 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold">Directions to {venueName}</h3>
          <button onClick={onClose} className="text-white/60 hover:text-white text-xl">
            ×
          </button>
        </div>

        {isLoading && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent mx-auto" />
            <p className="text-white/60 text-sm mt-2">Calculating route...</p>
          </div>
        )}

        {error && <p className="text-red-400 text-sm text-center py-2">{error}</p>}

        {routeInfo && !isLoading && (
          <>
            <div className="flex items-center gap-4 bg-white/10 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <span>🚶</span>
                <span className="text-white font-medium">{routeInfo.distance}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>⏱️</span>
                <span className="text-white/80">{routeInfo.duration}</span>
              </div>
            </div>

            <div className="max-h-[200px] overflow-y-auto space-y-2">
              {steps.map((step, index) => (
                <div key={index} className="flex gap-3 text-sm">
                  <div className="flex-shrink-0 w-6 h-6 bg-orange-500/20 text-orange-400 rounded-full flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p
                      className="text-white/90"
                      dangerouslySetInnerHTML={{ __html: step.instruction }}
                    />
                    <p className="text-white/50 text-xs mt-1">
                      {step.distance} • {step.duration}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  )
}
