import { NextResponse } from 'next/server'
import { mockUsers } from '@/lib/mockData'
import { withErrorLogging } from '@/lib/utils/api-handler'

const _GET = async () => {
  // Mock available opponents - users who are online/available for 1x1 matches
  const availableOpponents = mockUsers
    .filter((u) => u.hasCompletedOnboarding)
    .slice(0, 5) // Limit to 5 available opponents
    .map((user) => ({
      id: user.id,
      name: user.name,
      profilePictureUrl: user.profilePictureUrl,
      winRate: Math.floor(Math.random() * 40 + 50), // Mock 50-90% win rate
      matchesPlayed: Math.floor(Math.random() * 50 + 10), // Mock 10-60 matches
      ageGroup: user.ageGroup,
      location: user.location,
      isAvailable: true,
      memberSince: user.createdAt,
    }))

  return NextResponse.json(availableOpponents)
}

export const GET = withErrorLogging(_GET)
