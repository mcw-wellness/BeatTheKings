import React from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  pulsing?: boolean
  className?: string
}

/**
 * Logo component with size variants:
 * - sm: Simple BTK text logo (logo1) - for headers
 * - md: Illustrated logo without text (logo3) - for medium displays
 * - lg: Full illustrated logo with text (logo2) - for login/splash pages
 */
export function Logo({ size = 'md', pulsing = false, className }: LogoProps) {
  const sizes = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-full h-full',
  }

  // Select logo based on size
  const logoSrc = {
    sm: '/logos/logo1.jpeg', // Simple text logo for headers
    md: '/logos/logo3.jpeg', // Illustrated without text for medium
    lg: '/logos/logo2.jpeg', // Full illustrated with text for large
  }

  // Rounded corners to match logo shape (logo2/logo3 have app-icon style rounded corners)
  const roundedClass = {
    sm: '', // logo1 is text on white, no rounding needed
    md: 'rounded-[20%] overflow-hidden',
    lg: 'rounded-[20%] overflow-hidden',
  }

  return (
    <div
      className={cn(
        'relative flex items-center justify-center',
        sizes[size],
        roundedClass[size],
        pulsing && 'animate-pulse',
        className
      )}
    >
      <Image src={logoSrc[size]} alt="Beat the Kingz" fill className="object-contain" priority />
    </div>
  )
}
