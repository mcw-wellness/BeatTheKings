'use client';

import { useRouter } from 'next/navigation';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useApp } from '@/context/AppContext';

export default function WelcomePage() {
  const router = useRouter();
  const { user, hasAvatar, canAccessFeatures } = useApp();

  const features = [
    {
      id: 'avatar',
      name: 'Avatar',
      icon: '👤',
      description: 'Create your player',
      locked: false,
      path: '/avatar',
    },
    {
      id: 'ranking',
      name: 'Rankings',
      icon: '🏆',
      description: 'See top players',
      locked: !canAccessFeatures,
      path: '/ranking',
    },
    {
      id: 'map',
      name: 'Map',
      icon: '🗺️',
      description: 'Find venues',
      locked: !canAccessFeatures,
      path: '/map',
    },
    {
      id: 'challenges',
      name: 'Challenges',
      icon: '⚡',
      description: 'Compete now',
      locked: !canAccessFeatures,
      path: '/challenges',
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-4xl mx-auto space-y-8 py-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <Logo size="lg" pulsing />
          <h1 className="text-4xl font-bold text-gray-900">
            Welcome, {user.name}!
          </h1>
          <p className="text-xl text-gray-600">
            {!hasAvatar
              ? 'Start by creating your avatar to unlock the full kingdom!'
              : 'Ready to dominate the competition?'
            }
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-2 gap-4 md:gap-6">
          {features.map((feature) => (
            <Card
              key={feature.id}
              className={`relative overflow-hidden ${
                feature.locked ? 'opacity-60' : 'cursor-pointer hover:scale-105'
              } transition-all duration-200`}
              onClick={() => !feature.locked && router.push(feature.path)}
            >
              <div className="text-center space-y-3">
                <div className={`text-6xl ${feature.locked ? 'grayscale' : 'animate-bounce'}`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  {feature.name}
                </h3>
                <p className="text-sm text-gray-600">
                  {feature.description}
                </p>
              </div>

              {/* Lock Overlay */}
              {feature.locked && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[2px]">
                  <div className="text-5xl">🔒</div>
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Instructions */}
        {!hasAvatar && (
          <div className="text-center p-6 bg-yellow-50 rounded-xl border-2 border-yellow-200">
            <p className="text-yellow-800 font-medium">
              💡 Create your avatar to unlock Rankings, Map, and Challenges!
            </p>
          </div>
        )}
      </div>
    </main>
  );
}