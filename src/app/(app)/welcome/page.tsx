'use client';

import { useRouter } from 'next/navigation';
import { Logo } from '@/components/layout/Logo';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/lib/hooks/useAuth';

export default function WelcomePage() {
  const router = useRouter();
  const { user: appUser, hasAvatar, canAccessFeatures } = useApp();
  const { user: authUser } = useAuth();

  // Use authenticated user name, fallback to app context user
  const userName = authUser?.name || appUser?.name || 'Player';

  // Debug logging
  console.log('Welcome Page - Debug Info:');
  console.log('hasAvatar:', hasAvatar);
  console.log('appUser.hasCompletedOnboarding:', appUser?.hasCompletedOnboarding);
  console.log('canAccessFeatures:', canAccessFeatures);

  const features = [
    {
      id: 'avatar',
      name: 'Avatar',
      description: 'Create your player',
      locked: false,
      path: '/avatar',
    },
    {
      id: 'ranking',
      name: 'Rankings',
      description: 'See top players',
      locked: !canAccessFeatures,
      path: '/ranking',
    },
    {
      id: 'map',
      name: 'Map',
      description: 'Find venues',
      locked: !canAccessFeatures,
      path: '/map',
    },
    {
      id: 'challenges',
      name: 'Challenges',
      description: 'Compete now',
      locked: !canAccessFeatures,
      path: '/challenges',
    },
    {
      id: 'matches',
      name: 'My Matches',
      description: 'View match history',
      locked: !canAccessFeatures,
      path: '/matches',
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6 py-8">
        {/* Header with Logo */}
        <div className="flex items-start">
          <div className="w-32 h-32">
            <Logo size="lg" pulsing />
          </div>
        </div>

        {/* Welcome Message */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome, {userName}!
          </h1>
          <p className="text-base text-gray-700">
            {hasAvatar
              ? 'Ready to dominate the competition?'
              : 'Start by creating your avatar to unlock the full kingdom!'}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-2 gap-4">
          {features.map((feature) => (
            <div
              key={feature.id}
              onClick={() => !feature.locked && router.push(feature.path)}
              className={`rounded-xl p-6 shadow-md relative ${
                feature.locked
                  ? 'bg-gray-200 opacity-60 cursor-not-allowed'
                  : 'bg-white cursor-pointer hover:shadow-lg transition-shadow'
              }`}
            >
              <div className="text-center space-y-3">
                <div className="flex justify-center">
                  {feature.id === 'avatar' && (
                    <svg className={`w-16 h-16 ${feature.locked ? 'text-gray-500' : 'text-gray-700'}`} fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  )}
                  {feature.id === 'ranking' && (
                    <svg className={`w-16 h-16 ${feature.locked ? 'text-gray-500' : 'text-yellow-500'}`} fill="currentColor" viewBox="0 0 24 24">
                      <path d="M7 3H5v2H3v14h8v-2h2v2h8V5h-2V3h-2v2h-2V3h-2v2H9V3H7zm0 4h2v2h2V7h2v2h2V7h2v10h-4v-2h-2v2H5V7h2z"/>
                    </svg>
                  )}
                  {feature.id === 'map' && (
                    <svg className={`w-16 h-16 ${feature.locked ? 'text-gray-500' : 'text-blue-500'}`} fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z"/>
                    </svg>
                  )}
                  {feature.id === 'challenges' && (
                    <svg className={`w-16 h-16 ${feature.locked ? 'text-gray-500' : 'text-yellow-500'}`} fill="currentColor" viewBox="0 0 24 24">
                      <path d="M7 2v11h3v9l7-12h-4l4-8z"/>
                    </svg>
                  )}
                </div>
                <h3 className={`text-lg font-bold ${feature.locked ? 'text-gray-600' : 'text-gray-900'}`}>
                  {feature.name}
                </h3>
                <p className={`text-sm ${feature.locked ? 'text-gray-500' : 'text-gray-600'}`}>
                  {feature.description}
                </p>
              </div>
              {feature.locked && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6z"/>
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Instructions Banner - Only show when avatar not created */}
        {!hasAvatar && (
          <div className="bg-yellow-100 border border-yellow-300 rounded-xl p-4 mt-6">
            <p className="text-yellow-900 text-sm font-medium text-center">
              💡 Create your avatar to unlock Rankings, Map, and Challenges!
            </p>
          </div>
        )}
      </div>
    </main>
  );
}