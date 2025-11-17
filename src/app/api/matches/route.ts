import { NextResponse } from 'next/server';

// Mock matches data
const mockMatches = [
  {
    id: 'match-1',
    opponentName: 'Lukas Müller',
    opponentId: 'user-2',
    venue: 'Donauinsel Basketball Court',
    date: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
    status: 'pending',
    canDispute: false,
  },
  {
    id: 'match-2',
    opponentName: 'Stefan Weber',
    opponentId: 'user-3',
    venue: 'Prater Basketball Court',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    status: 'verified',
    result: {
      winner: 'you',
      yourScore: 11,
      opponentScore: 7,
      xpEarned: 150,
    },
    canDispute: true,
  },
  {
    id: 'match-3',
    opponentName: 'Thomas Bauer',
    opponentId: 'user-4',
    venue: 'Augarten Basketball Court',
    date: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
    status: 'verified',
    result: {
      winner: 'opponent',
      yourScore: 8,
      opponentScore: 11,
      xpEarned: 50,
    },
    canDispute: true,
  },
  {
    id: 'match-4',
    opponentName: 'Michael Gruber',
    opponentId: 'user-5',
    venue: 'Donauinsel Basketball Court',
    date: new Date(Date.now() - 1000 * 60 * 60 * 72), // 3 days ago
    status: 'disputed',
    result: {
      winner: 'opponent',
      yourScore: 10,
      opponentScore: 11,
      xpEarned: 50,
    },
    canDispute: false,
  },
  {
    id: 'match-5',
    opponentName: 'Andreas Huber',
    opponentId: 'user-6',
    venue: 'Prater Basketball Court',
    date: new Date(Date.now() - 1000 * 60 * 60 * 120), // 5 days ago
    status: 'verified',
    result: {
      winner: 'you',
      yourScore: 11,
      opponentScore: 9,
      xpEarned: 150,
    },
    canDispute: false, // Too old to dispute
  },
];

export async function GET() {
  // Sort by date (newest first)
  const sortedMatches = mockMatches.sort((a, b) => b.date.getTime() - a.date.getTime());

  return NextResponse.json(sortedMatches);
}
