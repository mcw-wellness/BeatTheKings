'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Logo } from '@/components/layout/Logo'

interface MatchResponse {
  status: string
  recordingBy: string | null
  videoUrl: string | null
  player1: { id: string }
  player2: { id: string }
}

export default function MatchRecordPage(): JSX.Element {
  const router = useRouter()
  const params = useParams()
  const matchId = params.matchId as string

  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const mimeTypeRef = useRef('video/webm')
  const stopFallbackRef = useRef<NodeJS.Timeout | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isRecording, setIsRecording] = useState(false)
  const [isStopping, setIsStopping] = useState(false)
  const [duration, setDuration] = useState(0)
  const [cameraReady, setCameraReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showFileUpload, setShowFileUpload] = useState(false)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')

  // Ensure only recording player stays on this screen
  useEffect(() => {
    let isMounted = true

    const validateRecorder = async () => {
      try {
        const res = await fetch(`/api/challenges/1v1/${matchId}`, { cache: 'no-store' })
        const data = await res.json()
        if (!res.ok || !isMounted) return

        const match = data.match as MatchResponse
        const currentUserId = data.isChallenger ? match.player1.id : match.player2.id

        if (match.status === 'completed' || match.status === 'disputed') {
          router.push(`/challenges/1v1/${matchId}/results`)
          return
        }

        if (match.videoUrl) {
          if (match.recordingBy === currentUserId) {
            router.push(`/challenges/1v1/${matchId}/score`)
          } else {
            router.push(`/challenges/1v1/${matchId}/waiting`)
          }
          return
        }

        if (match.recordingBy && match.recordingBy !== currentUserId) {
          router.push(`/challenges/1v1/${matchId}/waiting`)
        }
      } catch {
        // ignore, camera flow has its own errors
      }
    }

    validateRecorder()
    const interval = setInterval(validateRecorder, 3000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [matchId, router])

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

  const getCameraErrorMessage = (err: unknown): string => {
    if (err instanceof DOMException) {
      switch (err.name) {
        case 'NotAllowedError':
          return 'Camera access denied. Please allow camera access in your browser settings.'
        case 'NotFoundError':
          return 'No camera found on this device.'
        case 'NotReadableError':
          return 'Camera is in use by another app. Close other apps and try again.'
        case 'OverconstrainedError':
          return 'Camera does not support the required settings.'
        default:
          return `Camera error: ${err.message}`
      }
    }
    return 'Unable to access camera.'
  }

  // Initialize camera
  const initCamera = useCallback(async () => {
    // Check for HTTPS (Chrome blocks camera on HTTP except localhost)
    if (
      typeof window !== 'undefined' &&
      window.location.protocol !== 'https:' &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1'
    ) {
      setError('Camera requires a secure connection (HTTPS). Please use HTTPS.')
      setShowFileUpload(true)
      return
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Camera not supported in this browser. Use the file upload option below.')
      setShowFileUpload(true)
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setCameraReady(true)
        setError(null)
        setShowFileUpload(false)
      }
    } catch (err) {
      const message = getCameraErrorMessage(err)
      setError(message)
      setShowFileUpload(true)
    }
  }, [facingMode])

  useEffect(() => {
    initCamera()
    const video = videoRef.current

    return () => {
      if (stopFallbackRef.current) {
        clearTimeout(stopFallbackRef.current)
      }
      if (video?.srcObject) {
        const tracks = (video.srcObject as MediaStream).getTracks()
        tracks.forEach((track) => track.stop())
      }
    }
  }, [initCamera])

  const handleFlipCamera = (): void => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach((track) => track.stop())
    }
    setFacingMode((m) => (m === 'user' ? 'environment' : 'user'))
  }

  const getSupportedMimeType = (): string => {
    const types = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4']
    return types.find((t) => MediaRecorder.isTypeSupported(t)) || 'video/webm'
  }

  const stopPreviewTracks = useCallback((): void => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }
    setCameraReady(false)
  }, [])

  const finalizeRecording = useCallback((): void => {
    if (stopFallbackRef.current) {
      clearTimeout(stopFallbackRef.current)
      stopFallbackRef.current = null
    }

    stopPreviewTracks()

    const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current })
    if (blob.size === 0) {
      setError('Recording failed. Please try again.')
      setIsStopping(false)
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      sessionStorage.setItem('matchVideo', reader.result as string)
      sessionStorage.setItem('matchDuration', duration.toString())
      mediaRecorderRef.current = null
      setIsStopping(false)
      router.push(`/challenges/1v1/${matchId}/upload`)
    }
    reader.readAsDataURL(blob)
  }, [duration, matchId, router, stopPreviewTracks])

  const handleStartRecording = async (): Promise<void> => {
    if (isStopping) return

    const currentStream = videoRef.current?.srcObject as MediaStream | null
    const hasLiveStream = !!currentStream?.getTracks().some((track) => track.readyState === 'live')

    if (!hasLiveStream) {
      await initCamera()
    }

    if (!videoRef.current?.srcObject) {
      setError('Camera is not ready. Please try again.')
      return
    }

    chunksRef.current = []
    const stream = videoRef.current.srcObject as MediaStream
    const mimeType = getSupportedMimeType()
    mimeTypeRef.current = mimeType

    const mediaRecorder = new MediaRecorder(stream, { mimeType })

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data)
      }
    }

    mediaRecorder.onstop = () => {
      finalizeRecording()
    }

    mediaRecorder.start(1000)
    mediaRecorderRef.current = mediaRecorder
    setIsRecording(true)
    setIsStopping(false)
    setDuration(0)
  }

  const handleStopRecording = (): void => {
    if (!mediaRecorderRef.current || !isRecording || isStopping) return

    setIsStopping(true)

    if (mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.requestData()
      mediaRecorderRef.current.stop()
    }

    // Fallback in case onstop is delayed/not fired on some mobile browsers
    stopFallbackRef.current = setTimeout(() => {
      finalizeRecording()
    }, 2500)

    setIsRecording(false)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('video/')) {
      setError('Please select a video file.')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      sessionStorage.setItem('matchVideo', reader.result as string)
      sessionStorage.setItem('matchDuration', '0')
      router.push(`/challenges/1v1/${matchId}/upload`)
    }
    reader.readAsDataURL(file)
  }

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (error) {
    return (
      <main className="h-dvh bg-black flex flex-col items-center justify-center p-4">
        <p className="text-red-400 mb-6 text-center max-w-sm">{error}</p>
        {!showFileUpload && (
          <button
            onClick={initCamera}
            className="px-6 py-3 bg-[#4361EE] text-white rounded-lg mb-3 min-w-[200px]"
          >
            Try Again
          </button>
        )}
        {showFileUpload && (
          <>
            <p className="text-white/60 text-sm mb-4 text-center max-w-xs">
              Record with your camera app, then upload the video here.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              capture="environment"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-yellow-400 text-white font-semibold rounded-lg mb-3 min-w-[200px]"
            >
              Upload Video File
            </button>
            <button
              onClick={initCamera}
              className="px-6 py-3 bg-white/10 text-white rounded-lg mb-3 min-w-[200px] border border-white/20"
            >
              Retry Camera
            </button>
          </>
        )}
        <button onClick={() => router.back()} className="mt-2 text-white/60 underline text-sm">
          Go Back
        </button>
      </main>
    )
  }

  return (
    <main className="h-dvh bg-black relative overflow-hidden">
      <div className="absolute top-3 left-3 z-20">
        <Logo size="sm" linkToHome className="w-10 h-10" />
      </div>
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
        <div className="flex items-center justify-center gap-6">
          {/* Flip Camera */}
          {!isRecording && (
            <button
              onClick={handleFlipCamera}
              className="w-12 h-12 md:w-14 md:h-14 bg-white/20 active:bg-white/30 rounded-full flex items-center justify-center text-white text-xl"
            >
              ↻
            </button>
          )}

          {/* Record/Stop Button */}
          {!isRecording ? (
            <button
              onClick={handleStartRecording}
              disabled={!cameraReady || isStopping}
              className="w-20 h-20 md:w-24 md:h-24 bg-red-500 active:bg-red-600 disabled:bg-gray-500 rounded-full flex items-center justify-center shadow-lg border-4 border-white"
            >
              <span className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-full" />
            </button>
          ) : (
            <button
              onClick={handleStopRecording}
              disabled={isStopping}
              className="w-20 h-20 md:w-24 md:h-24 bg-red-500 active:bg-red-600 disabled:bg-gray-500 rounded-full flex items-center justify-center shadow-lg border-4 border-white animate-pulse"
            >
              {isStopping ? (
                <div className="animate-spin rounded-full h-7 w-7 border-2 border-white border-t-transparent" />
              ) : (
                <span className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-sm" />
              )}
            </button>
          )}

          {/* Spacer for symmetry */}
          {!isRecording && <div className="w-12 h-12 md:w-14 md:h-14" />}
        </div>

        {isRecording && (
          <p className="text-white/70 text-center text-sm mt-4">
            {isStopping ? 'Finalizing recording...' : 'Tap the stop button when the match is over'}
          </p>
        )}
      </div>
    </main>
  )
}
