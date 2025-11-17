import { NextResponse } from 'next/server';

const mockMatchDetails: Record<string, any> = {
  'match-1': {
    id: 'match-1',
    opponentName: 'Lukas Müller',
    opponentId: 'user-2',
    venue: 'Donauinsel Basketball Court',
    date: new Date(Date.now() - 1000 * 60 * 5),
    status: 'pending',
    canDispute: false,
  },
  'match-2': {
    id: 'match-2',
    opponentName: 'Stefan Weber',
    opponentId: 'user-3',
    venue: 'Prater Basketball Court',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24),
    status: 'verified',
    result: {
      winner: 'you',
      yourScore: 11,
      opponentScore: 7,
      xpEarned: 150,
      duration: '12m 34s',
      accuracy: '61%',
    },
    canDispute: true,
    recordingUrl: '/recordings/match-2.mp4',
  },
  'match-3': {
    id: 'match-3',
    opponentName: 'Thomas Bauer',
    opponentId: 'user-4',
    venue: 'Augarten Basketball Court',
    date: new Date(Date.now() - 1000 * 60 * 60 * 48),
    status: 'verified',
    result: {
      winner: 'opponent',
      yourScore: 8,
      opponentScore: 11,
      xpEarned: 50,
      duration: '14m 22s',
      accuracy: '53%',
    },
    canDispute: true,
    recordingUrl: '/recordings/match-3.mp4',
  },
  'match-4': {
    id: 'match-4',
    opponentName: 'Michael Gruber',
    opponentId: 'user-5',
    venue: 'Donauinsel Basketball Court',
    date: new Date(Date.now() - 1000 * 60 * 60 * 72),
    status: 'disputed',
    result: {
      winner: 'opponent',
      yourScore: 10,
      opponentScore: 11,
      xpEarned: 50,
      duration: '15m 10s',
      accuracy: '58%',
    },
    canDispute: false,
    recordingUrl: '/recordings/match-4.mp4',
  },
  'match-5': {
    id: 'match-5',
    opponentName: 'Andreas Huber',
    opponentId: 'user-6',
    venue: 'Prater Basketball Court',
    date: new Date(Date.now() - 1000 * 60 * 60 * 120),
    status: 'verified',
    result: {
      winner: 'you',
      yourScore: 11,
      opponentScore: 9,
      xpEarned: 150,
      duration: '13m 45s',
      accuracy: '64%',
    },
    canDispute: false,
    recordingUrl: '/recordings/match-5.mp4',
  },
};

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const match = mockMatchDetails[params.id];

  if (!match) {
    return NextResponse.json({ error: 'Match not found' }, { status: 404 });
  }

  return NextResponse.json(match);
}
