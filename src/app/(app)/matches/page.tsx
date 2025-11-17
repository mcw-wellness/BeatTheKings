'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';

interface Match {
  id: string;
  opponentName: string;
  opponentId: string;
  venue: string;
  date: Date;
  status: 'pending' | 'verified' | 'disputed';
  result?: {
    winner: 'you' | 'opponent';
    yourScore: number;
    opponentScore: number;
    xpEarned: number;
  };
  canDispute: boolean;
}

export default function MatchesPage() {
  const router = useRouter();
  const { user } = useApp();
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'disputed'>('all');

  useEffect(() => {
    // Fetch matches
    fetch('/api/matches')
      .then(res => res.json())
      .then(data => setMatches(data))
      .catch(err => console.error('Failed to fetch matches:', err))
      .finally(() => setIsLoading(false));
  }, []);

  const handleDispute = (matchId: string) => {
    router.push(`/matches/${matchId}/dispute`);
  };

  const handleViewDetails = (matchId: string) => {
    router.push(`/matches/${matchId}`);
  };

  const filteredMatches = filter === 'all'
    ? matches
    : matches.filter(m => m.status === filter);

  const getStatusBadge = (status: Match['status']) => {
    if (status === 'pending') {
      return (
        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded">
          ⏳ Verifying
        </span>
      );
    }
    if (status === 'disputed') {
      return (
        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded">
          ⚠️ Disputed
        </span>
      );
    }
    return (
      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
        ✓ Verified
      </span>
    );
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
              <h1 className="text-xl font-bold text-gray-900">My Matches</h1>
              <p className="text-sm text-gray-500">1v1 Challenge History</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/welcome')}
            className="text-blue-600 text-sm font-medium flex-shrink-0 mt-1"
          >
            ← Back
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {[
            { id: 'all', label: 'All' },
            { id: 'pending', label: 'Pending' },
            { id: 'verified', label: 'Verified' },
            { id: 'disputed', label: 'Disputed' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                filter === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Matches List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading matches...</div>
          ) : filteredMatches.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">
                {filter === 'all' ? 'No matches yet' : `No ${filter} matches`}
              </p>
              <button
                onClick={() => router.push('/challenges')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Start a Challenge
              </button>
            </div>
          ) : (
            filteredMatches.map((match) => (
              <div
                key={match.id}
                className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-900">vs {match.opponentName}</h3>
                      {getStatusBadge(match.status)}
                    </div>
                    <p className="text-xs text-gray-500">
                      📍 {match.venue} • {new Date(match.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>

                {/* Match Result */}
                {match.result && match.status === 'verified' && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Result</p>
                        <p className="text-sm font-bold text-gray-900">
                          You {match.result.yourScore} - {match.result.opponentScore} {match.opponentName}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-600 mb-1">XP</p>
                        <p className={`text-lg font-bold ${
                          match.result.winner === 'you' ? 'text-green-600' : 'text-gray-600'
                        }`}>
                          {match.result.winner === 'you' ? '+' : ''}{match.result.xpEarned}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Pending Status */}
                {match.status === 'pending' && (
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-3">
                    <p className="text-xs text-yellow-800">
                      AI is currently verifying the match recording. This usually takes 1-2 minutes.
                    </p>
                  </div>
                )}

                {/* Disputed Status */}
                {match.status === 'disputed' && (
                  <div className="bg-red-50 border-l-4 border-red-400 p-3 mb-3">
                    <p className="text-xs text-red-800">
                      This match is under review. Our team will resolve the dispute within 24 hours.
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewDetails(match.id)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors text-sm"
                  >
                    View Details
                  </button>
                  {match.status === 'verified' && match.canDispute && (
                    <button
                      onClick={() => handleDispute(match.id)}
                      className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 font-medium py-2 px-4 rounded-lg transition-colors text-sm"
                    >
                      Dispute Result
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
