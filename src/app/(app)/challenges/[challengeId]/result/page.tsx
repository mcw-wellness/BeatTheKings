'use client'

import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function ResultContent(): JSX.Element {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const challengeId = params.challengeId as string

  const score = parseInt(searchParams.get('score') || '0', 10)
  const max = parseInt(searchParams.get('max') || '0', 10)
  const xp = parseInt(searchParams.get('xp') || '0', 10)
  const rp = parseInt(searchParams.get('rp') || '0', 10)
  const message = searchParams.get('message') || ''

  const accuracy = max > 0 ? Math.round((score / max) * 100) : 0
  const isGoodScore = accuracy >= 80

  const handleTryAgain = (): void => {
    router.push(`/challenges/${challengeId}/play`)
  }

  const handleDone = (): void => {
    router.push('/challenges')
  }

  return (
    <main
      className="h-dvh relative"
      style={{
        backgroundImage: 'url(/backgrounds/stadium.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none" />
      <div className="max-w-lg mx-auto h-full flex flex-col relative z-10">
        {/* Header */}
        <div className="p-4 border-b border-white/20">
          <h1 className="text-xl font-bold text-white text-center">Challenge Complete!</h1>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 overflow-y-auto">
          {/* Result Icon */}
          <div className="text-6xl md:text-7xl mb-6">{isGoodScore ? '🎉' : '💪'}</div>

          {/* Score Card */}
          <div className="bg-white/10 backdrop-blur rounded-2xl border border-white/20 p-6 md:p-10 text-center w-full max-w-sm mb-6">
            <p className="text-white/60 text-sm mb-2">Final Score</p>
            <p className="text-5xl md:text-6xl font-bold text-white">
              {score}
              <span className="text-white/50">/{max}</span>
            </p>
            <p
              className={`text-2xl md:text-3xl font-semibold mt-2 ${isGoodScore ? 'text-green-400' : 'text-yellow-400'}`}
            >
              {accuracy}% accuracy
            </p>
          </div>

          {/* Message */}
          {message && <p className="text-white/80 text-center mb-4">{message}</p>}

          {/* Rewards */}
          <div className="flex items-center justify-center gap-8 mb-6">
            <div className="text-center">
              <p className="text-white/60 text-xs">XP Earned</p>
              <p className="text-2xl md:text-3xl font-bold text-yellow-400">+{xp}</p>
            </div>
            {rp > 0 && (
              <div className="text-center">
                <p className="text-white/60 text-xs">RP Earned</p>
                <p className="text-2xl md:text-3xl font-bold text-purple-400">+{rp}</p>
              </div>
            )}
          </div>

          {/* Tip for low accuracy */}
          {!isGoodScore && (
            <div className="bg-yellow-500/20 border border-yellow-500/40 rounded-lg p-3 w-full max-w-sm">
              <p className="text-yellow-300 text-sm text-center">
                Reach 80% accuracy to earn RP rewards!
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-4 md:p-6 border-t border-white/20 bg-black/20 backdrop-blur space-y-3">
          <button
            onClick={handleTryAgain}
            className="w-full py-4 md:py-5 bg-green-500/80 hover:bg-green-500 text-white text-lg font-semibold rounded-xl transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={handleDone}
            className="w-full py-3 md:py-4 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-colors border border-white/20"
          >
            Back to Challenges
          </button>
        </div>
      </div>
    </main>
  )
}

export default function ChallengeResultPage(): JSX.Element {
  return (
    <Suspense
      fallback={
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
      }
    >
      <ResultContent />
    </Suspense>
  )
}
