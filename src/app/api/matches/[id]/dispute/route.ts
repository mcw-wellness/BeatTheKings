import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const { reason, details } = body;

  // In a real app, this would:
  // 1. Save the dispute to the database
  // 2. Update the match status to 'disputed'
  // 3. Notify the review team
  // 4. Send notification to both players

  console.log('Dispute submitted for match:', params.id);
  console.log('Reason:', reason);
  console.log('Details:', details);

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  return NextResponse.json({
    success: true,
    message: 'Dispute submitted successfully',
    disputeId: `dispute-${Date.now()}`,
  });
}
