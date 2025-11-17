import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  pulsing?: boolean;
  className?: string;
}

export function Logo({ size = 'md', pulsing = true, className }: LogoProps) {
  const sizes = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-full h-full',
  };

  return (
    <div
      className={cn(
        'relative flex items-center justify-center',
        sizes[size],
        pulsing && 'animate-pulse',
        className
      )}
    >
      <Image
        src="/logo.png"
        alt="Beat the Kingz"
        fill
        className="object-contain"
        priority
      />
    </div>
  );
}