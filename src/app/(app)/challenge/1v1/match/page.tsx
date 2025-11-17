'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/layout/Logo';

interface Opponent {
  id: string;
  name: string;
}

export default function ActiveMatchPage() {
  const router = useRouter();
  const [opponent, setOpponent] = useState<Opponent | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [showEndDialog, setShowEndDialog] = useState(false);

  useEffect(() => {
    const savedOpponent = sessionStorage.getItem('selectedOpponent');
    if (savedOpponent) {
      setOpponent(JSON.parse(savedOpponent));
    }

    // Timer
    const timer = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  const handleEndMatch = () => {
    // Save match duration
    sessionStorage.setItem('matchDuration', seconds.toString());
    router.push('/challenge/1v1/upload');
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
              <h1 className="text-xl font-bold text-gray-900">Active Match</h1>
              <p className="text-sm text-gray-500">Venice Beach Courts</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-red-600 px-3 py-1 rounded-full flex-shrink-0 mt-1">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-xs font-semibold text-white">REC</span>
          </div>
        </div>

        {/* Players Card */}
        <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-center gap-8">
            {/* Player 1 */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-400 flex items-center justify-center mb-2">
                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
              <p className="text-xs font-bold text-gray-900">You</p>
              <span className="inline-block px-2 py-1 bg-blue-500 text-white text-xs font-semibold rounded mt-1">
                Player 1
              </span>
            </div>

            {/* VS */}
            <div className="text-xl font-bold text-gray-400">VS</div>

            {/* Player 2 */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center mb-2">
                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
              <p className="text-xs font-bold text-gray-900">{opponent.name}</p>
              <span className="inline-block px-2 py-1 bg-orange-500 text-white text-xs font-semibold rounded mt-1">
                Player 2
              </span>
            </div>
          </div>
        </div>

        {/* Recording Status */}
        <div className="bg-red-100 border-2 border-red-300 rounded-xl p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
            <p className="text-sm font-semibold text-red-900">Recording in Progress</p>
          </div>

          {/* Timer */}
          <div className="text-4xl font-bold text-red-900 mb-1">
            {formatTime(seconds)}
          </div>
          <p className="text-xs text-red-700">Match duration</p>

          <div className="mt-4 pt-4 border-t border-red-200">
            <p className="text-xs text-red-800">
              Keep recording until the match is completely finished. Stop recording only after the final point is scored.
            </p>
          </div>
        </div>

        {/* Stop Recording Button */}
        <button
          onClick={() => setShowEndDialog(true)}
          className="w-full bg-white border-2 border-red-300 hover:bg-red-50 text-red-600 font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          Stop Recording
        </button>

        {/* AI Verification Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-blue-900 mb-2">
            AI Verification:
          </p>
          <p className="text-xs text-blue-800">
            After upload, our system will analyze the recording to verify players, count points, and determine the winner. This usually takes 1-2 minutes.
          </p>
        </div>

        {/* Match Complete Dialog */}
        {showEndDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 max-w-sm w-full">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Match Complete?</h3>
              <p className="text-sm text-gray-600 mb-6">
                Confirm that the match has ended and recording captured all points.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowEndDialog(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                  Continue Recording
                </button>
                <button
                  onClick={handleEndMatch}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                  End Match
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
