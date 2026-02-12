'use client'

import { ReactNode } from 'react'

interface StadiumPageLayoutProps {
  children: ReactNode
}

export function StadiumPageLayout({ children }: StadiumPageLayoutProps): JSX.Element {
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
      <div className="max-w-lg mx-auto p-4 space-y-4 relative z-10 flex-1 overflow-y-auto">{children}</div>
    </main>
  )
}

export function PageLoadingState(): JSX.Element {
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
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent relative z-10" />
    </main>
  )
}

export function PageErrorState({
  error,
  onRetry,
}: {
  error: string
  onRetry?: () => void
}): JSX.Element {
  return (
    <main
      className="h-dvh flex flex-col items-center justify-center p-4 relative"
      style={{
        backgroundImage: 'url(/backgrounds/stadium.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none" />
      <p className="text-red-300 mb-4 relative z-10">{error}</p>
      <button
        onClick={onRetry || (() => window.location.reload())}
        className="text-white/80 hover:text-white underline relative z-10"
      >
        Try Again
      </button>
    </main>
  )
}
