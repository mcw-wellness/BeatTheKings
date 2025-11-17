'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/layout/Logo';

interface Opponent {
  id: string;
  name: string;
}

export default function MatchResultsPage() {
  const router = useRouter();
  const [opponent, setOpponent] = useState<Opponent | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const savedOpponent = sessionStorage.getItem('selectedOpponent');
    if (savedOpponent) {
      setOpponent(JSON.parse(savedOpponent));
    }

    // Simulate AI processing
    const timer = setTimeout(() => {
      setIsProcessing(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleFinish = () => {
    // Clear session storage
    sessionStorage.removeItem('selectedOpponent');
    sessionStorage.removeItem('matchDuration');

    // Navigate back to challenges
    router.push('/challenges');
  };

  if (!opponent) return null;

  if (isProcessing) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-full max-w-md mx-auto p-4">
          <div className="bg-white border-2 border-gray-200 rounded-xl p-8 text-center">
            <div className="mb-6">
              <svg className="animate-spin h-16 w-16 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Analyzing Recording...</h2>
            <p className="text-sm text-gray-600">
              Our AI is verifying players and tracking points. This will take about 1-2 minutes.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="w-full max-w-4xl mx-auto p-4 md:p-8 space-y-6">
        {/* Header with Logo */}
        <div className="flex items-start justify-center mb-2">
          <div className="flex items-start gap-2">
            <div className="w-12 h-12 flex-shrink-0">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Match Results</h1>
              <p className="text-sm text-gray-500">1v1 Challenge Complete</p>
            </div>
          </div>
        </div>

        {/* Winner Card */}
        <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Victory!</h2>
            <p className="text-sm text-gray-600">You won the match</p>
          </div>

          {/* Match Summary */}
          <div className="space-y-4">
            {/* You */}
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border-2 border-green-500">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-400 flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-gray-900">You</p>
                  <span className="text-xs px-2 py-1 bg-green-500 text-white rounded font-semibold">WINNER</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">11</p>
                <p className="text-xs text-gray-600">Points</p>
              </div>
            </div>

            {/* Opponent */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-gray-900">{opponent.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-600">7</p>
                <p className="text-xs text-gray-600">Points</p>
              </div>
            </div>
          </div>
        </div>

        {/* XP Earned */}
        <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">XP Earned</p>
            <p className="text-4xl font-bold text-green-600 mb-1">+100</p>
            <p className="text-xs text-gray-500">Victory Bonus: +50 XP</p>
          </div>
        </div>

        {/* Match Stats */}
        <div className="bg-white rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-900 mb-3">Match Stats:</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-600 mb-1">Duration</p>
              <p className="text-sm font-bold text-gray-900">12m 34s</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-600 mb-1">Location</p>
              <p className="text-sm font-bold text-gray-900">Venice Beach</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-600 mb-1">Shots Made</p>
              <p className="text-sm font-bold text-gray-900">11/18</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-600 mb-1">Accuracy</p>
              <p className="text-sm font-bold text-gray-900">61%</p>
            </div>
          </div>
        </div>

        {/* Finish Button */}
        <button
          onClick={handleFinish}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          Back to Challenges
        </button>
      </div>
    </main>
  );
}
