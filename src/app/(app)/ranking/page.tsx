'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/layout/Logo';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useApp } from '@/context/AppContext';
import { mockMonthlyChallenge, mockVenues } from '@/lib/mockData';
import { formatXP } from '@/lib/utils';

interface RankingPlayer {
  rank: number;
  userId: string;
  name: string;
  ageGroup: string;
  totalXp: number;
  totalChallenges: number;
  location?: string;
}

export default function RankingPage() {
  const router = useRouter();
  const { selectedSport, user } = useApp();
  const [tab, setTab] = useState<'venue' | 'city' | 'country'>('venue');
  const [selectedVenue, setSelectedVenue] = useState(mockVenues[0]);
  const [players, setPlayers] = useState<RankingPlayer[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const tabs = [
    { id: 'venue', label: 'Venue' },
    { id: 'city', label: 'City' },
    { id: 'country', label: 'Country' },
  ];

  const ageGroup = user?.ageGroup || '14-16';
  const userCity = user?.location?.split(',')[0]?.trim() || 'Vienna';

  // Fetch rankings when tab or selections change
  useEffect(() => {
    fetchRankings();
  }, [tab, selectedSport, selectedVenue]);

  const fetchRankings = async () => {
    setIsLoading(true);
    try {
      let url = '';

      if (tab === 'country') {
        url = `/api/rankings/country?sport=${selectedSport}`;
      } else if (tab === 'city') {
        url = `/api/rankings/city/${encodeURIComponent(userCity)}?sport=${selectedSport}`;
      } else if (tab === 'venue') {
        const response = await fetch(`/api/rankings/venue/${selectedVenue.id}?sport=${selectedSport}`);
        const data = await response.json();
        setPlayers(data.players || []);
        setIsLoading(false);
        return;
      }

      const response = await fetch(url);
      const data = await response.json();
      setPlayers(data);
    } catch (error) {
      console.error('Failed to fetch rankings:', error);
      setPlayers([]);
    } finally {
      setIsLoading(false);
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
              <h1 className="text-xl font-bold text-gray-900">Rankings</h1>
              <p className="text-sm text-gray-500">Age Group: {ageGroup}</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/welcome')}
            className="text-blue-600 text-sm font-medium flex-shrink-0 mt-1"
          >
            ← Back
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                tab === t.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Venue Selector */}
        {tab === 'venue' && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Select Venue
            </label>
            <select
              value={selectedVenue.id}
              onChange={(e) => {
                const venue = mockVenues.find(v => v.id === e.target.value);
                if (venue) setSelectedVenue(venue);
              }}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none bg-white text-sm"
            >
              {mockVenues
                .filter(v => v.sportType === selectedSport)
                .map(v => (
                  <option key={v.id} value={v.id}>
                    {v.name} - {v.city}
                  </option>
                ))}
            </select>
          </div>
        )}

        {/* City Tab - Show user's city (no dropdown) */}
        {tab === 'city' && (
          <div>
            <p className="text-sm text-gray-600">
              Showing rankings for <span className="font-semibold">{userCity}</span>
            </p>
          </div>
        )}

        {/* Country Tab - No selector needed */}

        {/* Top 10 Rankings */}
        <div>
          <h2 className="text-base font-bold mb-3 text-gray-900">
            {tab === 'venue' && `Top 10 - ${selectedVenue.name}`}
            {tab === 'city' && `Top 10 - ${userCity}`}
            {tab === 'country' && `Top 10 - Austria`}
          </h2>

          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading rankings...</div>
          ) : players.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No rankings available</div>
          ) : (
            <div className="space-y-2">
              {players.map((player, index) => (
                <div
                  key={player.userId}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-yellow-400 text-white' :
                      index === 1 ? 'bg-gray-300 text-gray-700' :
                      index === 2 ? 'bg-orange-400 text-white' :
                      'bg-white text-gray-600 border border-gray-200'
                    }`}>
                      #{player.rank}
                    </div>
                    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="font-bold text-sm text-gray-900">{player.name}</p>
                      <p className="text-xs text-gray-500">Age Group: {player.ageGroup}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-blue-600">{formatXP(player.totalXp)}</p>
                    <p className="text-xs text-gray-500">{player.totalChallenges} challenges</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Monthly Challenge */}
        <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl p-5 text-white">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">🏆</span>
            <h2 className="text-base font-bold">{mockMonthlyChallenge.title}</h2>
          </div>
          <p className="text-xs mb-3 text-purple-50 leading-relaxed">{mockMonthlyChallenge.description}</p>
          <div className="inline-block bg-purple-700 bg-opacity-60 text-white px-3 py-1 rounded-full text-xs font-medium mb-3">
            Prize: {mockMonthlyChallenge.prizeDescription}
          </div>
          <div>
            <button className="bg-white text-purple-600 px-5 py-2 rounded-lg text-xs font-bold hover:bg-purple-50 transition-colors">
              Join & Compete
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}