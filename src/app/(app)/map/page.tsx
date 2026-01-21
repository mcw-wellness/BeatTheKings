'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api'
import { useLocation } from '@/context/LocationContext'
import { Logo } from '@/components/layout/Logo'

interface VenueItem {
  id: string
  name: string
  address: string | null
  district: string | null
  latitude: number | null
  longitude: number | null
  distance: number | null
  distanceFormatted: string | null
  activePlayerCount: number
  king: {
    id: string
    name: string | null
    xp: number
    avatar: { imageUrl: string }
  } | null
  challengeCount: number
}

interface ActivePlayer {
  id: string
  rank: number
  avatar: { imageUrl: string }
}

interface VenueDetailData {
  venue: VenueItem
  activePlayers: ActivePlayer[]
}

const mapContainerStyle = {
  width: '100%',
  height: '100%',
}

const defaultCenter = { lat: 48.2082, lng: 16.3738 } // Vienna

export default function MapPage(): JSX.Element {
  const router = useRouter()
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

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  })

  const userCenter = latitude && longitude ? { lat: latitude, lng: longitude } : defaultCenter

  // Fetch venues list
  const fetchVenues = useCallback(async (): Promise<void> => {
    setIsLoading(true)

    try {
      let url = '/api/venues?limit=50'
      if (latitude && longitude) {
        url += `&lat=${latitude}&lng=${longitude}`
      }

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setVenues(data.venues || [])
      }
    } catch (err) {
      console.error('Failed to fetch venues:', err)
    } finally {
      setIsLoading(false)
    }
  }, [latitude, longitude])

  // Fetch venue details with active players
  const fetchVenueDetails = async (venueId: string): Promise<void> => {
    setIsLoadingDetails(true)

    try {
      let url = `/api/venues/${venueId}`
      if (latitude && longitude) {
        url += `?lat=${latitude}&lng=${longitude}`
      }

      const response = await fetch(url)
      if (response.ok) {
        const data: VenueDetailData = await response.json()
        setSelectedVenue(data.venue)
        setActivePlayers(data.activePlayers || [])
      }
    } catch (err) {
      console.error('Failed to fetch venue details:', err)
    } finally {
      setIsLoadingDetails(false)
    }
  }

  useEffect(() => {
    if (!geoLoading) {
      fetchVenues()
    }
  }, [geoLoading, fetchVenues])

  const openPlayerCard = (playerId: string): void => {
    router.push(`/player/${playerId}`)
  }

  const handleMarkerClick = (venue: VenueItem): void => {
    setInfoWindowVenue(venue)
  }

  const handleVenueSelect = (venue: VenueItem): void => {
    setInfoWindowVenue(null)
    fetchVenueDetails(venue.id)
  }

  const closePanel = (): void => {
    setSelectedVenue(null)
    setActivePlayers([])
  }

  if (loadError) {
    return (
      <main
        className="min-h-screen flex items-center justify-center p-4 relative"
        style={{
          backgroundImage: 'url(/backgrounds/stadium.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none" />
        <div className="text-center relative z-10">
          <p className="text-red-300 mb-2">Failed to load Google Maps</p>
          <p className="text-white/60 text-sm">Please check your API key configuration</p>
        </div>
      </main>
    )
  }

  return (
    <main
      className="min-h-screen relative"
      style={{
        backgroundImage: 'url(/backgrounds/stadium.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Light overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none" />

      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-4 md:space-y-6 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="sm" linkToHome className="w-10 h-10" />
            <h1 className="text-xl md:text-2xl font-bold text-white">Venue Map</h1>
          </div>
          <span className="text-2xl md:text-3xl">🏀</span>
        </div>

        {/* Location Status */}
        <div className="text-sm text-center">
          {geoLoading ? (
            <p className="text-white/60">Getting your location...</p>
          ) : latitude ? (
            <p className="text-green-300">📍 Showing venues near you</p>
          ) : permission === 'denied' ? (
            <div className="space-y-2">
              <p className="text-yellow-300">📍 Location access denied</p>
              <p className="text-xs text-white/50">
                Enable Location Services in your phone settings, then allow this site to access
                location
              </p>
            </div>
          ) : geoError ? (
            <div className="space-y-2">
              <p className="text-yellow-300">📍 {geoError}</p>
              <button
                onClick={requestPermission}
                className="px-3 py-1 bg-white/20 text-white text-xs font-medium rounded-lg hover:bg-white/30 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            <button
              onClick={requestPermission}
              className="px-4 py-2 bg-white/20 text-white text-sm font-medium rounded-lg hover:bg-white/30 transition-colors border border-white/30"
            >
              📍 Enable Location
            </button>
          )}
        </div>

        {/* Map */}
        <div className="bg-white/10 backdrop-blur rounded-xl md:rounded-2xl border border-white/20 overflow-hidden h-[350px] md:h-[450px]">
          {isLoaded && !isLoading ? (
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={userCenter}
              zoom={13}
              options={{
                disableDefaultUI: false,
                zoomControl: true,
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: true,
              }}
            >
              {/* User location marker */}
              {latitude && longitude && (
                <Marker
                  position={{ lat: latitude, lng: longitude }}
                  icon={{
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 8,
                    fillColor: '#4361EE',
                    fillOpacity: 1,
                    strokeColor: '#ffffff',
                    strokeWeight: 2,
                  }}
                  title="Your location"
                />
              )}

              {/* Venue markers */}
              {venues
                .filter((v) => v.latitude && v.longitude)
                .map((venue) => (
                  <Marker
                    key={venue.id}
                    position={{ lat: venue.latitude!, lng: venue.longitude! }}
                    onClick={() => handleMarkerClick(venue)}
                    icon={{
                      url: venue.king
                        ? 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png'
                        : 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
                    }}
                  />
                ))}

              {/* Info Window */}
              {infoWindowVenue && infoWindowVenue.latitude && infoWindowVenue.longitude && (
                <InfoWindow
                  position={{ lat: infoWindowVenue.latitude, lng: infoWindowVenue.longitude }}
                  onCloseClick={() => setInfoWindowVenue(null)}
                >
                  <div className="p-2 min-w-[150px]">
                    <p className="font-semibold text-gray-900">{infoWindowVenue.name}</p>
                    <p className="text-sm text-gray-500">
                      👥 {infoWindowVenue.activePlayerCount} active
                    </p>
                    {infoWindowVenue.distanceFormatted && (
                      <p className="text-xs text-blue-600">{infoWindowVenue.distanceFormatted}</p>
                    )}
                    {infoWindowVenue.king && (
                      <p className="text-xs text-yellow-600 mt-1">👑 Has King</p>
                    )}
                    <button
                      onClick={() => handleVenueSelect(infoWindowVenue)}
                      className="mt-2 w-full py-1 px-2 bg-white/20 text-gray-900 text-sm rounded hover:bg-white/30 border border-gray-300"
                    >
                      View Details
                    </button>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent" />
            </div>
          )}
        </div>

        {/* Selected Venue Panel */}
        {selectedVenue && (
          <div className="bg-white/10 backdrop-blur rounded-xl md:rounded-2xl border border-white/20 p-4 md:p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg md:text-xl font-bold text-white">{selectedVenue.name}</h2>
                {selectedVenue.district && (
                  <p className="text-sm text-white/60">{selectedVenue.district}</p>
                )}
                {selectedVenue.distanceFormatted && (
                  <p className="text-sm text-white/80">📍 {selectedVenue.distanceFormatted}</p>
                )}
              </div>
              <button onClick={closePanel} className="text-white/60 hover:text-white text-xl">
                ×
              </button>
            </div>

            {/* King of the Court */}
            {selectedVenue.king && (
              <div
                onClick={() => openPlayerCard(selectedVenue.king!.id)}
                className="bg-yellow-500/20 border border-yellow-500/40 rounded-lg p-3 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform"
              >
                <span className="text-xl">👑</span>
                <div className="w-10 h-10 rounded-full bg-yellow-500/30 overflow-hidden border-2 border-yellow-500/60">
                  <Image
                    src={selectedVenue.king.avatar.imageUrl}
                    alt="King"
                    width={40}
                    height={40}
                    className="object-cover w-full h-full"
                    unoptimized
                  />
                </div>
                <span className="text-yellow-300 font-semibold text-sm">King of the Court</span>
                <span className="text-yellow-300/80 text-xs ml-auto">
                  {selectedVenue.king.xp.toLocaleString()} XP
                </span>
              </div>
            )}

            {/* Active Players */}
            <div>
              <h3 className="text-sm font-semibold text-white/80 mb-2">
                Active Players ({activePlayers.length})
              </h3>
              {isLoadingDetails ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent mx-auto" />
                </div>
              ) : activePlayers.length === 0 ? (
                <p className="text-white/50 text-sm text-center py-4">
                  No active players at this venue
                </p>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {activePlayers.map((player) => (
                    <div
                      key={player.id}
                      onClick={() => openPlayerCard(player.id)}
                      className="flex flex-col items-center p-2 bg-white/10 rounded-lg cursor-pointer active:scale-95 transition-transform"
                    >
                      <div className="w-12 h-12 rounded-full bg-white/20 overflow-hidden border-2 border-white/30">
                        <Image
                          src={player.avatar.imageUrl}
                          alt="Player"
                          width={48}
                          height={48}
                          className="object-cover w-full h-full"
                          unoptimized
                        />
                      </div>
                      <span className="text-xs font-semibold text-white/80 mt-1">
                        #{player.rank}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* View Challenges Button */}
            <button
              onClick={() => router.push(`/venues/${selectedVenue.id}`)}
              className="w-full py-3 md:py-4 bg-white/20 text-white font-semibold rounded-xl hover:bg-white/30 transition-colors border border-white/30"
            >
              View Challenges ({selectedVenue.challengeCount})
            </button>
          </div>
        )}

        {/* Venue List */}
        <div>
          <h3 className="text-lg md:text-xl font-bold text-white mb-3">
            Nearby Venues ({venues.length})
          </h3>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent mx-auto" />
            </div>
          ) : venues.length === 0 ? (
            <div className="bg-white/10 backdrop-blur rounded-xl border border-white/20 p-8 text-center">
              <p className="text-white/60">No venues found</p>
            </div>
          ) : (
            <div className="space-y-2 md:space-y-3">
              {venues.map((venue) => (
                <div
                  key={venue.id}
                  onClick={() => handleVenueSelect(venue)}
                  className={`bg-white/10 backdrop-blur rounded-xl md:rounded-2xl border border-white/20 p-4 md:p-5 cursor-pointer active:scale-[0.98] transition-transform ${
                    selectedVenue?.id === venue.id ? 'ring-2 ring-white/50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-white font-semibold">{venue.name}</h4>
                        {venue.king && <span className="text-yellow-500">👑</span>}
                      </div>
                      {venue.district && <p className="text-white/60 text-sm">{venue.district}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-white/60 text-sm">👥 {venue.activePlayerCount}</span>
                      {venue.distanceFormatted && (
                        <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full">
                          {venue.distanceFormatted}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
