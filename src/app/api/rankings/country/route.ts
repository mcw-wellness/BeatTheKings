import { NextResponse } from 'next/server';
import { mockTopPlayers } from '@/lib/mockData';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sport = searchParams.get('sport') || 'basketball';

  // Filter players by sport and return top 10
  const topPlayers = mockTopPlayers
    .filter(p => p.stats.sportType === sport)
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
    }));

  return NextResponse.json(topPlayers);
}
