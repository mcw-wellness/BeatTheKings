'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface ChallengeDetail {
  id: string
  name: string
  description: string
  instructions: string
  challengeType: string
  difficulty: string
  xpReward: number
  rpReward: number
  sportName: string
  venueName: string
  myAttempts: number
  myBestScore: { scoreValue: number; maxValue: number } | null
}

export default function ChallengeDetailPage(): JSX.Element {
  const router = useRouter()
  const params = useParams()
  const challengeId = params.challengeId as string

  const [challenge, setChallenge] = useState<ChallengeDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDetailedInstructions, setShowDetailedInstructions] = useState(false)

  const fetchChallenge = useCallback(async (): Promise<void> => {
    if (!challengeId) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/challenges/${challengeId}`)

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Challenge not found')
        }
        throw new Error('Failed to load challenge')
      }

      const json = await response.json()
      setChallenge(json.challenge)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }, [challengeId])

  useEffect(() => {
    fetchChallenge()
  }, [fetchChallenge])

  const getDifficultyColor = (difficulty: string): string => {
    if (difficulty === 'easy') return 'bg-green-500/20 text-green-300'
    if (difficulty === 'medium') return 'bg-yellow-500/20 text-yellow-300'
    return 'bg-red-500/20 text-red-300'
  }

  const startChallenge = (): void => {
    router.push(`/challenges/${challengeId}/play`)
  }

  const startDemoChallenge = (): void => {
    router.push(`/challenges/${challengeId}/demo`)
  }

  // Check if this is a 3-Point Shot challenge at Esterhazy Park (demo eligible)
  const isDemoEligible =
    challenge?.challengeType === 'three_point' &&
    challenge?.venueName?.toLowerCase().includes('esterhazy')

  if (isLoading) {
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

  if (error || !challenge) {
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
        <p className="text-red-300 mb-4 relative z-10">{error || 'Challenge not found'}</p>
        <button
          onClick={() => router.back()}
          className="text-white/80 hover:text-white underline relative z-10"
        >
          Go Back
        </button>
      </main>
    )
  }

  const bestAccuracy = challenge.myBestScore
    ? Math.round((challenge.myBestScore.scoreValue / challenge.myBestScore.maxValue) * 100)
    : null

  return (
    <main
      className="h-dvh flex flex-col overflow-hidden relative"
      style={{
        backgroundImage: 'url(/backgrounds/stadium.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Light overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none" />

      <div className="px-3 py-2 space-y-3 relative z-10 flex-1 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-white/80 hover:text-white">
            ← Back
          </button>
          <h1 className="text-xl font-bold text-white flex-1">{challenge.name}</h1>
        </div>

        {/* Challenge Info Card */}
        <div className="bg-white/10 backdrop-blur rounded-xl border border-white/20 p-4">
          <div className="flex items-center gap-2 mb-3">
            <span
              className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(challenge.difficulty)}`}
            >
              {challenge.difficulty.toUpperCase()}
            </span>
            <span className="text-white/50 text-xs">{challenge.sportName}</span>
          </div>

          <p className="text-white/70 mb-3">{challenge.description}</p>

          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <span className="text-yellow-400">⭐</span>
              <span className="text-white font-medium">{challenge.xpReward} XP</span>
            </div>
            {challenge.rpReward > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-purple-400">💎</span>
                <span className="text-white font-medium">{challenge.rpReward} RP</span>
              </div>
            )}
          </div>

          <p className="text-white/50 text-xs mt-2">📍 {challenge.venueName}</p>
        </div>

        {/* Instructions Card */}
        <div className="bg-white/10 backdrop-blur rounded-xl border border-white/20 p-4">
          <h2 className="font-semibold text-white mb-2 flex items-center gap-2">
            <span>📋</span>
            <span>Instructions</span>
          </h2>

          {isDemoEligible ? (
            <>
              {/* Game Instructions */}
              <div className="p-3 bg-blue-500/20 rounded-lg border border-blue-500/30 mb-3">
                <p className="text-blue-200 text-sm">
                  <span className="font-semibold text-blue-100">Game:</span> Stand at the top of the
                  3-point line. Jump straight up and throw the ball with both hands mid-air. Only
                  balls going through the rim count.{' '}
                  <button
                    onClick={() => setShowDetailedInstructions(true)}
                    className="text-yellow-300 font-semibold hover:text-yellow-200 underline"
                  >
                    GET DETAILED GAME INSTRUCTIONS {'>>'}
                  </button>
                </p>
              </div>

              {/* Camera Instructions */}
              <div className="p-3 bg-yellow-500/20 rounded-lg border border-yellow-500/30">
                <p className="text-yellow-200 text-sm">
                  <span className="font-semibold text-yellow-100">Camera:</span> Position camera at
                  a 45° angle (wing point) and avoid backlighting. Record in portrait mode at eye
                  level using tripod or steady hand. Keep video short (max. 2 minutes).
                </p>
              </div>
            </>
          ) : (
            <p className="text-white/70 whitespace-pre-line">{challenge.instructions}</p>
          )}
        </div>

        {/* Stats Card */}
        {challenge.myAttempts > 0 && (
          <div className="bg-green-500/20 backdrop-blur border border-green-500/40 rounded-xl p-4">
            <h2 className="font-semibold text-white mb-2 flex items-center gap-2">
              <span>📊</span>
              <span>Your Stats</span>
            </h2>
            <div className="flex items-center gap-6">
              <div>
                <p className="text-white/60 text-xs">Attempts</p>
                <p className="text-white font-bold text-lg">{challenge.myAttempts}</p>
              </div>
              {challenge.myBestScore && (
                <div>
                  <p className="text-white/60 text-xs">Best Score</p>
                  <p className="text-white font-bold text-lg">
                    {challenge.myBestScore.scoreValue}/{challenge.myBestScore.maxValue}
                    <span className="text-green-300 text-sm ml-1">({bestAccuracy}%)</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* RP Hint */}
        <div className="bg-purple-500/20 border border-purple-500/40 rounded-lg p-3">
          <p className="text-purple-300 text-xs">
            💡 Tip: Achieve 80% accuracy or higher to earn {challenge.rpReward} RP!
          </p>
        </div>

        {/* Start Buttons */}
        {isDemoEligible ? (
          <div className="flex gap-3">
            <button
              onClick={startChallenge}
              className="flex-1 py-4 bg-green-500/80 hover:bg-green-500 text-white font-semibold rounded-xl transition-colors flex flex-col items-center justify-center gap-1"
            >
              <span className="text-sm">Start Challenge</span>
              <span className="text-xs opacity-80">& recording video</span>
            </button>
            <button
              onClick={startDemoChallenge}
              className="flex-1 py-4 bg-yellow-500/90 hover:bg-yellow-500 text-black font-semibold rounded-xl transition-colors flex flex-col items-center justify-center gap-1"
            >
              <span className="text-sm">Start Challenge &</span>
              <span className="text-xs opacity-80">use demo video</span>
            </button>
          </div>
        ) : (
          <button
            onClick={startChallenge}
            className="w-full py-4 bg-green-500/80 hover:bg-green-500 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <span>🎯</span>
            <span>Start Challenge</span>
          </button>
        )}
      </div>

      {/* Detailed Instructions Overlay */}
      {showDetailedInstructions && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setShowDetailedInstructions(false)}
        >
          {/* Blurred backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          {/* Modal content */}
          <div
            className="relative bg-gray-900/95 rounded-2xl border border-white/20 p-6 max-w-lg max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setShowDetailedInstructions(false)}
              className="absolute top-4 right-4 text-white/60 hover:text-white text-2xl font-bold"
            >
              ×
            </button>

            <h2 className="text-xl font-bold text-white mb-4">Detailed Game Instructions:</h2>

            <div className="space-y-4 text-white/80 text-sm">
              <div>
                <h3 className="font-semibold text-yellow-300 mb-2">Perfecting Your Form</h3>
                <p>
                  Stand at the top of the 3-point line with your feet shoulder-width apart, dominant
                  foot 6 inches ahead of the other, and shoulders squared to the basket for
                  accuracy. Keep your knees slightly bent to generate power from your legs. Hold the
                  ball above your head with your elbow at a 90-degree angle, fingers spread wide,
                  and the ball resting on the pads of your fingers. Use your non-dominant hand as a
                  guide, lightly touching the side of the ball without gripping it.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-yellow-300 mb-2">Taking the Shot</h3>
                <p>
                  Jump straight up as you extend your shooting arm forward, snap your wrist at the
                  peak of your jump to create backspin and arc, and follow through fully with your
                  arm extended and wrist snapped. Aim for the front of the rim or the hooks holding
                  the net, visualizing the ball going just over the rim.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-yellow-300 mb-2">Practicing for Consistency</h3>
                <p>
                  Start with 25 shots from below the rim, then progress to 5 feet away, focusing on
                  shot line and wrist snap. Use imaginary baskets (with a partner or wall) to refine
                  form without distraction. Practice from multiple spots around the 3-point
                  line—top of key, wings, and corners—ensuring toes point toward the basket after
                  each shot. Incorporate drills like dribbling into a shot, quick hops, and energy
                  transfer exercises to build rhythm and strength.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
