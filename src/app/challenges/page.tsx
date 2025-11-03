'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useApp } from '@/context/AppContext';
import { mockChallenges, mockVenues, mockUserChallengeStatuses } from '@/lib/mockData';

export default function ChallengesPage() {
  const router = useRouter();
  const { selectedSport } = useApp();

  const filteredChallenges = mockChallenges.filter(c => {
    const venue = mockVenues.find(v => v.id === c.venueId);
    return venue?.sportType === selectedSport;
  });

  const getChallengeStatus = (challengeId: string) => {
    return mockUserChallengeStatuses.find(s => s.challengeId === challengeId);
  };

  const getStatusBadge = (status?: string) => {
    if (!status || status === 'not_started') {
      return <Badge>Not Started</Badge>;
    }
    if (status === 'in_progress') {
      return <Badge variant="warning">In Progress</Badge>;
    }
    return <Badge variant="success">Completed ✓</Badge>;
  };

  const getDifficultyColor = (difficulty: string) => {
    if (difficulty === 'easy') return 'bg-green-100 text-green-800';
    if (difficulty === 'medium') return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Challenges</h1>
          <Button variant="ghost" onClick={() => router.push('/welcome')}>
            ← Back
          </Button>
        </div>

        {/* Sport Info */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">
                {selectedSport.charAt(0).toUpperCase() + selectedSport.slice(1)} Challenges
              </h2>
              <p className="text-gray-600">
                {filteredChallenges.length} challenges available
              </p>
            </div>
            <div className="text-4xl">
              {selectedSport === 'basketball' ? '🏀' :
               selectedSport === 'soccer' ? '⚽' :
               selectedSport === 'running' ? '🏃' :
               selectedSport === 'cycling' ? '🚴' : '⛷️'}
            </div>
          </div>
        </Card>

        {/* Challenges List */}
        <div className="space-y-4">
          {filteredChallenges.map((challenge) => {
            const venue = mockVenues.find(v => v.id === challenge.venueId);
            const status = getChallengeStatus(challenge.id);

            return (
              <Card
                key={challenge.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => router.push(`/challenge/${challenge.id}`)}
              >
                <div className="space-y-3">
                  {/* Challenge Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{challenge.name}</h3>
                      <p className="text-sm text-gray-600">{challenge.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        📍 {venue?.name}
                      </p>
                    </div>
                    {getStatusBadge(status?.status)}
                  </div>

                  {/* Challenge Meta */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={getDifficultyColor(challenge.difficulty)}>
                      {challenge.difficulty.toUpperCase()}
                    </Badge>
                    <Badge variant="info">
                      +{challenge.xpReward} XP
                    </Badge>
                    {challenge.parameters.timeLimit && (
                      <Badge>
                        ⏱️ {challenge.parameters.timeLimit}s
                      </Badge>
                    )}
                    {status?.attempts ? (
                      <Badge variant="warning">
                        {status.attempts} attempts
                      </Badge>
                    ) : null}
                  </div>

                  {/* Action Button */}
                  <Button
                    variant={status?.status === 'completed' ? 'secondary' : 'primary'}
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/challenge/${challenge.id}`);
                    }}
                  >
                    {status?.status === 'completed' ? 'View Details' :
                     status?.status === 'in_progress' ? 'Continue Challenge' :
                     'Start Challenge'}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Tutorials Section */}
        <Card className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
          <h3 className="text-xl font-bold mb-2">📚 Tutorials</h3>
          <p className="mb-4">Learn how to complete each challenge type</p>
          <Button variant="secondary" className="bg-white text-blue-600">
            View All Tutorials
          </Button>
        </Card>
      </div>
    </main>
  );
}