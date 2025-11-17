'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/layout/Logo';
import { useApp } from '@/context/AppContext';
import { mockVenues } from '@/lib/mockData';

interface ActivePlayer {
  id: string;
  name: string;
  ageGroup: string;
  distance: string;
  isKing: boolean;
}

interface VenueDetails {
  id: string;
  name: string;
  city: string;
  address: string;
  activePlayerCount: number;
}

export default function MapPage() {
  const router = useRouter();
  const { selectedSport, setSelectedSport, user } = useApp();
  const [selectedVenue, setSelectedVenue] = useState<string | null>(null);
  const [activePlayers, setActivePlayers] = useState<ActivePlayer[]>([]);
  const [venueDetails, setVenueDetails] = useState<VenueDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const filteredVenues = mockVenues.filter(v => v.sportType === selectedSport);
  const ageGroup = user?.ageGroup || '14-16';

  // Fetch active players when venue is selected
  useEffect(() => {
    if (selectedVenue) {
      setIsLoading(true);
      fetch(`/api/venues/${selectedVenue}/active-players`)
        .then(res => res.json())
        .then(data => {
          setVenueDetails(data.venue);
          setActivePlayers(data.activePlayers || []);
        })
        .catch(err => console.error('Failed to fetch active players:', err))
        .finally(() => setIsLoading(false));
    } else {
      setActivePlayers([]);
      setVenueDetails(null);
    }
  }, [selectedVenue]);

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
              <h1 className="text-xl font-bold text-gray-900">Venue Map</h1>
              <p className="text-sm text-gray-500">Find nearby courts</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/welcome')}
            className="text-blue-600 text-sm font-medium flex-shrink-0 mt-1"
          >
            ← Back
          </button>
        </div>

        {/* Sport Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            Select Sport
          </label>
          <select
            value={selectedSport}
            onChange={(e) => {
              setSelectedSport(e.target.value as any);
              setSelectedVenue(null); // Reset selection when sport changes
            }}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none bg-white text-sm"
          >
            <option value="basketball">🏀 Basketball</option>
            <option value="soccer">⚽ Soccer</option>
            <option value="running">🏃 Running</option>
            <option value="cycling">🚴 Cycling</option>
            <option value="skiing">⛷️ Skiing</option>
          </select>
        </div>

        {/* Interactive Map */}
        <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-xl p-6 relative overflow-hidden border-2 border-gray-200" style={{ height: '400px' }}>
          {/* Map Grid Background */}
          <div className="absolute inset-0 opacity-10">
            <div className="grid grid-cols-8 grid-rows-8 h-full">
              {Array.from({ length: 64 }).map((_, i) => (
                <div key={i} className="border border-gray-400"></div>
              ))}
            </div>
          </div>

          {/* Map Title */}
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg shadow-sm">
            <p className="text-xs font-semibold text-gray-700">📍 Austria - {selectedSport === 'basketball' ? 'Basketball Courts' : 'Venues'}</p>
          </div>

          {/* Venue Markers on Map */}
          {filteredVenues.map((venue, index) => {
            // Position venues across the map
            const positions = [
              { top: '20%', left: '30%' },   // Vienna area - venue 1
              { top: '35%', left: '45%' },   // Vienna area - venue 2
              { top: '15%', left: '55%' },   // Vienna area - venue 3
              { top: '65%', left: '25%' },   // Graz
              { top: '25%', left: '15%' },   // Salzburg
            ];
            const position = positions[index] || { top: '50%', left: '50%' };

            return (
              <div
                key={venue.id}
                className={`absolute cursor-pointer transition-all transform hover:scale-110 ${
                  selectedVenue === venue.id ? 'scale-125 z-10' : ''
                }`}
                style={position}
                onClick={() => setSelectedVenue(venue.id)}
              >
                {/* Marker Pin */}
                <div className="relative">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
                    selectedVenue === venue.id
                      ? 'bg-blue-600 ring-4 ring-blue-200'
                      : 'bg-red-500 hover:bg-red-600'
                  }`}>
                    <span className="text-white text-lg">📍</span>
                  </div>

                  {/* Active Players Count Badge */}
                  <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white">
                    {venue.activePlayerCount}
                  </div>

                  {/* Venue Name Label */}
                  {selectedVenue === venue.id && (
                    <div className="absolute top-12 left-1/2 transform -translate-x-1/2 bg-white px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap">
                      <p className="text-xs font-bold text-gray-900">{venue.name}</p>
                      <p className="text-xs text-gray-500">{venue.city}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Legend */}
          <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur px-3 py-2 rounded-lg shadow-sm">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              <span className="text-gray-700">Venue</span>
              <div className="w-4 h-4 bg-green-500 rounded-full ml-2"></div>
              <span className="text-gray-700">Active</span>
            </div>
          </div>
        </div>

        {/* Active Players Panel */}
        {selectedVenue && (
          <div className="bg-white border-2 border-blue-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {venueDetails?.name || 'Loading...'}
                </h2>
                <p className="text-sm text-gray-500">{venueDetails?.address}</p>
              </div>
              <button
                onClick={() => setSelectedVenue(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Active Players ({activePlayers.length})
              </h3>

              {isLoading ? (
                <div className="text-center py-4 text-gray-500 text-sm">Loading...</div>
              ) : activePlayers.length === 0 ? (
                <div className="text-center py-4 text-gray-500 text-sm">No active players</div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {activePlayers.map((player) => (
                    <div
                      key={player.id}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        player.isKing ? 'bg-yellow-50 border border-yellow-300' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          {player.isKing ? (
                            <span className="text-xl">👑</span>
                          ) : (
                            <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                            </svg>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-gray-900">
                            {player.name}
                            {player.isKing && (
                              <span className="ml-2 text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full">
                                King of Court
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500">Age Group: {player.ageGroup}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">{player.distance} away</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Venue List */}
        <div>
          <h3 className="text-base font-bold mb-3 text-gray-900">
            All Venues ({filteredVenues.length})
          </h3>
          <div className="grid md:grid-cols-2 gap-3">
            {filteredVenues.map((venue) => (
              <div
                key={venue.id}
                onClick={() => setSelectedVenue(venue.id)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedVenue === venue.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-bold text-sm text-gray-900">{venue.name}</h4>
                    <p className="text-xs text-gray-500 mt-1">{venue.address}</p>
                    <p className="text-xs text-gray-500">{venue.city}</p>
                  </div>
                  <div className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold">
                    {venue.activePlayerCount} 👥
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
