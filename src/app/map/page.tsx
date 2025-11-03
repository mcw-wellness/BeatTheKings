'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useApp } from '@/context/AppContext';
import { mockVenues, mockUsers } from '@/lib/mockData';
import { formatDistance } from '@/lib/utils';

export default function MapPage() {
  const router = useRouter();
  const { selectedSport, setSelectedSport } = useApp();
  const [selectedVenue, setSelectedVenue] = useState<string | null>(null);

  // Mock user location (New York City)
  const userLocation = { lat: 40.7580, lng: -73.9855 };

  const filteredVenues = mockVenues.filter(v => v.sportType === selectedSport);

  const getVenueKing = (venueId: string) => {
    const venue = mockVenues.find(v => v.id === venueId);
    if (!venue?.currentKingId) return null;
    return mockUsers.find(u => u.id === venue.currentKingId);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Venue Map</h1>
          <Button variant="ghost" onClick={() => router.push('/welcome')}>
            ← Back
          </Button>
        </div>

        {/* Sport Filter */}
        <Card>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Sport
          </label>
          <select
            value={selectedSport}
            onChange={(e) => setSelectedSport(e.target.value as any)}
            className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:outline-none"
          >
            <option value="basketball">🏀 Basketball</option>
            <option value="soccer">⚽ Soccer</option>
            <option value="running">🏃 Running</option>
            <option value="cycling">🚴 Cycling</option>
            <option value="skiing">⛷️ Skiing</option>
          </select>
        </Card>

        {/* Mock Map */}
        <Card className="h-96 bg-gray-100 relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <p className="text-6xl mb-4">🗺️</p>
              <p className="text-lg">Interactive Map (Mock)</p>
              <p className="text-sm">Showing {filteredVenues.length} venues</p>
            </div>
          </div>

          {/* Venue Markers */}
          <div className="absolute top-4 left-4 space-y-2">
            {filteredVenues.slice(0, 3).map((venue, index) => (
              <div
                key={venue.id}
                className="bg-white px-3 py-2 rounded-full shadow-lg cursor-pointer hover:bg-blue-50 transition-colors"
                style={{ marginLeft: `${index * 20}px`, marginTop: `${index * 60}px` }}
                onClick={() => setSelectedVenue(venue.id)}
              >
                📍 {venue.name}
              </div>
            ))}
          </div>
        </Card>

        {/* Venue List */}
        <div className="grid md:grid-cols-2 gap-4">
          {filteredVenues.map((venue) => {
            const king = getVenueKing(venue.id);
            const distance = 2.3; // Mock distance

            return (
              <Card
                key={venue.id}
                className={`cursor-pointer transition-all ${
                  selectedVenue === venue.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedVenue(venue.id)}
              >
                <div className="space-y-3">
                  {/* Venue Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-lg">{venue.name}</h3>
                      <p className="text-sm text-gray-600">{venue.address}</p>
                      <p className="text-xs text-gray-500">{formatDistance(distance)}</p>
                    </div>
                    <Badge variant="info">
                      {venue.activePlayerCount} 👥
                    </Badge>
                  </div>

                  {/* King of the Court */}
                  {king && (
                    <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded-lg">
                      <span className="text-2xl">👑</span>
                      <div className="flex-1">
                        <p className="text-xs text-gray-600">King of the Court</p>
                        <p className="font-bold text-sm">{king.name}</p>
                      </div>
                    </div>
                  )}

                  {/* Venue Type */}
                  <div className="flex gap-2">
                    <Badge>{venue.venueType}</Badge>
                    <Badge variant="success">{venue.sportType}</Badge>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </main>
  );
}