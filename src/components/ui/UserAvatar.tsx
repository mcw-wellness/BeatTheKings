'use client'

import Image from 'next/image'
import { useAvatarUrlWithLoading } from '@/lib/hooks/useAvatarUrl'

interface UserAvatarProps {
  size?: 'sm' | 'md' | 'lg'
  showXp?: boolean
  xpAmount?: number
}

const sizeClasses = {
  sm: 'w-12 h-12',
  md: 'w-16 h-16',
  lg: 'w-16 h-20',
}

export function UserAvatar({
  size = 'md',
  showXp = false,
  xpAmount = 150,
}: UserAvatarProps): JSX.Element {
  const { url, isLoading } = useAvatarUrlWithLoading({})
  const sizeClass = sizeClasses[size]
  const dimension =
    size === 'lg' ? { w: 64, h: 80 } : size === 'sm' ? { w: 48, h: 48 } : { w: 64, h: 64 }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center">
        <div className={`${sizeClass} rounded-lg bg-white/10 flex items-center justify-center`}>
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
        </div>
        {showXp && <span className="text-xs text-green-400 mt-1">+{xpAmount} XP</span>}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center">
      <div className={`${sizeClass} rounded-lg overflow-hidden bg-white/10`}>
        {url ? (
          <Image
            src={url}
            alt="You"
            width={dimension.w}
            height={dimension.h}
            className="w-full h-full object-cover object-top"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl">👤</div>
        )}
      </div>
      {showXp && <span className="text-xs text-green-400 mt-1">+{xpAmount} XP</span>}
    </div>
  )
}
