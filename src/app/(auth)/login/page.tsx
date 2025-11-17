'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Logo } from '@/components/layout/Logo';
import { useAuth } from '@/lib/hooks/useAuth';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Redirect authenticated users to register or welcome page
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      const hasRegistered = localStorage.getItem('user_registered');

      if (hasRegistered === 'true') {
        router.push('/welcome');
      } else {
        router.push('/register');
      }
    }
  }, [isAuthenticated, authLoading, router]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn('google', { redirect: false });
    } catch (error) {
      console.error('Google sign-in error:', error);
      setIsLoading(false);
    }
  };

  const handleMicrosoftSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn('azure-ad', { redirect: false });
    } catch (error) {
      console.error('Microsoft sign-in error:', error);
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-[#F5F5F7] relative">
      {/* Language Selector - Top Right */}
      <div className="absolute top-6 right-6">
        <div className="text-sm font-semibold text-gray-900">
          EN / DE
        </div>
      </div>

      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-64 h-64">
            <Logo size="lg" pulsing />
          </div>
        </div>

        {/* Headline */}
        <div className="text-center space-y-3 mb-10">
          <h1 className="text-5xl font-bold text-gray-900 tracking-tight">
            Rule the Game
          </h1>
          <p className="text-lg text-gray-600">
            Join the ultimate sports competition platform
          </p>
        </div>

        {/* OAuth Sign In Buttons */}
        <div className="space-y-3">
          {/* Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading || authLoading}
            className="w-full bg-white hover:bg-gray-50 text-gray-800 font-semibold py-4 px-6 rounded-lg transition-colors duration-200 text-base border border-gray-300 flex items-center justify-center gap-3 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {isLoading || authLoading ? 'Signing in...' : 'Sign in with Google'}
          </button>

          {/* Microsoft Sign In */}
          <button
            onClick={handleMicrosoftSignIn}
            disabled={isLoading || authLoading}
            className="w-full bg-white hover:bg-gray-50 text-gray-800 font-semibold py-4 px-6 rounded-lg transition-colors duration-200 text-base border border-gray-300 flex items-center justify-center gap-3 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 23 23">
              <path fill="#f35325" d="M1 1h10v10H1z"/>
              <path fill="#81bc06" d="M12 1h10v10H12z"/>
              <path fill="#05a6f0" d="M1 12h10v10H1z"/>
              <path fill="#ffba08" d="M12 12h10v10H12z"/>
            </svg>
            {isLoading || authLoading ? 'Signing in...' : 'Sign in with Microsoft'}
          </button>
        </div>

        {/* Info */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Sign in to get started with Beat the Kingz
        </p>
      </div>
    </main>
  );
}