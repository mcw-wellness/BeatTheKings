'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useJsApiLoader } from '@react-google-maps/api'
import { useLocation } from '@/context/LocationContext'
import {
  DirectionsPanel,
  VenuePanel,
  VenueList,
  MapHeader,
  MapError,
  LocationStatus,
  MapLoadingFallback,
  MapView,
  LocationTestControls,
  type VenueItem,
  type ActivePlayer,
} from '@/components/map'
import { useVenueCheckIn } from '@/lib/hooks/useVenueCheckIn'
import { useMapCheckIn } from '@/lib/hooks/useMapCheckIn'

const defaultCenter = { lat: 48.2082, lng: 16.3738 }
const ONBOARDING_KEY = 'hasCompletedOnboarding'

function isSameActivePlayers(prev: ActivePlayer[], next: ActivePlayer[]): boolean {
  if (prev.length !== next.length) return false

  for (let i = 0; i < prev.length; i++) {
    if (prev[i].id !== next[i].id) return false
    if (prev[i].rank !== next[i].rank) return false
    if (prev[i].avatar?.imageUrl !== next[i].avatar?.imageUrl) return false
  }

  return true
}

export default function MapPage(): JSX.Element {
  return (
    <Suspense fallback={<MapLoadingFallback />}>
      <MapPageContent />
    </Suspense>
  )
}

function MapPageContent(): JSX.Element {
  const router = useRouter()
  const searchParams = useSearchParams()
  const venueIdFromUrl = searchParams.get('venueId')
  const {
    latitude,
    longitude,
    loading: geoLoading,
    error: geoError,
    permission,
    requestPermission,
  } = useLocation()

  // Onboarding highlight: only show if permission not yet resolved
  const [showLocationHighlight, setShowLocationHighlight] = useState(false)
  useEffect(() => {
    if (permission === 'granted' || permission === 'denied') {
      setShowLocationHighlight(false)
      if (permission === 'granted') localStorage.setItem(ONBOARDING_KEY, 'true')
      return
    }
    if (localStorage.getItem(ONBOARDING_KEY) !== 'true') setShowLocationHighlight(true)
  }, [permission])

  const [venues, setVenues] = useState<VenueItem[]>([])
  const [selectedVenue, setSelectedVenue] = useState<VenueItem | null>(null)
  const [activePlayers, setActivePlayers] = useState<ActivePlayer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [infoWindowVenue, setInfoWindowVenue] = useState<VenueItem | null>(null)
  const [showDirections, setShowDirections] = useState(false)

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  })

  const userCenter = latitude && longitude ? { lat: latitude, lng: longitude } : defaultCenter

  const fetchVenues = useCallback(
    async (showLoading = true): Promise<void> => {
      if (showLoading) setIsLoading(true)
      try {
        let url = '/api/venues?limit=50'
        if (latitude && longitude) url += `&lat=${latitude}&lng=${longitude}`
        const response = await fetch(url)
        if (response.ok) setVenues((await response.json()).venues || [])
      } catch (err) {
        void err
      } finally {
        if (showLoading) setIsLoading(false)
      }
    },
    [latitude, longitude]
  )

  const fetchVenueDetails = useCallback(
    async (venueId: string): Promise<void> => {
      setIsLoadingDetails(true)
      try {
        let url = `/api/venues/${venueId}`
        if (latitude && longitude) url += `?lat=${latitude}&lng=${longitude}`
        const response = await fetch(url)
        if (response.ok) {
          const data = await response.json()
          setSelectedVenue(data.venue)
          setActivePlayers((prev) => {
            const next = data.activePlayers || []
            return isSameActivePlayers(prev, next) ? prev : next
          })
        }
      } catch (err) {
        void err
      } finally {
        setIsLoadingDetails(false)
      }
    },
    [latitude, longitude]
  )

  useEffect(() => {
    if (!geoLoading) fetchVenues()
  }, [geoLoading, fetchVenues])

  // Poll venues + selected venue details for near real-time active player updates
  useEffect(() => {
    if (geoLoading) return

    const interval = setInterval(() => {
      fetchVenues(false)
      if (selectedVenue?.id) {
        fetchVenueDetails(selectedVenue.id)
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [geoLoading, fetchVenues, fetchVenueDetails, selectedVenue?.id])

  useEffect(() => {
    if (venueIdFromUrl && !isLoading) fetchVenueDetails(venueIdFromUrl)
  }, [venueIdFromUrl, isLoading, fetchVenueDetails])

  const checkInState = useVenueCheckIn({
    venueId: selectedVenue?.id ?? null,
    venueLat: selectedVenue?.latitude ?? null,
    venueLng: selectedVenue?.longitude ?? null,
  })

  const { checkedInVenueId, handleVenueListCheckIn, autoSelectVenueId } = useMapCheckIn({
    latitude,
    longitude,
    venues,
    isLoading,
    venueIdFromUrl,
    selectedVenueId: selectedVenue?.id ?? null,
    isSelectedVenueCheckedIn: checkInState.isCheckedIn,
  })

  // Auto-select nearest venue panel when hook detects one in range
  useEffect(() => {
    if (autoSelectVenueId) fetchVenueDetails(autoSelectVenueId)
  }, [autoSelectVenueId, fetchVenueDetails])

  const handleVenueSelect = (venue: VenueItem): void => {
    setInfoWindowVenue(null)
    setShowDirections(false)
    fetchVenueDetails(venue.id)
  }

  const closePanel = (): void => {
    setSelectedVenue(null)
    setActivePlayers([])
    setShowDirections(false)
  }

  if (loadError) return <MapError />

  const origin = latitude && longitude ? { lat: latitude, lng: longitude } : null
  const destination =
    selectedVenue?.latitude && selectedVenue?.longitude
      ? { lat: selectedVenue.latitude, lng: selectedVenue.longitude }
      : null

  const testVenue = selectedVenue ?? venues[0] ?? null

  return (
    <main
      className="h-dvh flex flex-col overflow-hidden relative"
      style={{
        backgroundImage: 'url(/backgrounds/stadium.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none" />
      <div className="relative z-10 flex flex-col h-full">
        <div className="px-3 pt-2 shrink-0">
          <MapHeader />
        </div>
        <div className="px-3 py-1 shrink-0 space-y-2">
          <LocationStatus
            geoLoading={geoLoading}
            latitude={latitude}
            permission={permission}
            geoError={geoError}
            requestPermission={requestPermission}
            highlight={showLocationHighlight}
          />
          <LocationTestControls
            venueName={testVenue?.name ?? null}
            venueLatitude={testVenue?.latitude ?? null}
            venueLongitude={testVenue?.longitude ?? null}
          />
        </div>

        <div className="flex-1 min-h-0 px-3 py-1">
          <MapView
            isLoaded={isLoaded}
            isLoading={isLoading}
            userCenter={userCenter}
            latitude={latitude}
            longitude={longitude}
            venues={venues}
            infoWindowVenue={infoWindowVenue}
            showDirections={showDirections}
            origin={origin}
            destination={destination}
            selectedVenueName={selectedVenue?.name || ''}
            onMarkerClick={setInfoWindowVenue}
            onInfoWindowClose={() => setInfoWindowVenue(null)}
            onVenueSelect={handleVenueSelect}
            onCloseDirections={() => setShowDirections(false)}
          />
        </div>

        <div className="shrink-0 max-h-[40%] overflow-y-auto px-3 pb-2 space-y-2">
          {showDirections && selectedVenue && (
            <DirectionsPanel
              origin={origin}
              destination={destination}
              venueName={selectedVenue.name}
              onClose={() => setShowDirections(false)}
            />
          )}

          {selectedVenue && !showDirections && (
            <VenuePanel
              venue={selectedVenue}
              activePlayers={activePlayers}
              isLoading={isLoadingDetails}
              checkInState={checkInState}
              onClose={closePanel}
              onPlayerClick={(id) => router.push(`/player/${id}`)}
              onDirections={() => setShowDirections(true)}
              onChallenges={() => router.push(`/venues/${selectedVenue.id}`)}
            />
          )}

          <VenueList
            venues={venues}
            selectedVenueId={selectedVenue?.id || null}
            checkedInVenueId={checkedInVenueId}
            isLoading={isLoading}
            userLatitude={latitude}
            userLongitude={longitude}
            onVenueSelect={handleVenueSelect}
            onCheckIn={handleVenueListCheckIn}
          />
        </div>
      </div>
    </main>
  )
}
