'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/layout/Logo';

interface Opponent {
  id: string;
  name: string;
  memberSince: Date;
}

export default function PlayerVerificationPage() {
  const router = useRouter();
  const [opponent, setOpponent] = useState<Opponent | null>(null);

  useEffect(() => {
    const savedOpponent = sessionStorage.getItem('selectedOpponent');
    if (savedOpponent) {
      setOpponent(JSON.parse(savedOpponent));
    }
  }, []);

  if (!opponent) return null;

  const memberDate = new Date(opponent.memberSince).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <main className="min-h-screen bg-white">
      <div className="w-full max-w-4xl mx-auto p-4 md:p-8 space-y-4">
        {/* Header with Logo */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-start gap-2">
            <div className="w-12 h-12 flex-shrink-0">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Player Verification</h1>
              <p className="text-sm text-gray-500">Confirm your opponent's identity</p>
            </div>
          </div>
          <button
            onClick={() => router.back()}
            className="text-blue-600 text-sm font-medium flex-shrink-0 mt-1"
          >
            ← Back
          </button>
        </div>

        {/* Warning Banner */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
          <div className="flex items-start gap-2">
            <span className="text-yellow-600 text-xl">⚠️</span>
            <p className="text-xs text-yellow-800">
              This step prevents fraud and ensures fair play. Both players must verify each other.
            </p>
          </div>
        </div>

        {/* Expected Opponent Card */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Expected Opponent</h2>

          <div className="flex items-center gap-4 mb-4">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center overflow-hidden border-4 border-blue-500">
              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>

            {/* Info */}
            <div className="flex-1">
              <h3 className="font-bold text-lg text-gray-900">{opponent.name}</h3>
              <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded mt-1">
                Verified Player
              </span>
              <p className="text-xs text-gray-500 mt-1">Member since {memberDate}</p>
            </div>
          </div>

          {/* Verification Checklist */}
          <div className="space-y-3 mt-6">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
              </div>
              <p className="text-sm text-gray-700">
                Check the profile photo matches the person in front of you
              </p>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
              </div>
              <p className="text-sm text-gray-700">
                Verify their name verbally
              </p>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
              </div>
              <p className="text-sm text-gray-700">
                Take a quick photo of both players on court for timestamped proof
              </p>
            </div>
          </div>
        </div>

        {/* Continue Button */}
        <button
          onClick={() => router.push('/challenge/1v1/photo')}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          Continue to Photo Verification
        </button>
      </div>
    </main>
  );
}
