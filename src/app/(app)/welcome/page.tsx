'use client'

import { useState, useEffect, Suspense, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { useAvatarUrlWithLoading } from '@/lib/hooks/useAvatarUrl'
import { AvatarDisplay, StatsPanels, NavigationGrid } from '@/components/welcome/WelcomeComponents'

interface PlayerStats {
  totalXp: number
  totalRp: number
  matchesPlayed: number
  matchesWon: number
  challengesCompleted: number
}

// Toast component for avatar updating notification
function AvatarToast({ show, onHide }: { show: boolean; onHide: () => void }): JSX.Element | null {
  if (!show) return null

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
      <div className="bg-green-500/90 backdrop-blur-sm text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3">
        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        <span className="font-medium">Your avatar will be updated shortly</span>
        <button onClick={onHide} className="ml-2 text-white/80 hover:text-white">
          ✕
        </button>
      </div>
    </div>
  )
}

export default function WelcomePage(): JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="h-screen bg-gradient-to-b from-[#1a1a2e] to-[#16213e] flex items-center justify-center">
          <div className="animate-pulse text-white/60">Loading...</div>
        </div>
      }
    >
      <WelcomePageContent />
    </Suspense>
  )
}

function WelcomePageContent(): JSX.Element {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status, update } = useSession()
  const [stats, setStats] = useState<PlayerStats | null>(null)
  const [rank, setRank] = useState<number | null>(null)
  const [isResetting, setIsResetting] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const {
    url: avatarUrl,
    isLoading: isAvatarLoading,
    refetch: refetchAvatar,
  } = useAvatarUrlWithLoading({
    type: 'user',
    userId: 'me',
  })

  // Check if avatar is updating in background
  const isAvatarUpdating = searchParams.get('avatarUpdating') === 'true'
  const [pollingStartTime, setPollingStartTime] = useState<number | null>(null)

  const STORAGE_KEY = 'avatarUpdateStartTime'
  const POLLING_TIMEOUT = 120000 // 2 minutes

  // Helper to clear the update state
  const clearUpdateState = useCallback((): void => {
    localStorage.removeItem(STORAGE_KEY)
    setShowToast(false)
    setPollingStartTime(null)
  }, [])

  // On mount, check localStorage for an active avatar update
  useEffect(() => {
    const storedStartTime = localStorage.getItem(STORAGE_KEY)
    if (storedStartTime) {
      const startTime = parseInt(storedStartTime, 10)
      const elapsed = Date.now() - startTime
      // If within timeout, resume polling
      if (elapsed < POLLING_TIMEOUT) {
        setPollingStartTime(startTime)
        setShowToast(true)
      } else {
        // Expired, clear it
        localStorage.removeItem(STORAGE_KEY)
      }
    }
  }, [])

  // Show toast and start polling when avatarUpdating param is present
  useEffect(() => {
    if (isAvatarUpdating) {
      const startTime = Date.now()
      localStorage.setItem(STORAGE_KEY, startTime.toString())
      setShowToast(true)
      setPollingStartTime(startTime)
      // Remove the query param from URL without refresh
      router.replace('/welcome', { scroll: false })
    }
  }, [isAvatarUpdating, router])

  // Poll for avatar updates (continues even if toast is closed)
  useEffect(() => {
    if (!pollingStartTime) return

    const pollForUpdate = async (): Promise<boolean> => {
      try {
        const res = await fetch(`/api/users/avatar?_t=${Date.now()}`) // Cache-bust the API call
        if (res.ok) {
          const data = await res.json()
          // Check if avatar was updated after we started polling
          if (data.avatar?.updatedAt) {
            const updatedAt = new Date(data.avatar.updatedAt).getTime()
            if (updatedAt > pollingStartTime) {
              // Avatar was updated! Refetch the avatar URL to get fresh image
              refetchAvatar()
              clearUpdateState()
              return true // Stop polling
            }
          }
        }
      } catch {
        // Ignore errors during polling
      }
      return false // Continue polling
    }

    const pollInterval = setInterval(async () => {
      const updated = await pollForUpdate()
      if (updated) {
        clearInterval(pollInterval)
      }
    }, 5000) // Poll every 5 seconds

    // Stop polling after remaining time from original start
    const elapsed = Date.now() - pollingStartTime
    const remainingTime = Math.max(POLLING_TIMEOUT - elapsed, 0)
    const timeout = setTimeout(() => {
      clearInterval(pollInterval)
      clearUpdateState()
    }, remainingTime)

    return () => {
      clearInterval(pollInterval)
      clearTimeout(timeout)
    }
  }, [pollingStartTime, refetchAvatar, clearUpdateState])

  const displayName = session?.user?.nickname || session?.user?.name || 'Player'
  const hasCreatedAvatar = session?.user?.hasCreatedAvatar ?? false

  // Onboarding: highlight Map button if user hasn't completed onboarding
  const [showMapHighlight, setShowMapHighlight] = useState(false)
  const ONBOARDING_KEY = 'hasCompletedOnboarding'

  useEffect(() => {
    if (hasCreatedAvatar) {
      const hasCompleted = localStorage.getItem(ONBOARDING_KEY) === 'true'
      if (!hasCompleted) {
        setShowMapHighlight(true)
      }
    }
  }, [hasCreatedAvatar])

  useEffect(() => {
    if (session?.user?.id) {
      fetch('/api/users/stats')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) {
            setStats(data.stats)
            setRank(data.rank || null)
          }
        })
        .catch(() => {})
    }
  }, [session?.user?.id])

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  const handleReset = async (): Promise<void> => {
    if (!confirm('Reset your account? This will delete your avatar and progress.')) return
    setIsResetting(true)
    try {
      const res = await fetch('/api/users/reset', { method: 'POST' })
      if (res.ok) {
        await update()
        router.push('/register')
      } else alert('Failed to reset account')
    } catch {
      alert('Failed to reset account')
    } finally {
      setIsResetting(false)
    }
  }

  if (status === 'loading')
    return (
      <div className="h-screen bg-gradient-to-b from-[#1a1a2e] to-[#16213e] flex items-center justify-center">
        <div className="animate-pulse text-white/60">Loading...</div>
      </div>
    )

  const totalPoints = stats?.totalXp || 0
  const winRate =
    stats && stats.matchesPlayed > 0
      ? Math.round((stats.matchesWon / stats.matchesPlayed) * 100)
      : 0
  const challengesCompleted = stats?.challengesCompleted || 0
  const level = Math.floor(totalPoints / 1000) + 1
  const xpInLevel = totalPoints % 1000
  const xpForNextLevel = 300
  const xpProgress = (xpInLevel / xpForNextLevel) * 100
  const isKing = rank === 1

  return (
    <main
      className="h-screen overflow-hidden flex flex-col"
      style={{
        backgroundImage: 'url(/backgrounds/stadium.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <AvatarToast show={showToast} onHide={() => setShowToast(false)} />
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none" />
      <div className="relative z-10 flex flex-col h-full">
        <div className="px-4 py-3 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-xl font-bold text-white">{displayName}</h1>
            <p className="text-sm text-white/60">{rank ? `#${rank} Ranked` : 'Unranked'}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              disabled={isResetting}
              className="px-2 py-1 text-xs bg-red-500/80 text-white rounded-lg hover:bg-red-500 disabled:opacity-50"
            >
              {isResetting ? '...' : '🔄 Reset'}
            </button>
            <div className="relative w-16 h-16">
              <Image
                src="/logos/logo3.jpeg"
                alt="Beat the Kingz"
                fill
                className="object-contain rounded-[20%]"
                priority
              />
            </div>
          </div>
        </div>
        <div className="flex-1 grid grid-cols-[55%_45%] min-h-0 px-4">
          <AvatarDisplay
            isLoading={isAvatarLoading}
            avatarUrl={avatarUrl}
            isKing={isKing}
            onClick={() => router.push('/avatar')}
          />
          <StatsPanels
            totalPoints={totalPoints}
            winRate={winRate}
            rank={rank}
            level={level}
            xpInLevel={xpInLevel}
            xpForNextLevel={xpForNextLevel}
            xpProgress={xpProgress}
            challengesCompleted={challengesCompleted}
          />
        </div>
        <NavigationGrid hasCreatedAvatar={hasCreatedAvatar} onNavigate={router.push} highlightMap={showMapHighlight} />
      </div>
    </main>
  )
}
