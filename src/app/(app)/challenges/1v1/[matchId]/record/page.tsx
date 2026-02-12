'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function MatchRecordPage(): JSX.Element {
  const router = useRouter()
  const params = useParams()
  const matchId = params.matchId as string

  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const [isRecording, setIsRecording] = useState(false)
  const [duration, setDuration] = useState(0)
  const [cameraReady, setCameraReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRecording) {
      interval = setInterval(() => {
        setDuration((d) => d + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRecording])

  // Initialize camera
  const initCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setCameraReady(true)
        setError(null)
      }
    } catch (err) {
      console.error('Camera error:', err)
      setError('Unable to access camera. Please grant permission.')
    }
  }, [facingMode])

  useEffect(() => {
    initCamera()
    const video = videoRef.current

    return () => {
      // Cleanup camera
      if (video?.srcObject) {
        const tracks = (video.srcObject as MediaStream).getTracks()
        tracks.forEach((track) => track.stop())
      }
    }
  }, [initCamera])

  const handleFlipCamera = async () => {
    // Stop current stream
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach((track) => track.stop())
    }
    setFacingMode((m) => (m === 'user' ? 'environment' : 'user'))
  }

  const handleStartRecording = () => {
    if (!videoRef.current?.srcObject) return

    chunksRef.current = []
    const stream = videoRef.current.srcObject as MediaStream

    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9',
    })

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data)
      }
    }

    mediaRecorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' })
      // Store in sessionStorage as base64 for upload page
      const reader = new FileReader()
      reader.onloadend = () => {
        sessionStorage.setItem('matchVideo', reader.result as string)
        sessionStorage.setItem('matchDuration', duration.toString())
        router.push(`/challenges/1v1/${matchId}/upload`)
      }
      reader.readAsDataURL(blob)
    }

    mediaRecorder.start(1000) // Collect data every second
    mediaRecorderRef.current = mediaRecorder
    setIsRecording(true)
    setDuration(0)
  }

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)

      // Stop camera
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
        tracks.forEach((track) => track.stop())
      }
    }
  }

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (error) {
    return (
      <main className="h-dvh bg-black flex flex-col items-center justify-center p-4">
        <p className="text-red-500 mb-4 text-center">{error}</p>
        <button onClick={initCamera} className="px-6 py-3 bg-[#4361EE] text-white rounded-lg">
          Try Again
        </button>
        <button onClick={() => router.back()} className="mt-4 text-white underline">
          Go Back
        </button>
      </main>
    )
  }

  return (
    <main className="h-dvh bg-black relative overflow-hidden">
      {/* Video Preview */}
      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />

      {/* Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent">
          {isRecording && (
            <div className="flex items-center gap-2 bg-red-600 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span className="text-white text-sm font-medium">REC</span>
            </div>
          )}
          <div className="text-white text-2xl md:text-3xl font-mono font-bold ml-auto">
            {formatDuration(duration)}
          </div>
        </div>

        {/* Center Guide */}
        {!isRecording && cameraReady && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="border-2 border-white/50 border-dashed rounded-lg w-4/5 h-2/3 flex items-center justify-center">
              <p className="text-white/70 text-center px-4">Position both players in frame</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-black/80 to-transparent">
        <div className="max-w-lg mx-auto flex items-center justify-center gap-6">
          {/* Flip Camera */}
          {!isRecording && (
            <button
              onClick={handleFlipCamera}
              className="w-12 h-12 md:w-14 md:h-14 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white text-xl"
            >
              ↻
            </button>
          )}

          {/* Record/Stop Button */}
          {!isRecording ? (
            <button
              onClick={handleStartRecording}
              disabled={!cameraReady}
              className="w-20 h-20 md:w-24 md:h-24 bg-red-500 hover:bg-red-600 disabled:bg-gray-500 rounded-full flex items-center justify-center shadow-lg border-4 border-white"
            >
              <span className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-full" />
            </button>
          ) : (
            <button
              onClick={handleStopRecording}
              className="w-20 h-20 md:w-24 md:h-24 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg border-4 border-white animate-pulse"
            >
              <span className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-sm" />
            </button>
          )}

          {/* Spacer for symmetry */}
          {!isRecording && <div className="w-12 h-12 md:w-14 md:h-14" />}
        </div>

        {isRecording && (
          <p className="text-white/70 text-center text-sm mt-4">
            Tap the stop button when the match is over
          </p>
        )}
      </div>
    </main>
  )
}
