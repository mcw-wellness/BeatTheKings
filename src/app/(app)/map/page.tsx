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
  type VenueItem,
  type ActivePlayer,
} from '@/components/map'

const defaultCenter = { lat: 48.2082, lng: 16.3738 }

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

  const fetchVenues = useCallback(async (): Promise<void> => {
    setIsLoading(true)
    try {
      let url = '/api/venues?limit=50'
      if (latitude && longitude) url += `&lat=${latitude}&lng=${longitude}`
      const response = await fetch(url)
      if (response.ok) setVenues((await response.json()).venues || [])
    } catch (err) {
      console.error('Failed to fetch venues:', err)
    } finally {
      setIsLoading(false)
    }
  }, [latitude, longitude])

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
          setActivePlayers(data.activePlayers || [])
        }
      } catch (err) {
        console.error('Failed to fetch venue details:', err)
      } finally {
        setIsLoadingDetails(false)
      }
    },
    [latitude, longitude]
  )

  useEffect(() => {
    if (!geoLoading) fetchVenues()
  }, [geoLoading, fetchVenues])

  useEffect(() => {
    if (venueIdFromUrl && !isLoading) fetchVenueDetails(venueIdFromUrl)
  }, [venueIdFromUrl, isLoading, fetchVenueDetails])

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
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-4 md:space-y-6 relative z-10">
        <MapHeader />
        <LocationStatus
          geoLoading={geoLoading}
          latitude={latitude}
          permission={permission}
          geoError={geoError}
          requestPermission={requestPermission}
        />

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
            onClose={closePanel}
            onPlayerClick={(id) => router.push(`/player/${id}`)}
            onDirections={() => setShowDirections(true)}
            onChallenges={() => router.push(`/venues/${selectedVenue.id}`)}
          />
        )}

        <VenueList
          venues={venues}
          selectedVenueId={selectedVenue?.id || null}
          isLoading={isLoading}
          onVenueSelect={handleVenueSelect}
        />
      </div>
    </main>
  )
}
