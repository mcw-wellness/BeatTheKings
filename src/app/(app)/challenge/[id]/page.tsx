'use client';

import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { mockChallenges, mockVenues } from '@/lib/mockData';

export default function ChallengePage() {
  const router = useRouter();
  const params = useParams();
  const challengeId = params.id as string;

  const challenge = mockChallenges.find(c => c.id === challengeId);
  const venue = challenge ? mockVenues.find(v => v.id === challenge.venueId) : null;

  if (!challenge || !venue) {
    return <div className="p-6">Challenge not found</div>;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-2xl mx-auto space-y-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.push('/challenges')}>
            ← Back
          </Button>
        </div>

        {/* Challenge Info */}
        <Card>
          <div className="space-y-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{challenge.name}</h1>
              <p className="text-gray-600">{challenge.description}</p>
            </div>

            <div className="flex gap-2">
              <Badge className={
                challenge.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                challenge.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }>
                {challenge.difficulty.toUpperCase()}
              </Badge>
              <Badge variant="info">+{challenge.xpReward} XP</Badge>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm text-gray-600 mb-1">📍 Venue</p>
              <p className="font-bold">{venue.name}</p>
              <p className="text-sm text-gray-600">{venue.address}</p>
            </div>
          </div>
        </Card>

        {/* Instructions */}
        <Card className="bg-blue-50">
          <h2 className="text-xl font-bold mb-3">📋 Instructions</h2>
          <div className="space-y-2">
            <p className="text-gray-700">{challenge.instructions}</p>

            {challenge.parameters.requiredShots && (
              <p className="font-medium">
                • Required shots: {challenge.parameters.requiredShots}
              </p>
            )}
            {challenge.parameters.minSuccessful && (
              <p className="font-medium">
                • Minimum successful: {challenge.parameters.minSuccessful}
              </p>
            )}
            {challenge.parameters.timeLimit && (
              <p className="font-medium">
                • Time limit: {challenge.parameters.timeLimit} seconds
              </p>
            )}
            {challenge.parameters.distance && (
              <p className="font-medium">
                • Distance: {challenge.parameters.distance}
              </p>
            )}
          </div>
        </Card>

        {/* Recording Instructions */}
        <Card>
          <h2 className="text-xl font-bold mb-3">🎥 Recording Instructions</h2>
          <ul className="space-y-2 text-gray-700">
            <li>• Set up camera to capture full movement</li>
            <li>• Ensure good lighting</li>
            <li>• Use stable surface or tripod</li>
            <li>• Clear background preferred</li>
            <li>• Perform verification gesture at start</li>
          </ul>
        </Card>

        {/* Start Button */}
        <Button
          className="w-full text-lg py-4"
          onClick={() => router.push(`/challenge/${challengeId}/record`)}
        >
          Start Challenge 🎬
        </Button>

        {/* Important Note */}
        <Card className="bg-yellow-50 border-2 border-yellow-200">
          <p className="text-sm text-yellow-800">
            ⚠️ <strong>Important:</strong> Only verified submissions count toward your XP and rankings.
            Make sure to follow all instructions carefully!
          </p>
        </Card>
      </div>
    </main>
  );
}