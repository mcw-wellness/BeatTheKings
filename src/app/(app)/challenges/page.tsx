'use client';

import { useRouter } from 'next/navigation';
import { Logo } from '@/components/layout/Logo';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useApp } from '@/context/AppContext';
import { mockChallenges, mockVenues, mockUserChallengeStatuses } from '@/lib/mockData';

export default function ChallengesPage() {
  const router = useRouter();
  const { selectedSport, user } = useApp();

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
    <main className="min-h-screen bg-white">
      <div className="w-full max-w-4xl mx-auto p-4 md:p-8 space-y-4">
        {/* Header with Logo */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-start gap-2">
            <div className="w-12 h-12 flex-shrink-0">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Challenges</h1>
              <p className="text-sm text-gray-500">{selectedSport.charAt(0).toUpperCase() + selectedSport.slice(1)}</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/welcome')}
            className="text-blue-600 text-sm font-medium flex-shrink-0 mt-1"
          >
            ← Back
          </button>
        </div>

        {/* 1x1 Challenge Card */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">1x1 game</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-600">📍 {mockVenues[0]?.name}</span>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">EASY</span>
                <span className="text-xs text-gray-600">+100 XP</span>
                <span className="text-xs text-gray-600">⏱️ 12m</span>
              </div>
            </div>
            <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
              Not Started
            </span>
          </div>

          <button
            onClick={() => router.push('/challenge/1v1/opponents')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Start Challenge
          </button>
        </div>

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