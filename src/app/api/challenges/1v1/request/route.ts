import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();
  const { opponentId, venueId, scheduledTime } = body;

  // Mock challenge request creation
  const challengeRequest = {
    id: `challenge-${Date.now()}`,
    opponentId,
    venueId,
    scheduledTime,
    status: 'pending', // pending, accepted, rejected
    createdAt: new Date().toISOString(),
  };

  // In real app, this would send notification to opponent
  return NextResponse.json({
    success: true,
    challenge: challengeRequest,
    message: 'Challenge request sent',
  });
}
