'use client'

import { useRef, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function DemoVideoPage(): JSX.Element {
  const router = useRouter()
  const params = useParams()
  const challengeId = params.challengeId as string
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const togglePlay = (): void => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleVideoClick = (): void => {
    togglePlay()
  }

  const handleUploadAnalyze = (): void => {
    router.push(`/challenges/${challengeId}/demo/result`)
  }

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
          <button onClick={() => router.back()} className="text-white/80 hover:text-white">
            ← Back
          </button>
          <h1 className="text-xl font-bold text-white flex-1">3-Point Shot</h1>
        </div>

        {/* Video Player */}
        <div className="relative rounded-xl overflow-hidden bg-black">
          <video
            ref={videoRef}
            src="/videos/demo-3point.mp4"
            className="w-full aspect-video object-cover"
            onClick={handleVideoClick}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
            controls
            playsInline
          />

          {/* Demo Video Label */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-black/50 px-3 py-1 rounded text-white/80 text-sm pointer-events-none">
            Demo Video
          </div>

          {/* Play Overlay (shown when paused) */}
          {!isPlaying && (
            <div
              className="absolute inset-0 flex items-center justify-center cursor-pointer"
              onClick={handleVideoClick}
            >
              <div className="w-16 h-16 rounded-full bg-white/30 backdrop-blur flex items-center justify-center">
                <div className="w-0 h-0 border-l-[20px] border-l-white border-y-[12px] border-y-transparent ml-1" />
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={togglePlay}
            className="flex-1 py-5 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-2xl transition-colors flex items-center justify-center gap-4"
          >
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              {isPlaying ? (
                <div className="flex gap-1">
                  <div className="w-1.5 h-4 bg-white rounded" />
                  <div className="w-1.5 h-4 bg-white rounded" />
                </div>
              ) : (
                <div className="w-0 h-0 border-l-[12px] border-l-white border-y-[7px] border-y-transparent ml-1" />
              )}
            </div>
            <span className="text-base">{isPlaying ? 'Pause video' : 'Play video'}</span>
          </button>

          <button
            onClick={handleUploadAnalyze}
            className="flex-1 py-5 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold rounded-2xl transition-colors flex items-center justify-center gap-4"
          >
            <div className="w-10 h-10 rounded-full bg-black/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
            </div>
            <div className="text-left">
              <span className="block text-base">Upload and</span>
              <span className="block text-base">analyze video</span>
            </div>
          </button>
        </div>
      </div>
    </main>
  )
}
