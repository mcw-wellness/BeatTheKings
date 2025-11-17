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
  ageGroup: string;
  location: string;
  isAvailable: boolean;
  memberSince: Date;
}

export default function SelectOpponentPage() {
  const router = useRouter();
  const [opponents, setOpponents] = useState<Opponent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/challenges/available-opponents?sport=basketball')
      .then(res => res.json())
      .then(data => setOpponents(data))
      .catch(err => console.error('Failed to fetch opponents:', err))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSelectOpponent = (opponentId: string) => {
    // Store selected opponent in sessionStorage
    const opponent = opponents.find(o => o.id === opponentId);
    if (opponent) {
      sessionStorage.setItem('selectedOpponent', JSON.stringify(opponent));
      router.push('/challenge/1v1/setup');
    }
  };

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
              <h1 className="text-xl font-bold text-gray-900">Select Opponent</h1>
              <p className="text-sm text-gray-500">1v1 Challenge</p>
            </div>
          </div>
          <button
            onClick={() => router.back()}
            className="text-blue-600 text-sm font-medium flex-shrink-0 mt-1"
          >
            ← Back
          </button>
        </div>

        {/* Matched Opponent Badge */}
        <div className="flex justify-end">
          <span className="px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">
            Available Now
          </span>
        </div>

        {/* Opponents List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading opponents...</div>
          ) : opponents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No opponents available</div>
          ) : (
            opponents.map((opponent) => (
              <div
                key={opponent.id}
                onClick={() => handleSelectOpponent(opponent.id)}
                className="bg-white border-2 border-gray-200 hover:border-blue-500 rounded-xl p-4 cursor-pointer transition-all"
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex-shrink-0 flex items-center justify-center overflow-hidden border-4 border-orange-500">
                    <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>

                  {/* Player Info */}
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900">{opponent.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-600">🏆 Win Rate: {opponent.winRate}%</span>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      🎮 {opponent.matchesPlayed} matches played
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <span>📍</span>
                      <span>{opponent.location?.split(',')[0]}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>⏰</span>
                      <span>Available Now</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
