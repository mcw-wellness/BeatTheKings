'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { Logo } from '@/components/layout/Logo'
import { logger } from '@/lib/utils/logger'

export default function PhotoPage(): JSX.Element {
  return (
    <Suspense fallback={<PhotoPageSkeleton />}>
      <PhotoPageContent />
    </Suspense>
  )
}

function PhotoPageSkeleton(): JSX.Element {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-transparent">
      <div className="w-full max-w-md space-y-6 animate-pulse">
        <div className="flex justify-center">
          <div className="w-32 h-32 bg-white/10 rounded-full" />
        </div>
        <div className="space-y-3">
          <div className="h-8 bg-white/10 rounded w-3/4 mx-auto" />
          <div className="h-4 bg-white/10 rounded w-1/2 mx-auto" />
        </div>
        <div className="h-64 bg-white/10 rounded-xl" />
      </div>
    </main>
  )
}

type ProcessingStep = 'idle' | 'uploading' | 'analyzing' | 'generating' | 'done'

function PhotoPageContent(): JSX.Element {
  const router = useRouter()
  const { status, update } = useSession()
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [processingStep, setProcessingStep] = useState<ProcessingStep>('idle')
  const [error, setError] = useState<string | null>(null)

  const isProcessing = processingStep !== 'idle' && processingStep !== 'done'

  const getStepMessage = (): string => {
    switch (processingStep) {
      case 'uploading':
        return 'Uploading photo...'
      case 'analyzing':
        return 'Analyzing your features...'
      case 'generating':
        return 'Creating your avatar...'
      default:
        return 'Confirm'
    }
  }

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Validate file type
      if (!selectedFile.type.startsWith('image/')) {
        setError('Please select an image file')
        return
      }
      // Validate file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('Image must be less than 5MB')
        return
      }

      setError(null)
      setFile(selectedFile)

      // Create preview URL
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(selectedFile)
    }
  }

  const handleRetake = (): void => {
    setPreview(null)
    setFile(null)
    setError(null)
  }

  const handleConfirm = async (): Promise<void> => {
    if (!file || !preview) return

    setError(null)

    try {
      // Step 1: Upload photo
      setProcessingStep('uploading')

      // Small delay to show the uploading state
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Step 2: Analyzing (happens on server)
      setProcessingStep('analyzing')

      // Step 3: Generating avatar (happens on server)
      setTimeout(() => {
        if (processingStep === 'analyzing') {
          setProcessingStep('generating')
        }
      }, 2000)

      // Call API which handles upload, analyze, and generate
      const res = await fetch('/api/users/profile-picture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: preview,
          contentType: file.type,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to process photo')
      }

      setProcessingStep('done')

      // Refresh session to get updated flags
      await update()

      // Success - redirect to avatar page (avatar already created)
      router.push('/avatar')
    } catch (err) {
      logger.error({ error: err }, 'Failed to process photo')
      setError(err instanceof Error ? err.message : 'Failed to process photo. Please try again.')
      setProcessingStep('idle')
    }
  }

  if (status === 'loading') {
    return <PhotoPageSkeleton />
  }

  if (status === 'unauthenticated') {
    return <PhotoPageSkeleton />
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 bg-transparent">
      <div className="w-full max-w-sm sm:max-w-md space-y-6">
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <div className="w-32 h-32 sm:w-40 sm:h-40">
            <Logo size="lg" pulsing={!preview} />
          </div>
        </div>

        {/* Headline */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Add Your Photo</h1>
          <p className="text-sm sm:text-base text-white/60">
            Show your game face to the competition!
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div
            className="bg-red-500/20 border border-red-500/30 text-red-200 px-4 py-3 rounded-lg text-sm"
            role="alert"
          >
            {error}
          </div>
        )}

        {/* Photo Upload */}
        <div className="space-y-6">
          {!preview ? (
            <>
              {/* Upload area - circular like old layout */}
              <div className="flex justify-center">
                <div className="relative w-48 h-48 sm:w-56 sm:h-56">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label
                    htmlFor="photo-upload"
                    className="cursor-pointer w-full h-full rounded-full border-2 border-white/30 bg-white/5 flex items-center justify-center hover:border-white/50 hover:bg-white/10 transition-all"
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <svg
                        className="w-16 h-16 sm:w-20 sm:h-20 text-white/60"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </div>
                  </label>
                </div>
              </div>

              {/* Upload text */}
              <p className="text-center text-sm text-white/70 font-medium">
                Click to upload or take a photo
              </p>
            </>
          ) : (
            <>
              {/* Preview - circular */}
              <div className="flex justify-center">
                <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-full overflow-hidden border-2 border-white/30">
                  <Image
                    src={preview}
                    alt="Profile preview"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              </div>

              {/* Actions */}
              {isProcessing ? (
                <div className="space-y-4">
                  <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-white/30 border-t-white" />
                    <p className="text-white font-medium">{getStepMessage()}</p>
                  </div>
                  <div className="flex justify-center gap-2">
                    {['uploading', 'analyzing', 'generating'].map((step, index) => (
                      <div
                        key={step}
                        className={`w-2 h-2 rounded-full transition-all ${
                          processingStep === step
                            ? 'bg-white scale-125'
                            : index <
                                ['uploading', 'analyzing', 'generating'].indexOf(processingStep)
                              ? 'bg-white/60'
                              : 'bg-white/20'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={handleRetake}
                    className="px-6 py-3 border border-white/30 text-white font-semibold rounded-lg hover:bg-white/10 transition-colors"
                  >
                    Retake
                  </button>
                  <button
                    onClick={handleConfirm}
                    className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-lg transition-all border border-white/30"
                  >
                    Confirm
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Info */}
        <p className="text-center text-sm sm:text-base text-white/50 pt-4">
          Your photo helps other players recognize you on the court
        </p>
      </div>
    </main>
  )
}
