'use client';

import { signOut } from 'next-auth/react';
import { Button } from './ui/Button';

interface SignOutButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export function SignOutButton({ className, children }: SignOutButtonProps) {
  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <Button onClick={handleSignOut} className={className} variant="outline">
      {children || 'Sign Out'}
    </Button>
  );
}
