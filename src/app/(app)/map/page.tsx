'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api'
import { useLocation } from '@/context/LocationContext'

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
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-500 mb-2">Failed to load Google Maps</p>
          <p className="text-gray-500 text-sm">Please check your API key configuration</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/welcome')}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Back
            </button>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Venue Map</h1>
          </div>
          <span className="text-2xl md:text-3xl">🏀</span>
        </div>

        {/* Location Status */}
        <div className="text-sm text-center">
          {geoLoading ? (
            <p className="text-gray-500">Getting your location...</p>
          ) : latitude ? (
            <p className="text-green-600">📍 Showing venues near you</p>
          ) : permission === 'denied' ? (
            <div className="space-y-2">
              <p className="text-yellow-600">📍 Location access denied</p>
              <p className="text-xs text-gray-500">
                Enable Location Services in your phone settings, then allow this site to access location
              </p>
            </div>
          ) : geoError ? (
            <div className="space-y-2">
              <p className="text-yellow-600">📍 {geoError}</p>
              <button
                onClick={requestPermission}
                className="px-3 py-1 bg-gray-200 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-300 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            <button
              onClick={requestPermission}
              className="px-4 py-2 bg-[#4361EE] text-white text-sm font-medium rounded-lg hover:bg-[#3651DE] transition-colors"
            >
              📍 Enable Location
            </button>
          )}
        </div>

        {/* Map */}
        <div className="bg-white rounded-xl md:rounded-2xl shadow overflow-hidden h-[350px] md:h-[450px]">
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
                      className="mt-2 w-full py-1 px-2 bg-[#4361EE] text-white text-sm rounded hover:bg-[#3651DE]"
                    >
                      View Details
                    </button>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#4361EE] border-t-transparent" />
            </div>
          )}
        </div>

        {/* Selected Venue Panel */}
        {selectedVenue && (
          <div className="bg-white rounded-xl md:rounded-2xl shadow p-4 md:p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg md:text-xl font-bold text-gray-900">{selectedVenue.name}</h2>
                {selectedVenue.district && (
                  <p className="text-sm text-gray-500">{selectedVenue.district}</p>
                )}
                {selectedVenue.distanceFormatted && (
                  <p className="text-sm text-blue-600">📍 {selectedVenue.distanceFormatted}</p>
                )}
              </div>
              <button onClick={closePanel} className="text-gray-400 hover:text-gray-600 text-xl">
                ×
              </button>
            </div>

            {/* King of the Court */}
            {selectedVenue.king && (
              <div
                onClick={() => openPlayerCard(selectedVenue.king!.id)}
                className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform"
              >
                <span className="text-xl">👑</span>
                <div className="w-10 h-10 rounded-full bg-yellow-200 overflow-hidden border-2 border-yellow-400">
                  <Image
                    src={selectedVenue.king.avatar.imageUrl}
                    alt="King"
                    width={40}
                    height={40}
                    className="object-cover w-full h-full"
                    unoptimized
                  />
                </div>
                <span className="text-yellow-700 font-semibold text-sm">King of the Court</span>
                <span className="text-yellow-600 text-xs ml-auto">
                  {selectedVenue.king.xp.toLocaleString()} XP
                </span>
              </div>
            )}

            {/* Active Players */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Active Players ({activePlayers.length})
              </h3>
              {isLoadingDetails ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#4361EE] border-t-transparent mx-auto" />
                </div>
              ) : activePlayers.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">
                  No active players at this venue
                </p>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {activePlayers.map((player) => (
                    <div
                      key={player.id}
                      onClick={() => openPlayerCard(player.id)}
                      className="flex flex-col items-center p-2 bg-gray-50 rounded-lg cursor-pointer active:scale-95 transition-transform"
                    >
                      <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden border-2 border-gray-300">
                        <Image
                          src={player.avatar.imageUrl}
                          alt="Player"
                          width={48}
                          height={48}
                          className="object-cover w-full h-full"
                          unoptimized
                        />
                      </div>
                      <span className="text-xs font-semibold text-gray-700 mt-1">
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
              className="w-full py-3 md:py-4 bg-[#4361EE] text-white font-semibold rounded-xl hover:bg-[#3651DE] transition-colors"
            >
              View Challenges ({selectedVenue.challengeCount})
            </button>
          </div>
        )}

        {/* Venue List */}
        <div>
          <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3">
            Nearby Venues ({venues.length})
          </h3>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#4361EE] border-t-transparent mx-auto" />
            </div>
          ) : venues.length === 0 ? (
            <div className="bg-white rounded-xl shadow p-8 text-center">
              <p className="text-gray-500">No venues found</p>
            </div>
          ) : (
            <div className="space-y-2 md:space-y-3">
              {venues.map((venue) => (
                <div
                  key={venue.id}
                  onClick={() => handleVenueSelect(venue)}
                  className={`bg-white rounded-xl md:rounded-2xl shadow p-4 md:p-5 cursor-pointer active:scale-[0.98] transition-transform ${
                    selectedVenue?.id === venue.id ? 'ring-2 ring-[#4361EE]' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-gray-900 font-semibold">{venue.name}</h4>
                        {venue.king && <span className="text-yellow-500">👑</span>}
                      </div>
                      {venue.district && <p className="text-gray-500 text-sm">{venue.district}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500 text-sm">👥 {venue.activePlayerCount}</span>
                      {venue.distanceFormatted && (
                        <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
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
