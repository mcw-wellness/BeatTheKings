'use client'

import { Logo } from '@/components/layout/Logo'

export function MapHeader(): JSX.Element {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Logo size="sm" linkToHome className="w-10 h-10" />
        <h1 className="text-xl md:text-2xl font-bold text-white">Venue Map</h1>
      </div>
      <span className="text-2xl md:text-3xl">🏀</span>
    </div>
  )
}

export function MapError(): JSX.Element {
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

interface LocationStatusProps {
  geoLoading: boolean
  latitude: number | null
  permission: string
  geoError: string | null
  requestPermission: () => void
}

export function MapLoadingFallback(): JSX.Element {
  return (
    <main
      className="min-h-screen flex items-center justify-center relative"
      style={{
        backgroundImage: 'url(/backgrounds/stadium.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none" />
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent" />
    </main>
  )
}

export function LocationStatus({
  geoLoading,
  latitude,
  permission,
  geoError,
  requestPermission,
}: LocationStatusProps): JSX.Element {
  if (geoLoading) {
    return (
      <div className="text-sm text-center">
        <p className="text-white/60">Getting your location...</p>
      </div>
    )
  }
  if (latitude) {
    return (
      <div className="text-sm text-center">
        <p className="text-green-300">📍 Showing venues near you</p>
      </div>
    )
  }
  if (permission === 'denied') {
    return (
      <div className="text-sm text-center space-y-2">
        <p className="text-yellow-300">📍 Location access denied</p>
        <p className="text-xs text-white/50">Enable Location Services in your phone settings</p>
      </div>
    )
  }
  if (geoError) {
    return (
      <div className="text-sm text-center space-y-2">
        <p className="text-yellow-300">📍 {geoError}</p>
        <button
          onClick={requestPermission}
          className="px-3 py-1 bg-white/20 text-white text-xs font-medium rounded-lg hover:bg-white/30"
        >
          Try Again
        </button>
      </div>
    )
  }
  return (
    <div className="text-sm text-center">
      <button
        onClick={requestPermission}
        className="px-4 py-2 bg-white/20 text-white text-sm font-medium rounded-lg hover:bg-white/30 border border-white/30"
      >
        📍 Enable Location
      </button>
    </div>
  )
}
