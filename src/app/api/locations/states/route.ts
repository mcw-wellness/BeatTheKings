import { NextResponse } from 'next/server';
import { austrianStates } from '@/lib/mockData';

export async function GET() {
  // Return mock Austrian states data
  return NextResponse.json(austrianStates);
}
