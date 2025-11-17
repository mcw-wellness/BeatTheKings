'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { mockChallenges } from '@/lib/mockData';

export default function RecordPage() {
  const router = useRouter();
  const params = useParams();
  const challengeId = params.id as string;

  const [countdown, setCountdown] = useState(10);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const challenge = mockChallenges.find(c => c.id === challengeId);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0 && !isRecording) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !isRecording) {
      setIsRecording(true);
    }
  }, [countdown, isRecording]);

  // Recording timer
  useEffect(() => {
    if (isRecording && !isComplete) {
      const timer = setInterval(() => {
        setRecordingTime(t => t + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isRecording, isComplete]);

  const handleStop = () => {
    setIsRecording(false);
    setIsComplete(true);
  };

  const handleTryAgain = () => {
    setCountdown(10);
    setIsRecording(false);
    setRecordingTime(0);
    setIsComplete(false);
  };

  const handleUpload = () => {
    // Mock: Navigate to results
    router.push(`/challenge/${challengeId}/results`);
  };

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-2xl mx-auto h-screen flex flex-col justify-between py-8">
        {/* Top Bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push(`/challenge/${challengeId}`)}
            className="text-white hover:text-gray-300"
          >
            ← Cancel
          </button>
          <p className="text-sm">{challenge?.name}</p>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-8">
            {countdown > 0 && !isRecording && (
              <>
                <p className="text-2xl font-medium">Recording starts in...</p>
                <div className="text-9xl font-bold animate-pulse">
                  {countdown}
                </div>
              </>
            )}

            {isRecording && !isComplete && (
              <>
                <div className="w-32 h-32 mx-auto rounded-full bg-red-600 animate-pulse flex items-center justify-center">
                  <div className="text-6xl">●</div>
                </div>
                <p className="text-3xl font-bold">
                  {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                </p>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={handleStop}
                  className="bg-white text-black"
                >
                  Stop Recording
                </Button>
              </>
            )}

            {isComplete && (
              <>
                <div className="text-6xl mb-4">✅</div>
                <p className="text-2xl font-bold mb-8">Recording Complete!</p>
                <div className="space-y-4">
                  <Button
                    size="lg"
                    onClick={handleUpload}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    Upload Video 📤
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleTryAgain}
                    className="w-full border-white text-white hover:bg-white hover:text-black"
                  >
                    Try Again 🔄
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Bottom Instructions */}
        {!isComplete && (
          <div className="text-center text-sm text-gray-400">
            <p>Make sure you're in frame and ready to perform</p>
          </div>
        )}
      </div>
    </main>
  );
}