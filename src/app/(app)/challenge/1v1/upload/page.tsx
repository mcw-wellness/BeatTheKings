'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/layout/Logo';

interface Opponent {
  id: string;
  name: string;
}

export default function UploadRecordingPage() {
  const router = useRouter();
  const [opponent, setOpponent] = useState<Opponent | null>(null);
  const [duration, setDuration] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const savedOpponent = sessionStorage.getItem('selectedOpponent');
    const savedDuration = sessionStorage.getItem('matchDuration');

    if (savedOpponent) {
      setOpponent(JSON.parse(savedOpponent));
    }

    if (savedDuration) {
      setDuration(parseInt(savedDuration, 10));
    }
  }, []);

  const formatDuration = (secs: number) => {
    return `${secs}s`;
  };

  const handleUpload = async () => {
    setIsUploading(true);

    // Simulate upload process
    setTimeout(() => {
      // Clear session storage
      sessionStorage.removeItem('selectedOpponent');
      sessionStorage.removeItem('matchDuration');

      // Navigate to matches list
      router.push('/matches');
    }, 2000);
  };

  if (!opponent) return null;

  return (
    <main className="min-h-screen bg-white">
      <div className="w-full max-w-4xl mx-auto p-4 md:p-8 space-y-6">
        {/* Header with Logo */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-start gap-2">
            <div className="w-12 h-12 flex-shrink-0">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Upload Recording</h1>
              <p className="text-sm text-gray-500">Venice Beach Courts</p>
            </div>
          </div>
          <button
            onClick={() => router.back()}
            className="text-blue-600 text-sm font-medium flex-shrink-0 mt-1"
          >
            ← Back
          </button>
        </div>

        {/* Recording Preview Card */}
        <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-center mb-4">
            {/* Video File Icon */}
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
              </svg>
            </div>
          </div>

          <h2 className="text-lg font-bold text-center text-gray-900 mb-2">
            Match Recording Ready
          </h2>

          {/* Recording Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-600">Duration:</span>
              <span className="text-sm font-semibold text-gray-900">{formatDuration(duration)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">File Size:</span>
              <span className="text-sm font-semibold text-gray-900">
                {(duration * 60).toFixed(1)} MB
              </span>
            </div>
          </div>

          {/* Recording Quality Checks */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-sm font-semibold text-gray-900">Recording Quality:</span>
              <span className="text-sm font-bold text-green-600">High (1080p)</span>
            </div>

            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
              <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
              </svg>
              <span className="text-sm font-semibold text-gray-900">Both Players Visible</span>
            </div>

            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
              <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
              </svg>
              <span className="text-sm font-semibold text-gray-900">Audio Captured</span>
            </div>
          </div>
        </div>

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={isUploading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {isUploading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Uploading & Verifying...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload Recording
            </>
          )}
        </button>

        {/* What Happens Next */}
        <div className="bg-white rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-900 mb-2">
            What happens next:
          </p>
          <div className="space-y-2 text-xs text-gray-700">
            <div className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">1.</span>
              <p>AI analyzes your recording to verify both players</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">2.</span>
              <p>System tracks points scored by each player</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">3.</span>
              <p>Winner is confirmed and XP is awarded</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">4.</span>
              <p>This usually takes 1-2 minutes</p>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
          <div className="flex items-start gap-2">
            <span className="text-yellow-600 text-xl">ℹ️</span>
            <p className="text-xs text-yellow-800">
              You'll receive a notification when verification is complete. Results will appear in your match history.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
