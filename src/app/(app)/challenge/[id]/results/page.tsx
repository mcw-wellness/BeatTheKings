'use client';

import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useApp } from '@/context/AppContext';
import { mockChallenges } from '@/lib/mockData';
import { formatXP } from '@/lib/utils';

export default function ResultsPage() {
  const router = useRouter();
  const params = useParams();
  const { updateStats } = useApp();
  const challengeId = params.id as string;

  const challenge = mockChallenges.find(c => c.id === challengeId);

  // Mock results
  const results = {
    playerIdentified: true,
    shotsMade: challenge?.parameters.requiredShots ? 8 : undefined,
    shotsAttempted: challenge?.parameters.requiredShots ? 10 : undefined,
    timeTaken: 52, // seconds
    challengeCompleted: true,
    xpEarned: challenge?.xpReward || 0,
  };

  const handleNextChallenge = () => {
    if (challenge) {
      updateStats(results.xpEarned, 1);
    }
    router.push('/challenges');
  };

  const handleBackToAvatar = () => {
    if (challenge) {
      updateStats(results.xpEarned, 1);
    }
    router.push('/avatar');
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
      <div className="max-w-2xl mx-auto space-y-6 py-8">
        {/* Success Header */}
        <div className="text-center space-y-4">
          <div className="text-8xl">🎉</div>
          <h1 className="text-4xl font-bold text-gray-900">
            Challenge Complete!
          </h1>
          <p className="text-xl text-gray-600">{challenge?.name}</p>
        </div>

        {/* Results Card */}
        <Card className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Your Results</h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/20 rounded-lg p-4">
                <p className="text-sm opacity-90">Status</p>
                <p className="text-2xl font-bold">
                  {results.playerIdentified ? '✅ Verified' : '❌ Pending'}
                </p>
              </div>

              {results.shotsMade !== undefined && (
                <div className="bg-white/20 rounded-lg p-4">
                  <p className="text-sm opacity-90">Shots Made</p>
                  <p className="text-2xl font-bold">
                    {results.shotsMade}/{results.shotsAttempted}
                  </p>
                </div>
              )}

              <div className="bg-white/20 rounded-lg p-4">
                <p className="text-sm opacity-90">Time</p>
                <p className="text-2xl font-bold">
                  {Math.floor(results.timeTaken / 60)}:{(results.timeTaken % 60).toString().padStart(2, '0')}
                </p>
              </div>

              <div className="bg-white/20 rounded-lg p-4">
                <p className="text-sm opacity-90">Completion</p>
                <p className="text-2xl font-bold">
                  {results.challengeCompleted ? '✅ Done' : '⏳ Partial'}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* XP Earned */}
        <Card className="text-center bg-yellow-50 border-2 border-yellow-300">
          <div className="space-y-2">
            <p className="text-gray-600">XP Earned</p>
            <p className="text-5xl font-bold text-yellow-600">
              +{formatXP(results.xpEarned)}
            </p>
            <Badge variant="success" className="text-lg px-4 py-2">
              Great Job! 🎯
            </Badge>
          </div>
        </Card>

        {/* Performance Feedback */}
        <Card>
          <h3 className="font-bold mb-2">Performance Analysis</h3>
          <div className="space-y-2 text-sm">
            <p className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              Player identification successful
            </p>
            {results.shotsMade && results.shotsAttempted && (
              <p className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                Accuracy: {Math.round((results.shotsMade / results.shotsAttempted) * 100)}%
              </p>
            )}
            <p className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              Completed within time limit
            </p>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="outline"
            size="lg"
            onClick={handleBackToAvatar}
          >
            View Avatar
          </Button>
          <Button
            size="lg"
            onClick={handleNextChallenge}
          >
            Next Challenge →
          </Button>
        </div>

        {/* Share Section */}
        <Card className="text-center">
          <p className="text-sm text-gray-600 mb-3">Share your achievement!</p>
          <div className="flex gap-2 justify-center">
            <Button variant="ghost" size="sm">📱 Share</Button>
            <Button variant="ghost" size="sm">🔗 Copy Link</Button>
          </div>
        </Card>
      </div>
    </main>
  );
}