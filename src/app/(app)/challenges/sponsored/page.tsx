'use client'

import { useRouter } from 'next/navigation'
import { Logo } from '@/components/layout/Logo'

export default function SponsoredChallengesPage(): JSX.Element {
  const router = useRouter()

  return (
    <main
      className="h-dvh flex flex-col overflow-hidden relative"
      style={{
        backgroundImage: 'url(/backgrounds/stadium.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none" />

      <div className="max-w-lg mx-auto p-4 space-y-4 relative z-10 flex-1 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Logo size="sm" linkToHome className="w-10 h-10" />
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">Sponsored Challenges</h1>
            <p className="text-sm text-white/60">Partner Events</p>
          </div>
        </div>

        {/* Coming Soon Card */}
        <div className="bg-[#1e2a4a]/90 backdrop-blur rounded-xl p-8 border border-white/10 text-center">
          <div className="text-6xl mb-4">🏆</div>
          <h2 className="text-2xl font-bold text-white mb-2">Coming Soon</h2>
          <p className="text-white/60 mb-6">
            Sponsored challenges from our partners will appear here. Stay tuned for exciting
            competitions with exclusive rewards!
          </p>

          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <p className="text-sm text-white/80">
              <span className="text-orange-400 font-semibold">A1 Super Challenge</span>
              <br />
              <span className="text-white/50">and more coming soon...</span>
            </p>
          </div>
        </div>

        {/* Features Preview */}
        <div className="bg-[#1e2a4a]/90 backdrop-blur rounded-xl p-4 border border-white/10">
          <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wide mb-3">
            What to Expect
          </h3>
          <ul className="space-y-3">
            <li className="flex items-center gap-3">
              <span className="text-xl">🎁</span>
              <span className="text-white/70 text-sm">Exclusive rewards and prizes</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-xl">⭐</span>
              <span className="text-white/70 text-sm">Bonus XP multipliers</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-xl">🏅</span>
              <span className="text-white/70 text-sm">Limited edition badges</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-xl">📊</span>
              <span className="text-white/70 text-sm">Special leaderboards</span>
            </li>
          </ul>
        </div>

        {/* Back Button */}
        <button
          onClick={() => router.push('/challenges')}
          className="w-full bg-[#1e2a4a]/80 border border-white/10 text-white font-medium py-3 rounded-xl transition-colors hover:bg-[#1e2a4a]"
        >
          ← Back to Challenges
        </button>
      </div>
    </main>
  )
}
