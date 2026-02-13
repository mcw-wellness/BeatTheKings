'use client'

import Image from 'next/image'

interface AvatarDisplayProps {
  isGenerating: boolean
  isLoadingAvatar: boolean
  previewImage: string | null
  displayAvatarUrl: string | null
}

export function AvatarDisplay({
  isGenerating,
  isLoadingAvatar,
  previewImage,
  displayAvatarUrl,
}: AvatarDisplayProps): JSX.Element {
  return (
    <div className="flex-1 min-h-0 relative flex items-center justify-center px-4 z-10">
      {isGenerating ? (
        <div className="flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/30 border-t-white mb-4" />
          <p className="text-white/60">Generating your avatar...</p>
        </div>
      ) : isLoadingAvatar && !previewImage ? (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/30 border-t-white" />
        </div>
      ) : displayAvatarUrl ? (
        <div className="relative w-full h-full">
          <Image
            src={displayAvatarUrl}
            alt="Your Avatar"
            fill
            className="object-contain"
            priority
            unoptimized
          />
        </div>
      ) : (
        <div className="text-white/40">Loading...</div>
      )}
    </div>
  )
}
