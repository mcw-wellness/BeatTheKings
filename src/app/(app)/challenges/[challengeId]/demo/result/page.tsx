'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DemoResultPage(): JSX.Element {
  const router = useRouter()
  const [stage, setStage] = useState<'uploading' | 'analyzing' | 'done'>('uploading')

  // Simulate the analysis process
  useEffect(() => {
    const timer1 = setTimeout(() => setStage('analyzing'), 1500)
    const timer2 = setTimeout(() => setStage('done'), 3500)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
    }
  }, [])

  const handleClaim = (): void => {
    router.push('/challenges')
  }

  // Hardcoded demo results
  const results = {
    made: 4,
    missed: 1,
    accuracy: 80,
    xp: 50,
    rp: 10,
  }

  return (
    <main
      className="min-h-screen relative"
      style={{
        backgroundImage: 'url(/backgrounds/stadium.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none" />

      <div className="max-w-lg mx-auto p-4 space-y-6 relative z-10">
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
        <div className="bg-white rounded-3xl border-4 border-green-500 p-8 space-y-5">
          <h2 className="text-center text-xl font-bold text-gray-800">Result</h2>

          {/* Accuracy */}
          <div className="bg-gray-50 rounded-2xl p-6 text-center">
            <p className="text-4xl font-bold text-green-500">Accuracy: {results.accuracy}%</p>
          </div>

          {/* Loading indicator */}
          <div className="flex flex-col items-center gap-3 py-2">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
              {stage === 'done' ? (
                <svg className="w-7 h-7 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <div className="w-0 h-0 border-l-[12px] border-l-gray-400 border-y-[7px] border-y-transparent ml-1" />
              )}
            </div>
            <p className="text-gray-500 text-sm">
              {stage === 'uploading' && 'Uploading video...'}
              {stage === 'analyzing' && 'Analyzing video with AI...'}
              {stage === 'done' && 'Analysis complete!'}
            </p>
          </div>

          {/* Stats */}
          <div
            className={`flex justify-center gap-16 py-2 transition-opacity duration-300 ${stage === 'done' ? 'opacity-100' : 'opacity-0'}`}
          >
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
              <span className="text-gray-700 font-semibold text-lg">Missed: {results.missed}</span>
            </div>
          </div>

          {/* Claim Button */}
          <button
            onClick={handleClaim}
            disabled={stage !== 'done'}
            className={`w-full py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-2xl transition-all text-lg ${stage !== 'done' ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Claim {results.rp} RP & {results.xp} XP
          </button>
        </div>
      </div>
    </main>
  )
}
