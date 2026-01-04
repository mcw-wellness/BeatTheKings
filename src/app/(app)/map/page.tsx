'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { useGeolocation } from '@/lib/hooks/useGeolocation'

// Dynamically import map components (Leaflet doesn't work with SSR)
const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), {
  ssr: false,
})
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), {
  ssr: false,
})
const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), { ssr: false })

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

export default function MapPage(): JSX.Element {
  const router = useRouter()
  const { latitude, longitude, loading: geoLoading, error: geoError } = useGeolocation()

  const [venues, setVenues] = useState<VenueItem[]>([])
  const [selectedVenue, setSelectedVenue] = useState<VenueItem | null>(null)
  const [activePlayers, setActivePlayers] = useState<ActivePlayer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [mapReady, setMapReady] = useState(false)

  // Default center (Vienna)
  const defaultCenter: [number, number] = [48.2082, 16.3738]
  const userCenter: [number, number] = latitude && longitude ? [latitude, longitude] : defaultCenter

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

  // Load Leaflet CSS
  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)
    setMapReady(true)
    return () => {
      document.head.removeChild(link)
    }
  }, [])

  const openPlayerCard = (playerId: string): void => {
    router.push(`/player/${playerId}`)
  }

  const handleVenueClick = (venue: VenueItem): void => {
    fetchVenueDetails(venue.id)
  }

  const closePanel = (): void => {
    setSelectedVenue(null)
    setActivePlayers([])
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/welcome')}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Back
            </button>
            <h1 className="text-xl font-bold text-gray-900">Venue Map</h1>
          </div>
          <span className="text-2xl">🏀</span>
        </div>

        {/* Location Status */}
        <div className="text-sm text-center">
          {geoLoading ? (
            <p className="text-gray-500">Getting your location...</p>
          ) : geoError ? (
            <p className="text-yellow-600">📍 Location unavailable - showing Vienna area</p>
          ) : (
            <p className="text-green-600">📍 Showing venues near you</p>
          )}
        </div>

        {/* Map */}
        <div className="bg-white rounded-xl shadow overflow-hidden" style={{ height: '400px' }}>
          {mapReady && !isLoading ? (
            <MapContainer center={userCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {venues
                .filter((v) => v.latitude && v.longitude)
                .map((venue) => (
                  <Marker
                    key={venue.id}
                    position={[venue.latitude!, venue.longitude!]}
                    eventHandlers={{
                      click: () => handleVenueClick(venue),
                    }}
                  >
                    <Popup>
                      <div className="text-center">
                        <p className="font-semibold">{venue.name}</p>
                        <p className="text-sm text-gray-500">👥 {venue.activePlayerCount} active</p>
                        {venue.distanceFormatted && (
                          <p className="text-xs text-blue-600">{venue.distanceFormatted}</p>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                ))}
            </MapContainer>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#4361EE] border-t-transparent" />
            </div>
          )}
        </div>

        {/* Selected Venue Panel */}
        {selectedVenue && (
          <div className="bg-white rounded-xl shadow p-4 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{selectedVenue.name}</h2>
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

            {/* Active Players - Avatar + Rank only, no names */}
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
              className="w-full py-3 bg-[#4361EE] text-white font-semibold rounded-xl hover:bg-[#3651DE] transition-colors"
            >
              View Challenges ({selectedVenue.challengeCount})
            </button>
          </div>
        )}

        {/* Venue List - Sorted by Distance */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-3">Nearby Venues ({venues.length})</h3>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#4361EE] border-t-transparent mx-auto" />
            </div>
          ) : venues.length === 0 ? (
            <div className="bg-white rounded-xl shadow p-8 text-center">
              <p className="text-gray-500">No venues found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {venues.map((venue) => (
                <div
                  key={venue.id}
                  onClick={() => handleVenueClick(venue)}
                  className={`bg-white rounded-xl shadow p-4 cursor-pointer active:scale-[0.98] transition-transform ${
                    selectedVenue?.id === venue.id ? 'ring-2 ring-[#4361EE]' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="text-gray-900 font-semibold">{venue.name}</h4>
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
