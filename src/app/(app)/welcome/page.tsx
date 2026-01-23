'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
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
  const { data: session, status, update } = useSession()
  const [stats, setStats] = useState<PlayerStats | null>(null)
  const [rank, setRank] = useState<number | null>(null)
  const [isResetting, setIsResetting] = useState(false)
  const { url: avatarUrl, isLoading: isAvatarLoading } = useAvatarUrlWithLoading({
    type: 'user',
    userId: 'me',
  })

  const displayName = session?.user?.nickname || session?.user?.name || 'Player'
  const hasCreatedAvatar = session?.user?.hasCreatedAvatar ?? false

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
        <div className="flex-1 flex min-h-0 px-4">
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
        <NavigationGrid hasCreatedAvatar={hasCreatedAvatar} onNavigate={router.push} />
      </div>
    </main>
  )
}
