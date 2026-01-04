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
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-lg mx-auto min-h-screen flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900 text-center">Challenge Complete!</h1>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
          {/* Result Icon */}
          <div className="text-6xl md:text-7xl mb-6">{isGoodScore ? '🎉' : '💪'}</div>

          {/* Score Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-10 text-center w-full max-w-sm mb-6">
            <p className="text-gray-500 text-sm mb-2">Final Score</p>
            <p className="text-5xl md:text-6xl font-bold text-gray-900">
              {score}
              <span className="text-gray-400">/{max}</span>
            </p>
            <p
              className={`text-2xl md:text-3xl font-semibold mt-2 ${isGoodScore ? 'text-green-500' : 'text-yellow-500'}`}
            >
              {accuracy}% accuracy
            </p>
          </div>

          {/* Message */}
          {message && <p className="text-gray-600 text-center mb-4">{message}</p>}

          {/* Rewards */}
          <div className="flex items-center justify-center gap-8 mb-6">
            <div className="text-center">
              <p className="text-gray-500 text-xs">XP Earned</p>
              <p className="text-2xl md:text-3xl font-bold text-yellow-500">+{xp}</p>
            </div>
            {rp > 0 && (
              <div className="text-center">
                <p className="text-gray-500 text-xs">RP Earned</p>
                <p className="text-2xl md:text-3xl font-bold text-purple-500">+{rp}</p>
              </div>
            )}
          </div>

          {/* Tip for low accuracy */}
          {!isGoodScore && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 w-full max-w-sm">
              <p className="text-yellow-700 text-sm text-center">
                Reach 80% accuracy to earn RP rewards!
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-4 md:p-6 border-t border-gray-200 bg-white space-y-3">
          <button
            onClick={handleTryAgain}
            className="w-full py-4 md:py-5 bg-[#4361EE] hover:bg-[#3651DE] text-white text-lg font-semibold rounded-xl transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={handleDone}
            className="w-full py-3 md:py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
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
        <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#4361EE] border-t-transparent" />
        </main>
      }
    >
      <ResultContent />
    </Suspense>
  )
}
