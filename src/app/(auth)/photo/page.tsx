'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/layout/Logo';
import { Button } from '@/components/ui/Button';
import { useApp } from '@/context/AppContext';

export default function PhotoPage() {
  const router = useRouter();
  const { setProfilePicture, completeOnboarding } = useApp();
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Mock: Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRetake = () => {
    setPreview(null);
  };

  const handleConfirm = () => {
    if (!preview) return;

    setUploading(true);

    // Mock: Save profile picture and complete onboarding
    setTimeout(() => {
      setProfilePicture(preview);
      completeOnboarding();
      router.push('/welcome');
    }, 1000);
  };

  const handleSkip = () => {
    completeOnboarding();
    router.push('/welcome');
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-white">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="flex justify-center mb-2">
          <div className="w-40 h-40">
            <Logo size="lg" pulsing={!preview} />
          </div>
        </div>

        {/* Headline */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">
            Add Your Photo
          </h1>
          <p className="text-sm text-gray-600">
            Show your game face to the competition!
          </p>
        </div>

        {/* Photo Upload */}
        <div className="space-y-6">
          {!preview ? (
            <>
              {/* Upload area */}
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-400 transition-colors bg-gray-50">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="photo-upload"
                />
                <label
                  htmlFor="photo-upload"
                  className="cursor-pointer flex flex-col items-center space-y-3"
                >
                  <div className="w-20 h-20 bg-gray-300 rounded-lg flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-600 font-medium">
                    Click to upload or take a photo
                  </p>
                </label>
              </div>
            </>
          ) : (
            <>
              {/* Preview */}
              <div className="flex justify-center">
                <div className="relative">
                  <img
                    src={preview}
                    alt="Profile preview"
                    className="w-64 h-64 object-cover rounded-xl shadow-lg"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={handleRetake}
                  disabled={uploading}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Retake
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={uploading}
                  className="px-6 py-3 bg-[#4361EE] hover:bg-[#3651DE] text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : 'Confirm'}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Info */}
        <p className="text-center text-sm text-gray-600 pt-2">
          Your photo helps other players recognize you on the court
        </p>
      </div>
    </main>
  );
}