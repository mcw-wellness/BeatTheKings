'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { useAvatarUrl } from '@/lib/hooks/useAvatarUrl'

interface PlayerStats {
  totalXp: number
  totalRp: number
  matchesPlayed: number
  matchesWon: number
  challengesCompleted: number
}

export default function WelcomePage(): JSX.Element {
  return (
    <Suspense fallback={<WelcomePageSkeleton />}>
      <WelcomePageContent />
    </Suspense>
  )
}

function WelcomePageSkeleton(): JSX.Element {
  return (
    <main className="min-h-screen bg-transparent flex items-center justify-center">
      <div className="animate-pulse text-white/60">Loading...</div>
    </main>
  )
}

function WelcomePageContent(): JSX.Element {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [stats, setStats] = useState<PlayerStats | null>(null)
  const [rank, setRank] = useState<number | null>(null)

  // Get user's avatar URL
  const avatarUrl = useAvatarUrl({ type: 'user', userId: 'me' })

  // User info from session
  const displayName = session?.user?.nickname || session?.user?.name || 'Player'
  const hasCreatedAvatar = session?.user?.hasCreatedAvatar ?? false

  // Fetch player stats
  useEffect(() => {
    async function fetchStats(): Promise<void> {
      try {
        const res = await fetch('/api/users/stats')
        if (res.ok) {
          const data = await res.json()
          setStats(data.stats)
          setRank(data.rank || null)
        }
      } catch {
        // Stats not available
      }
    }
    if (session?.user?.id) {
      fetchStats()
    }
  }, [session?.user?.id])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return <WelcomePageSkeleton />
  }

  // Calculate derived stats
  const totalPoints = stats?.totalXp || 0
  const winRate =
    stats && stats.matchesPlayed > 0
      ? Math.round((stats.matchesWon / stats.matchesPlayed) * 100)
      : 0
  const challengesCompleted = stats?.challengesCompleted || 0

  // XP progress for level (simplified: 1000 XP per level)
  const level = Math.floor(totalPoints / 1000) + 1
  const xpInLevel = totalPoints % 1000
  const xpProgress = (xpInLevel / 1000) * 100

  const features = [
    {
      id: 'challenges',
      name: 'Challenges',
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M7 2v11h3v9l7-12h-4l4-8z" />
        </svg>
      ),
      path: '/challenges',
      locked: !hasCreatedAvatar,
    },
    {
      id: 'map',
      name: 'Map',
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z" />
        </svg>
      ),
      path: '/map',
      locked: !hasCreatedAvatar,
    },
    {
      id: 'rankings',
      name: 'Rankings',
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M5 16h3v5H5zm6-6h3v11h-3zm6-4h3v15h-3z" />
        </svg>
      ),
      path: '/ranking',
      locked: !hasCreatedAvatar,
    },
    {
      id: 'matches',
      name: 'My Matches',
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
      ),
      path: '/matches',
      locked: !hasCreatedAvatar,
    },
  ]

  return (
    <main className="min-h-screen bg-transparent p-4 sm:p-6 pb-8">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{displayName}</h1>
            <p className="text-sm text-white/60">{rank ? `#${rank} Ranked` : 'Unranked'}</p>
          </div>
          {/* Logo3 - illustrated BTK logo */}
          <div className="relative w-20 h-20 sm:w-24 sm:h-24">
            <Image
              src="/logos/logo3.jpeg"
              alt="Beat the Kingz"
              fill
              className="object-contain rounded-[20%]"
              priority
            />
          </div>
        </div>

        {/* Avatar Card */}
        <div
          className="relative bg-white/10 rounded-2xl overflow-hidden border border-white/20 cursor-pointer"
          onClick={() => router.push('/avatar')}
        >
          {/* Avatar Image */}
          <div className="relative h-64 sm:h-80 bg-gradient-to-b from-white/5 to-transparent">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt="Your Avatar"
                fill
                className="object-cover"
                priority
                unoptimized
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <svg
                    className="w-24 h-24 text-white/30 mx-auto"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                  <p className="text-white/50 mt-2">Tap to customize avatar</p>
                </div>
              </div>
            )}
            {/* Crown indicator for King status */}
            {rank === 1 && (
              <div className="absolute top-4 left-4 bg-gradient-to-r from-white/30 to-white/40 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
                </svg>
                King
              </div>
            )}
          </div>
        </div>

        {/* Performance Section */}
        <div className="bg-white/10 rounded-xl p-4 border border-white/20">
          <h2 className="text-sm font-semibold text-white mb-3 uppercase tracking-wider">
            Performance
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zm-2 3c0 1.65-1.35 3-3 3s-3-1.35-3-3V5h6v3z" />
                </svg>
                <span className="text-white/80">Total Points</span>
              </div>
              <span className="text-xl font-bold text-white">{totalPoints}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
                <span className="text-white/80">Win Rate</span>
              </div>
              <span className="text-xl font-bold text-white">{winRate}%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M5 16h3v5H5zm6-6h3v11h-3zm6-4h3v15h-3z" />
                </svg>
                <span className="text-white/80">Ranking</span>
              </div>
              <span className="text-xl font-bold text-white">#{rank || '--'}</span>
            </div>
          </div>
        </div>

        {/* Progression Section */}
        <div className="bg-white/10 rounded-xl p-4 border border-white/20">
          <h2 className="text-sm font-semibold text-white mb-3 uppercase tracking-wider">
            Progression
          </h2>
          {/* Level and XP Bar */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-lg font-bold text-white">LEVEL {level}</span>
              <span className="text-xs text-white/60">{xpInLevel} / 1000</span>
            </div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden border border-white/20">
              <div
                className="h-full bg-gradient-to-r from-white/20 to-white/30 rounded-full transition-all duration-500"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7 2v11h3v9l7-12h-4l4-8z" />
                </svg>
                <span className="text-white/80">Challenges</span>
              </div>
              <span className="text-xl font-bold text-white">{challengesCompleted}/13</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm-1.06 13.54L7.4 12l1.41-1.41 2.12 2.12 4.24-4.24 1.41 1.41-5.64 5.66z" />
                </svg>
                <span className="text-white/80">Badges</span>
              </div>
              <span className="text-xl font-bold text-white">0/3</span>
            </div>
          </div>
        </div>

        {/* Recommended Label */}
        {!hasCreatedAvatar && (
          <div className="flex justify-start">
            <span className="text-xs font-semibold text-white bg-white/20 px-3 py-1 rounded-full border border-white/20">
              Recommended
            </span>
          </div>
        )}

        {/* Feature Buttons Grid */}
        <div className="grid grid-cols-2 gap-3">
          {features.map((feature, index) => (
            <button
              key={feature.id}
              onClick={() => !feature.locked && router.push(feature.path)}
              disabled={feature.locked}
              className={`relative p-4 rounded-xl border-2 transition-all ${
                feature.locked
                  ? 'bg-white/10 border-white/20 cursor-not-allowed'
                  : 'bg-white/10 border-white/30 hover:bg-white/20 hover:border-white/40 active:scale-95'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={feature.locked ? 'text-white/40' : 'text-white'}>
                  {feature.icon}
                </div>
                <span
                  className={`text-sm font-semibold ${feature.locked ? 'text-white/40' : 'text-white'}`}
                >
                  {feature.name}
                </span>
              </div>
              {feature.locked && (
                <div className="absolute top-3 right-3">
                  <svg className="w-5 h-5 text-white/50" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6z" />
                  </svg>
                </div>
              )}
              {/* Show recommended badge on first item when avatar not created */}
              {index === 0 && !hasCreatedAvatar && (
                <div className="absolute -top-2 -left-2 w-4 h-4 bg-white/60 rounded-full animate-pulse" />
              )}
            </button>
          ))}
        </div>

        {/* Sponsor Sections */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/10 rounded-xl p-4 border border-white/20">
            <p className="text-xs text-white/50 mb-1">December</p>
            <p className="text-sm font-semibold text-white">BB Championship</p>
            <p className="text-xs text-white/40 mt-1">
              sponsored by <span className="font-bold text-white/60">DONK</span>
            </p>
          </div>
          <div className="bg-white/10 rounded-xl p-4 border border-white/20">
            <p className="text-xs text-white font-semibold mb-1">COMING SOON</p>
            <p className="text-sm text-white">3P Shooting Championship</p>
            <p className="text-xs text-white/40 mt-1">
              sponsored by <span className="font-bold text-white/60">K1</span>
            </p>
          </div>
        </div>

        {/* Create Avatar Banner - Only show when avatar not created */}
        {!hasCreatedAvatar && (
          <div className="bg-white/10 border-2 border-white/30 rounded-xl p-4">
            <p className="text-white text-sm font-medium text-center mb-3">
              Create your avatar to unlock all features!
            </p>
            <button
              onClick={() => router.push('/avatar')}
              className="w-full py-3 bg-gradient-to-b from-white/20 to-white/30 hover:from-white/30 hover:to-white/40 text-white font-bold rounded-lg transition-all border-2 border-white/30"
            >
              Create Avatar
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
