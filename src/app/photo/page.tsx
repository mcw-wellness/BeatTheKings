'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/Logo';
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
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <Logo size="md" pulsing={!preview} />
        </div>

        {/* Headline */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">
            Add Your Photo
          </h1>
          <p className="text-gray-600">
            Show your game face to the competition!
          </p>
        </div>

        {/* Photo Upload */}
        <div className="space-y-4">
          {!preview ? (
            <>
              {/* Upload area */}
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-500 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="photo-upload"
                />
                <label
                  htmlFor="photo-upload"
                  className="cursor-pointer flex flex-col items-center space-y-2"
                >
                  <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center text-4xl">
                    📷
                  </div>
                  <p className="text-sm text-gray-600">
                    Click to upload or take a photo
                  </p>
                </label>
              </div>

              <Button variant="ghost" className="w-full" onClick={handleSkip}>
                Skip for now
              </Button>
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
                <Button
                  variant="outline"
                  onClick={handleRetake}
                  disabled={uploading}
                >
                  Retake
                </Button>
                <Button onClick={handleConfirm} disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Confirm'}
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Info */}
        <p className="text-center text-xs text-gray-500">
          Your photo helps other players recognize you on the court
        </p>
      </div>
    </main>
  );
}