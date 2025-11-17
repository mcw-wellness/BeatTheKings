import { NextResponse } from 'next/server';
import { mockVenues, mockUsers } from '@/lib/mockData';

export async function GET(
  request: Request,
  { params }: { params: { venueId: string } }
) {
  const venueId = params.venueId;

  // Find the venue
  const venue = mockVenues.find(v => v.id === venueId);
  if (!venue) {
    return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
  }

  // Mock active players - in real app, this would query active sessions
  // For now, return random users from the same city with mock distances
  const activePlayers = mockUsers
    .filter(u => u.location?.includes(venue.city))
    .slice(0, venue.activePlayerCount)
    .map((user, index) => ({
      id: user.id,
      name: user.name,
      ageGroup: user.ageGroup,
      distance: (Math.random() * 2 + 0.1).toFixed(1) + ' km', // Mock distance
      isKing: user.id === venue.currentKingId,
    }));

  return NextResponse.json({
    venue: {
      id: venue.id,
      name: venue.name,
      city: venue.city,
      address: venue.address,
      activePlayerCount: venue.activePlayerCount,
    },
    activePlayers,
  });
}
