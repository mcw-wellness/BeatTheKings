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
    <main className="h-screen bg-gradient-to-b from-[#1a1a2e] to-[#16213e] flex items-center justify-center">
      <div className="animate-pulse text-white/60">Loading...</div>
    </main>
  )
}

function WelcomePageContent(): JSX.Element {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [stats, setStats] = useState<PlayerStats | null>(null)
  const [rank, setRank] = useState<number | null>(null)

  const avatarUrl = useAvatarUrl({ type: 'user', userId: 'me' })

  const displayName = session?.user?.nickname || session?.user?.name || 'Player'
  const hasCreatedAvatar = session?.user?.hasCreatedAvatar ?? false

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

  const totalPoints = stats?.totalXp || 0
  const winRate =
    stats && stats.matchesPlayed > 0
      ? Math.round((stats.matchesWon / stats.matchesPlayed) * 100)
      : 0
  const challengesCompleted = stats?.challengesCompleted || 0

  const level = Math.floor(totalPoints / 1000) + 1
  const xpInLevel = totalPoints % 1000
  const xpForNextLevel = 300 // Simplified for display
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
      {/* Light overlay for text readability - minimal to match avatar stadium */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="px-4 py-3 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-xl font-bold text-white">{displayName}</h1>
            <p className="text-sm text-white/60">{rank ? `#${rank} Ranked` : 'Unranked'}</p>
          </div>
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

        {/* Main Content - Two Column Layout */}
        <div className="flex-1 flex min-h-0 px-4">
          {/* Left Column - Avatar (60% width) */}
          <div
            className="w-[55%] flex items-center justify-center cursor-pointer"
            onClick={() => router.push('/avatar')}
          >
            {avatarUrl ? (
              <div className="relative w-full h-[90%]">
                {/* Crown for King */}
                {isKing && (
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-10">
                    <span className="text-5xl">👑</span>
                  </div>
                )}
                <Image
                  src={avatarUrl}
                  alt="Your Avatar"
                  fill
                  className="object-contain"
                  priority
                  unoptimized
                />
              </div>
            ) : (
              <div className="text-center text-white/50 pb-20">
                <p>Tap to customize avatar</p>
              </div>
            )}
          </div>

          {/* Right Column - Stats Panels (45% width) */}
          <div className="w-[45%] flex flex-col justify-center gap-3 pl-2">
            {/* Performance Panel */}
            <div className="bg-[#1e2a4a]/90 backdrop-blur rounded-xl p-3 border border-white/10">
              <h3 className="text-xs font-bold text-white/80 uppercase tracking-wider mb-3">
                Performance
              </h3>
              <div className="space-y-3">
                <StatRow icon="🏆" label="Total Points" value={totalPoints.toString()} />
                <StatRow icon="🎯" label="Win Rate" value={`${winRate}%`} />
                <StatRow icon="📊" label="Ranking" value={rank ? `#${rank}` : '#--'} />
              </div>
            </div>

            {/* Progression Panel */}
            <div className="bg-[#1e2a4a]/90 backdrop-blur rounded-xl p-3 border border-white/10">
              <h3 className="text-xs font-bold text-white/80 uppercase tracking-wider mb-3">
                Progression
              </h3>
              {/* Level Bar */}
              <div className="mb-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-base font-bold text-white">LEVEL {level}</span>
                  <span className="text-xs text-white/50">
                    {xpInLevel} / {xpForNextLevel}
                  </span>
                </div>
                <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-yellow-400 rounded-full"
                    style={{ width: `${Math.min(xpProgress, 100)}%` }}
                  />
                </div>
              </div>
              <div className="space-y-3">
                <StatRow icon="⚡" label="Challenges" value={`${challengesCompleted}/13`} />
                <StatRow icon="⭐" label="Badges" value="0/3" />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="px-4 pb-4 pt-2 shrink-0 space-y-2">
          {/* Navigation Grid */}
          <div className="grid grid-cols-2 gap-2">
            <NavButton
              icon="🏆"
              label="Challenges"
              locked={!hasCreatedAvatar}
              onClick={() => router.push('/challenges')}
            />
            <NavButton
              icon="🗺️"
              label="Map"
              locked={!hasCreatedAvatar}
              onClick={() => router.push('/map')}
            />
            <NavButton
              icon="⚔️"
              label="Rankings"
              locked={!hasCreatedAvatar}
              onClick={() => router.push('/ranking')}
            />
            <NavButton
              icon="🤝"
              label="My Matches"
              locked={!hasCreatedAvatar}
              onClick={() => router.push('/matches')}
            />
          </div>

          {/* Championship Footer */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#1e2a4a]/80 rounded-xl p-3 border border-white/10">
              <p className="text-xs text-white/60">🏀 BB Championship</p>
            </div>
            <div className="bg-[#1e2a4a]/80 rounded-xl p-3 border border-white/10">
              <p className="text-xs text-white/60">COMING SOON</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

function StatRow({
  icon,
  label,
  value,
}: {
  icon: string
  label: string
  value: string
}): JSX.Element {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-sm">{icon}</span>
        <span className="text-xs text-white/70">{label}</span>
      </div>
      <span className="text-base font-bold text-white">{value}</span>
    </div>
  )
}

function NavButton({
  icon,
  label,
  locked,
  onClick,
}: {
  icon: string
  label: string
  locked: boolean
  onClick: () => void
}): JSX.Element {
  return (
    <button
      onClick={locked ? undefined : onClick}
      disabled={locked}
      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
        locked
          ? 'bg-[#1e2a4a]/60 border-white/10 cursor-not-allowed'
          : 'bg-[#1e2a4a]/80 border-white/20 hover:bg-[#1e2a4a] active:scale-98'
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <span className={`text-sm font-medium ${locked ? 'text-white/40' : 'text-white'}`}>
          {label}
        </span>
      </div>
      {locked && <span className="text-white/40">🔒</span>}
    </button>
  )
}
