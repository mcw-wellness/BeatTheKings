import { NextResponse } from 'next/server';
import { mockTopPlayers, mockVenues } from '@/lib/mockData';

export async function GET(
  request: Request,
  { params }: { params: { venueId: string } }
) {
  const { searchParams } = new URL(request.url);
  const sport = searchParams.get('sport') || 'basketball';
  const venueId = params.venueId;

  // Verify venue exists
  const venue = mockVenues.find(v => v.id === venueId);
  if (!venue) {
    return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
  }

  // Filter players by venue and sport, return top 10
  // In a real app, we'd have venue-specific stats
  // For now, filter by sport and city where venue is located
  const topPlayers = mockTopPlayers
    .filter(p => {
      const playerCity = p.user.location?.split(',')[0]?.trim();
      return p.stats.sportType === sport && playerCity === venue.city;
    })
    .sort((a, b) => b.stats.totalXp - a.stats.totalXp)
    .slice(0, 10)
    .map((player, index) => ({
      rank: index + 1,
      userId: player.user.id,
      name: player.user.name,
      ageGroup: player.user.ageGroup,
      totalXp: player.stats.totalXp,
      totalChallenges: player.stats.totalChallenges,
      location: player.user.location,
      venueName: venue.name,
    }));

  return NextResponse.json({
    venue: {
      id: venue.id,
      name: venue.name,
      city: venue.city,
    },
    players: topPlayers,
  });
}
