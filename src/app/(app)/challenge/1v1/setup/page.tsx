'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/layout/Logo';

interface Opponent {
  id: string;
  name: string;
  profilePictureUrl: string;
  winRate: number;
  matchesPlayed: number;
  memberSince: Date;
}

export default function ChallengeSetupPage() {
  const router = useRouter();
  const [opponent, setOpponent] = useState<Opponent | null>(null);

  useEffect(() => {
    const savedOpponent = sessionStorage.getItem('selectedOpponent');
    if (savedOpponent) {
      setOpponent(JSON.parse(savedOpponent));
    } else {
      router.push('/challenge/1v1/opponents');
    }
  }, [router]);

  const handleStartChallenge = async () => {
    if (!opponent) return;

    // Send challenge request
    try {
      await fetch('/api/challenges/1v1/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opponentId: opponent.id,
          venueId: 'venue-1',
          scheduledTime: new Date().toISOString(),
        }),
      });

      // Navigate to verification
      router.push('/challenge/1v1/verify');
    } catch (error) {
      console.error('Failed to send challenge request:', error);
    }
  };

  if (!opponent) return null;

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
              <h1 className="text-xl font-bold text-gray-900">Matched Opponent</h1>
              <p className="text-sm text-gray-500">1v1 Challenge Setup</p>
            </div>
          </div>
          <button
            onClick={() => router.back()}
            className="text-blue-600 text-sm font-medium flex-shrink-0 mt-1"
          >
            ← Back
          </button>
        </div>

        {/* Available Badge */}
        <div className="flex justify-end">
          <span className="px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">
            Available Now
          </span>
        </div>

        {/* Opponent Card */}
        <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
          <div className="flex flex-col items-center text-center">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center overflow-hidden border-4 border-orange-500 mb-4">
              <svg className="w-14 h-14 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>

            {/* Name */}
            <h2 className="text-xl font-bold text-gray-900 mb-1">{opponent.name}</h2>

            {/* Stats */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-gray-600">🏆 Win Rate {opponent.winRate}%</span>
            </div>

            <div className="text-sm text-gray-600">
              🎮 {opponent.matchesPlayed} matches played
            </div>
          </div>
        </div>

        {/* Location Info */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-orange-500 text-xl">📍</span>
            <div>
              <p className="text-xs text-gray-500 mb-1">Location</p>
              <p className="text-sm font-semibold text-gray-900">Venice Beach Courts</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-orange-500 text-xl">⏰</span>
            <div>
              <p className="text-xs text-gray-500 mb-1">Time</p>
              <p className="text-sm font-semibold text-gray-900">Today, 4:30 PM</p>
            </div>
          </div>
        </div>

        {/* Verification Requirements */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-blue-900 mb-2">
            Verification Required:
          </p>
          <p className="text-xs text-blue-800">
            You'll need to confirm your opponent's identity matches the person on court before recording the full match for official scoring.
          </p>
        </div>

        {/* Start Challenge Button */}
        <button
          onClick={handleStartChallenge}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          Start Challenge
        </button>

        {/* Steps Info */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
          <div className="flex items-start gap-2">
            <span className="text-blue-600 font-bold text-sm">Step 1:</span>
            <p className="text-xs text-gray-700">Verify your opponent's profile matches the person on court</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-600 font-bold text-sm">Step 2:</span>
            <p className="text-xs text-gray-700">Record entire match from start to finish</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-purple-600 font-bold text-sm">Step 3:</span>
            <p className="text-xs text-gray-700">Upload recording for AI-powered scoring & verification</p>
          </div>
        </div>
      </div>
    </main>
  );
}
