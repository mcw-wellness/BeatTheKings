'use client'

import { useLocation } from '@/context/LocationContext'

interface LocationTestControlsProps {
  venueName: string | null
  venueLatitude: number | null
  venueLongitude: number | null
}

export function LocationTestControls({
  venueName,
  venueLatitude,
  venueLongitude,
}: LocationTestControlsProps): JSX.Element | null {
  const { setMockLocation, clearMockLocation, isMockLocation, latitude, longitude } = useLocation()

  if (process.env.NEXT_PUBLIC_ENABLE_TEST_LOCATION !== 'true') {
    return null
  }

  const canSetMock =
    typeof venueLatitude === 'number' &&
    Number.isFinite(venueLatitude) &&
    typeof venueLongitude === 'number' &&
    Number.isFinite(venueLongitude)

  return (
    <div className="bg-black/50 border border-orange-500/40 rounded-xl p-3 space-y-2">
      <p className="text-xs font-semibold text-orange-300">TEST MODE • Location Override</p>
      <p className="text-[11px] text-white/70">
        Current: {latitude?.toFixed(5) ?? '—'}, {longitude?.toFixed(5) ?? '—'}
        {isMockLocation ? ' (mock)' : ''}
      </p>

      <div className="flex gap-2">
        <button
          type="button"
          disabled={!canSetMock}
          onClick={() => {
            if (!canSetMock) return
            setMockLocation(venueLatitude as number, venueLongitude as number)
          }}
          className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-white/10 disabled:text-white/40 text-white text-xs font-medium py-2 px-3 rounded-lg transition-colors"
        >
          Set to {venueName ?? 'selected venue'}
        </button>

        <button
          type="button"
          onClick={clearMockLocation}
          className="bg-white/10 hover:bg-white/20 text-white text-xs font-medium py-2 px-3 rounded-lg transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  )
}
