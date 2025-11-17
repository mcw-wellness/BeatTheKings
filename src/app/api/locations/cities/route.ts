import { NextResponse } from 'next/server';
import { austrianCitiesByState } from '@/lib/mockData';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const stateId = searchParams.get('state');

  if (!stateId) {
    return NextResponse.json({ error: 'State parameter is required' }, { status: 400 });
  }

  const cities = austrianCitiesByState[stateId] || [];

  // Return mock cities data for the specified state
  return NextResponse.json(cities);
}
