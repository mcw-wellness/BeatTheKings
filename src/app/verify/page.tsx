'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/Logo';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useApp } from '@/context/AppContext';

export default function VerifyPage() {
  const router = useRouter();
  const { user } = useApp();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!code) {
      setError('Please enter the verification code');
      return;
    }

    if (code.length !== 6) {
      setError('Verification code must be 6 digits');
      return;
    }

    setError('');
    setIsLoading(true);

    // Mock: Accept any 6-digit code
    setTimeout(() => {
      router.push('/register');
    }, 800);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <Logo size="lg" pulsing />
        </div>

        {/* Headline */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">
            Check Your Email
          </h1>
          <p className="text-gray-600">
            We sent a verification code to<br />
            <span className="font-medium">{user.email}</span>
          </p>
        </div>

        {/* Code Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="text"
            placeholder="000000"
            value={code}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '').slice(0, 6);
              setCode(value);
            }}
            error={error}
            disabled={isLoading}
            maxLength={6}
            className="text-center text-2xl tracking-widest font-mono"
          />

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || code.length !== 6}
          >
            {isLoading ? 'Verifying...' : 'Verify'}
          </Button>
        </form>

        {/* Resend */}
        <div className="text-center">
          <button
            className="text-sm text-blue-600 hover:underline"
            onClick={() => alert('Code resent! (Mock)')}
          >
            Didn't receive the code? Resend
          </button>
        </div>
      </div>
    </main>
  );
}