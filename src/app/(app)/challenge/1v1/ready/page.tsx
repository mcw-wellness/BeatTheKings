'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Logo } from '@/components/layout/Logo';

interface Opponent {
  id: string;
  name: string;
}

export default function ReadyToRecordPage() {
  const router = useRouter();
  const { user } = useApp();
  const [opponent, setOpponent] = useState<Opponent | null>(null);

  useEffect(() => {
    const savedOpponent = sessionStorage.getItem('selectedOpponent');
    if (savedOpponent) {
      setOpponent(JSON.parse(savedOpponent));
    }
  }, []);

  if (!opponent) return null;

  return (
    <main className="min-h-screen bg-white">
      <div className="w-full max-w-4xl mx-auto p-4 md:p-8 space-y-6">
        {/* Header with Logo */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-start gap-2">
            <div className="w-12 h-12 flex-shrink-0">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Ready to Record</h1>
              <p className="text-sm text-gray-500">Venice Beach Courts</p>
            </div>
          </div>
          <button
            onClick={() => router.back()}
            className="text-blue-600 text-sm font-medium flex-shrink-0 mt-1"
          >
            ← Back
          </button>
        </div>

        {/* Players Card */}
        <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-center gap-8 mb-6">
            {/* Player 1 (You) */}
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-400 flex items-center justify-center mb-2">
                <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
              <p className="text-sm font-bold text-gray-900">You</p>
              <span className="inline-block px-2 py-1 bg-blue-500 text-white text-xs font-semibold rounded mt-1">
                Player 1
              </span>
            </div>

            {/* VS */}
            <div className="text-2xl font-bold text-gray-400">VS</div>

            {/* Player 2 (Opponent) */}
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center mb-2">
                <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
              <p className="text-sm font-bold text-gray-900">{opponent.name}</p>
              <span className="inline-block px-2 py-1 bg-orange-500 text-white text-xs font-semibold rounded mt-1">
                Player 2
              </span>
            </div>
          </div>
        </div>

        {/* Recording Instructions */}
        <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4 6h2v12H4zm4 0h2v12H8zm4 0h2v12h-2zm4 0h2v12h-2z"/>
                <circle cx="12" cy="12" r="8" fill="currentColor"/>
              </svg>
            </div>
          </div>

          <h2 className="text-lg font-bold text-center text-gray-900 mb-2">Ready to Record</h2>
          <p className="text-sm text-center text-gray-600 mb-6">
            Start recording before the match begins
          </p>

          {/* Important Notice */}
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg mb-4">
            <div className="flex items-start gap-2">
              <span className="text-yellow-600 text-xl">⚠️</span>
              <div>
                <p className="text-xs font-semibold text-yellow-900 mb-1">Important:</p>
                <p className="text-xs text-yellow-800">
                  Record the entire match from first point to final point. Incomplete recordings cannot be verified.
                </p>
              </div>
            </div>
          </div>

          {/* Recording Tips */}
          <div className="space-y-2 text-xs text-gray-700">
            <div className="flex items-start gap-2">
              <span>•</span>
              <p>Position camera to capture full court</p>
            </div>
            <div className="flex items-start gap-2">
              <span>•</span>
              <p>Keep phone stable or use a tripod</p>
            </div>
            <div className="flex items-start gap-2">
              <span>•</span>
              <p>Ensure both players are visible</p>
            </div>
          </div>
        </div>

        {/* Start Recording Button */}
        <button
          onClick={() => router.push('/challenge/1v1/match')}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="8"/>
          </svg>
          Start Recording
        </button>
      </div>
    </main>
  );
}
