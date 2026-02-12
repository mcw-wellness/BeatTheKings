'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Stage = 'uploading' | 'upload_done' | 'analyzing' | 'analyze_done' | 'complete'

export default function DemoResultPage(): JSX.Element {
  const router = useRouter()
  const [stage, setStage] = useState<Stage>('uploading')
  const [showDots, setShowDots] = useState(true)

  // Blinking dots animation
  useEffect(() => {
    const dotsInterval = setInterval(() => {
      setShowDots((prev) => !prev)
    }, 500)

    return () => clearInterval(dotsInterval)
  }, [])

  // Animation sequence: upload (5s) -> analyze (8s) -> complete
  useEffect(() => {
    const timer1 = setTimeout(() => setStage('upload_done'), 5000) // Upload complete after 5s
    const timer2 = setTimeout(() => setStage('analyzing'), 5500) // Start analyzing after 5.5s
    const timer3 = setTimeout(() => setStage('analyze_done'), 13500) // Analyze complete after 8s more
    const timer4 = setTimeout(() => setStage('complete'), 14000) // Show results

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
      clearTimeout(timer4)
    }
  }, [])

  const handleClaim = (): void => {
    router.push('/challenges')
  }

  // Hardcoded demo results (matching actual demo video: 2 hits, 2 misses, 50%)
  const results = {
    made: 2,
    missed: 2,
    accuracy: 50,
    xp: 50,
    rp: 0, // No RP since accuracy is below 80%
  }

  const isUploadComplete = stage !== 'uploading'
  const isAnalyzeStarted = stage === 'analyzing' || stage === 'analyze_done' || stage === 'complete'
  const isAnalyzeComplete = stage === 'analyze_done' || stage === 'complete'
  const isFullyComplete = stage === 'complete'

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

      <div className="max-w-lg mx-auto p-4 space-y-6 relative z-10 flex-1 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/challenges')}
            className="text-white/80 hover:text-white"
          >
            ← Back
          </button>
          <h1 className="text-xl font-bold text-white flex-1">3-Point Shot</h1>
        </div>

        {/* Result Card */}
        <div className="bg-white rounded-3xl border-4 border-green-500 p-6 space-y-6">
          {/* Uploading video row */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800">
              Uploading video{stage === 'uploading' && (showDots ? '...' : '')}
            </h2>
            {isUploadComplete && (
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <p className="text-gray-500 text-sm mt-1">Upload complete!</p>
              </div>
            )}
          </div>

          {/* Analyzing video row */}
          {isAnalyzeStarted && (
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">
                Analyzing video
                <br />
                with AI{stage === 'analyzing' && (showDots ? '...' : '')}
              </h2>
              {isAnalyzeComplete && (
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm mt-1">Analysis complete!</p>
                </div>
              )}
            </div>
          )}

          {/* Results section - only show when fully complete */}
          {isFullyComplete && (
            <>
              {/* Stats row */}
              <div className="flex justify-center gap-12 py-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="text-gray-700 font-semibold text-lg">Made: {results.made}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="text-gray-700 font-semibold text-lg">
                    Missed: {results.missed}
                  </span>
                </div>
              </div>

              {/* Accuracy pill */}
              <div className="flex justify-center">
                <div className="bg-green-100 rounded-full px-8 py-3">
                  <p className="text-2xl font-bold text-green-500">Accuracy: {results.accuracy}%</p>
                </div>
              </div>

              {/* Claim Button */}
              <button
                onClick={handleClaim}
                className="w-full py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-2xl transition-all text-lg"
              >
                {results.rp > 0
                  ? `Claim ${results.rp} RP & ${results.xp} XP`
                  : `Claim ${results.xp} XP`}
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
