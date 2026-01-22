export interface VenueItem {
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

export interface ActivePlayer {
  id: string
  rank: number
  avatar: { imageUrl: string }
}

export interface LatLng {
  lat: number
  lng: number
}
