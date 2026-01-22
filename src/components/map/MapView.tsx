'use client'

import { GoogleMap, Marker, InfoWindow } from '@react-google-maps/api'
import type { VenueItem, LatLng } from './types'
import { DirectionsPanel } from './DirectionsPanel'

const mapContainerStyle = { width: '100%', height: '100%' }

interface MapViewProps {
  isLoaded: boolean
  isLoading: boolean
  userCenter: LatLng
  latitude: number | null
  longitude: number | null
  venues: VenueItem[]
  infoWindowVenue: VenueItem | null
  showDirections: boolean
  origin: LatLng | null
  destination: LatLng | null
  selectedVenueName: string
  onMarkerClick: (venue: VenueItem) => void
  onInfoWindowClose: () => void
  onVenueSelect: (venue: VenueItem) => void
  onCloseDirections: () => void
}

export function MapView(props: MapViewProps): JSX.Element {
  const {
    isLoaded,
    isLoading,
    userCenter,
    latitude,
    longitude,
    venues,
    infoWindowVenue,
    showDirections,
    origin,
    destination,
    selectedVenueName,
    onMarkerClick,
    onInfoWindowClose,
    onVenueSelect,
    onCloseDirections,
  } = props

  return (
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
          <UserLocationMarker latitude={latitude} longitude={longitude} />
          <VenueMarkers venues={venues} onMarkerClick={onMarkerClick} />
          <VenueInfoWindow
            venue={infoWindowVenue}
            onClose={onInfoWindowClose}
            onSelect={onVenueSelect}
          />
          {showDirections && (
            <DirectionsPanel
              origin={origin}
              destination={destination}
              venueName={selectedVenueName}
              onClose={onCloseDirections}
            />
          )}
        </GoogleMap>
      ) : (
        <LoadingSpinner />
      )}
    </div>
  )
}

function UserLocationMarker({
  latitude,
  longitude,
}: {
  latitude: number | null
  longitude: number | null
}): JSX.Element | null {
  if (!latitude || !longitude) return null

  return (
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
  )
}

function VenueMarkers({
  venues,
  onMarkerClick,
}: {
  venues: VenueItem[]
  onMarkerClick: (venue: VenueItem) => void
}): JSX.Element {
  return (
    <>
      {venues
        .filter((v) => v.latitude && v.longitude)
        .map((venue) => (
          <Marker
            key={venue.id}
            position={{ lat: venue.latitude!, lng: venue.longitude! }}
            onClick={() => onMarkerClick(venue)}
            icon={{
              url: venue.king
                ? 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png'
                : 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
            }}
          />
        ))}
    </>
  )
}

function VenueInfoWindow({
  venue,
  onClose,
  onSelect,
}: {
  venue: VenueItem | null
  onClose: () => void
  onSelect: (venue: VenueItem) => void
}): JSX.Element | null {
  if (!venue?.latitude || !venue?.longitude) return null

  return (
    <InfoWindow position={{ lat: venue.latitude, lng: venue.longitude }} onCloseClick={onClose}>
      <div className="p-2 min-w-[150px]">
        <p className="font-semibold text-gray-900">{venue.name}</p>
        <p className="text-sm text-gray-500">👥 {venue.activePlayerCount} active</p>
        {venue.distanceFormatted && (
          <p className="text-xs text-blue-600">{venue.distanceFormatted}</p>
        )}
        <button
          onClick={() => onSelect(venue)}
          className="mt-2 w-full py-1 px-2 bg-white/20 text-gray-900 text-sm rounded hover:bg-white/30 border border-gray-300"
        >
          View Details
        </button>
      </div>
    </InfoWindow>
  )
}

function LoadingSpinner(): JSX.Element {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent" />
    </div>
  )
}
