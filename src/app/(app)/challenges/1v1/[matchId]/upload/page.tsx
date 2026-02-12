'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function MatchUploadPage(): JSX.Element {
  const router = useRouter()
  const params = useParams()
  const matchId = params.matchId as string

  const [uploadProgress, setUploadProgress] = useState(0)
  const [status, setStatus] = useState<
    'preparing' | 'uploading' | 'analyzing' | 'complete' | 'error'
  >('preparing')
  const [error, setError] = useState<string | null>(null)
  const [duration, setDuration] = useState('0:00')

  const pollForResults = useCallback(async () => {
    const maxAttempts = 60 // 2 minutes max
    let attempts = 0

    const poll = async () => {
      try {
        const response = await fetch(`/api/challenges/1v1/${matchId}/results`)
        const data = await response.json()

        if (!data.analyzing) {
          setStatus('complete')
          router.push(`/challenges/1v1/${matchId}/results`)
          return
        }

        attempts++
        if (attempts < maxAttempts) {
          setTimeout(poll, 2000)
        } else {
          router.push(`/challenges/1v1/${matchId}/results`)
        }
      } catch {
        attempts++
        if (attempts < maxAttempts) {
          setTimeout(poll, 2000)
        }
      }
    }

    poll()
  }, [matchId, router])

  const uploadVideo = useCallback(
    async (videoData: string) => {
      setStatus('uploading')

      try {
        // Convert base64 to blob
        const response = await fetch(videoData)
        const blob = await response.blob()

        // Create FormData
        const formData = new FormData()
        formData.append('video', blob, 'match-video.webm')

        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress((p) => {
            if (p >= 90) {
              clearInterval(progressInterval)
              return 90
            }
            return p + 10
          })
        }, 500)

        // Upload to API
        const uploadResponse = await fetch(`/api/challenges/1v1/${matchId}/upload`, {
          method: 'POST',
          body: formData,
        })

        clearInterval(progressInterval)
        setUploadProgress(100)

        if (!uploadResponse.ok) {
          const data = await uploadResponse.json()
          throw new Error(data.error || 'Upload failed')
        }

        // Clear sessionStorage
        sessionStorage.removeItem('matchVideo')
        sessionStorage.removeItem('matchDuration')

        setStatus('analyzing')

        // Poll for results
        pollForResults()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed')
        setStatus('error')
      }
    },
    [matchId, pollForResults]
  )

  useEffect(() => {
    // Get video from sessionStorage
    const videoData = sessionStorage.getItem('matchVideo')
    const matchDuration = sessionStorage.getItem('matchDuration')

    if (matchDuration) {
      const secs = parseInt(matchDuration)
      const mins = Math.floor(secs / 60)
      const remainingSecs = secs % 60
      setDuration(`${mins}:${remainingSecs.toString().padStart(2, '0')}`)
    }

    if (!videoData) {
      setError('No video found. Please record again.')
      setStatus('error')
      return
    }

    uploadVideo(videoData)
  }, [uploadVideo])

  if (status === 'error') {
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
        <div className="bg-white/10 backdrop-blur rounded-xl border border-white/20 p-6 max-w-sm w-full text-center relative z-10">
          <div className="w-16 h-16 bg-red-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✕</span>
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Upload Failed</h1>
          <p className="text-white/70 mb-6">{error}</p>
          <button
            onClick={() => router.push(`/challenges/1v1/${matchId}/record`)}
            className="w-full py-3 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-lg border border-white/30"
          >
            Record Again
          </button>
        </div>
      </main>
    )
  }

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
      <div className="bg-white/10 backdrop-blur rounded-xl border border-white/20 p-6 md:p-8 max-w-sm w-full relative z-10">
        {/* Video Info */}
        <div className="bg-white/10 rounded-lg p-4 mb-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
            <span className="text-2xl">🎬</span>
          </div>
          <div>
            <p className="font-semibold text-white">Match Recording</p>
            <p className="text-sm text-white/60">Duration: {duration}</p>
          </div>
        </div>

        {/* Status */}
        <div className="text-center mb-6">
          {status === 'uploading' && (
            <>
              <div className="w-16 h-16 mx-auto mb-4 relative">
                <svg className="w-full h-full" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="3"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#facc15"
                    strokeWidth="3"
                    strokeDasharray={`${uploadProgress}, 100`}
                    className="transition-all duration-300"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-white">
                  {uploadProgress}%
                </span>
              </div>
              <h1 className="text-xl font-bold text-white">Uploading...</h1>
              <p className="text-white/70 text-sm mt-1">Please wait</p>
            </>
          )}

          {status === 'analyzing' && (
            <>
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-yellow-400 border-t-transparent" />
              </div>
              <h1 className="text-xl font-bold text-white">Analyzing Match...</h1>
              <p className="text-white/70 text-sm mt-1">
                AI is counting scores. This may take 1-2 minutes.
              </p>
            </>
          )}

          {status === 'complete' && (
            <>
              <div className="w-16 h-16 bg-green-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✓</span>
              </div>
              <h1 className="text-xl font-bold text-white">Analysis Complete!</h1>
              <p className="text-white/70 text-sm mt-1">Redirecting to results...</p>
            </>
          )}

          {status === 'preparing' && (
            <>
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/30 border-t-transparent" />
              </div>
              <h1 className="text-xl font-bold text-white">Preparing...</h1>
            </>
          )}
        </div>

        {/* Info */}
        <div className="bg-blue-500/20 border border-blue-500/40 rounded-lg p-4 text-sm text-blue-300">
          <p className="font-medium mb-1 text-white">What happens next?</p>
          <ul className="space-y-1">
            <li>• AI analyzes the video</li>
            <li>• Scores are calculated</li>
            <li>• Both players can agree or dispute</li>
          </ul>
        </div>
      </div>
    </main>
  )
}
