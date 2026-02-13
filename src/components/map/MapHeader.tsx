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
      className="h-dvh flex items-center justify-center p-4 relative"
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
  highlight?: boolean
}

export function MapLoadingFallback(): JSX.Element {
  return (
    <main
      className="h-dvh flex items-center justify-center relative"
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
  highlight,
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
      <div className="text-sm text-center space-y-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
        <p className="text-yellow-300">📍 Location disabled</p>
        <p className="text-xs text-white/60">
          You can manually check in at venues below. To enable auto check-in, allow location in your browser settings.
        </p>
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
    <div className="text-sm text-center relative">
      {highlight && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap">
          <div className="bg-green-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-lg">
            👆 Enable location to play!
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-green-500" />
          </div>
        </div>
      )}
      <button
        onClick={requestPermission}
        className={`px-4 py-2 text-white text-sm font-medium rounded-lg border ${
          highlight
            ? 'bg-green-500/20 border-green-400 ring-2 ring-green-400 ring-offset-2 ring-offset-transparent animate-pulse'
            : 'bg-white/20 border-white/30 hover:bg-white/30'
        }`}
      >
        📍 Enable Location
      </button>
    </div>
  )
}
