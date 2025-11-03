'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useApp } from '@/context/AppContext';
import { mockTopPlayers, mockMonthlyChallenge, mockSponsors, mockVenues } from '@/lib/mockData';
import { formatXP } from '@/lib/utils';

export default function RankingPage() {
  const router = useRouter();
  const { selectedSport } = useApp();
  const [tab, setTab] = useState<'venue' | 'city' | 'country'>('venue');
  const [selectedVenue, setSelectedVenue] = useState(mockVenues[0]);

  const tabs = [
    { id: 'venue', label: 'Venue', icon: '🏟️' },
    { id: 'city', label: 'City', icon: '🏙️' },
    { id: 'country', label: 'Country', icon: '🌍' },
  ];

  const filteredPlayers = mockTopPlayers
    .filter(p => p.stats.sportType === selectedSport)
    .slice(0, 10);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Rankings</h1>
          <Button variant="ghost" onClick={() => router.push('/welcome')}>
            ← Back
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-white rounded-xl p-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                tab === t.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Venue Selector (for venue tab) */}
        {tab === 'venue' && (
          <Card>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Venue
            </label>
            <select
              value={selectedVenue.id}
              onChange={(e) => {
                const venue = mockVenues.find(v => v.id === e.target.value);
                if (venue) setSelectedVenue(venue);
              }}
              className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:outline-none"
            >
              {mockVenues
                .filter(v => v.sportType === selectedSport)
                .map(v => (
                  <option key={v.id} value={v.id}>
                    {v.name} - {v.city}
                  </option>
                ))}
            </select>
          </Card>
        )}

        {/* Top 10 Rankings */}
        <Card>
          <h2 className="text-xl font-bold mb-4">
            Top 10 - {selectedSport.charAt(0).toUpperCase() + selectedSport.slice(1)}
          </h2>
          <div className="space-y-2">
            {filteredPlayers.map((player, index) => (
              <div
                key={player.user.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                onClick={() => alert(`Player: ${player.user.name}\nXP: ${formatXP(player.stats.totalXp)}`)}
              >
                <div className="flex items-center gap-4">
                  <div className={`text-2xl font-bold ${
                    index === 0 ? 'text-yellow-500' :
                    index === 1 ? 'text-gray-400' :
                    index === 2 ? 'text-orange-600' :
                    'text-gray-600'
                  }`}>
                    #{index + 1}
                  </div>
                  <div className="w-12 h-12 rounded-full bg-blue-200 flex items-center justify-center text-2xl">
                    {index === 0 ? '👑' : '👤'}
                  </div>
                  <div>
                    <p className="font-bold">{player.user.name}</p>
                    <p className="text-sm text-gray-600">{player.user.ageGroup}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-blue-600">{formatXP(player.stats.totalXp)} XP</p>
                  <p className="text-sm text-gray-600">{player.stats.totalChallenges} challenges</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Monthly Challenge */}
        <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
          <h2 className="text-2xl font-bold mb-2">🏆 {mockMonthlyChallenge.title}</h2>
          <p className="mb-4">{mockMonthlyChallenge.description}</p>
          <Badge variant="warning" className="mb-4">
            Prize: {mockMonthlyChallenge.prizeDescription}
          </Badge>
          <div className="flex gap-2">
            <Badge>Top 5 Players</Badge>
          </div>
        </Card>

        {/* Sponsors */}
        <Card>
          <h3 className="text-sm font-medium text-gray-600 mb-4 text-center">
            Sponsored by
          </h3>
          <div className="flex justify-center gap-8 items-center">
            {mockSponsors.map(sponsor => (
              <div key={sponsor.id} className="text-2xl font-bold text-gray-400">
                {sponsor.name}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </main>
  );
}