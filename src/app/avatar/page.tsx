'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useApp } from '@/context/AppContext';

export default function AvatarPage() {
  const router = useRouter();
  const { user, createAvatar, selectedSport, setSelectedSport } = useApp();

  const [hairColor, setHairColor] = useState('black');
  const [hairStyle, setHairStyle] = useState('short');
  const [jerseyNumber, setJerseyNumber] = useState('23');
  const [torso, setTorso] = useState('jersey-blue');
  const [legs, setLegs] = useState('shorts-black');
  const [feet, setFeet] = useState('sneakers-white');

  const hairColors = ['black', 'brown', 'blonde', 'red', 'white'];
  const hairStyles = ['short', 'fade', 'long', 'ponytail', 'bald'];

  const handleSave = () => {
    createAvatar(hairColor, hairStyle, parseInt(jerseyNumber), {
      torso,
      legs,
      feet,
    });
    router.push('/welcome');
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto space-y-8 py-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">
            Create Your Avatar
          </h1>
          <p className="text-gray-600">
            Age Group: <span className="font-bold">{user.ageGroup}</span>
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Preview */}
          <Card className="text-center space-y-4">
            <div className="text-8xl">👤</div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Hair: {hairColor} / {hairStyle}</p>
              <p className="text-2xl font-bold">#{jerseyNumber}</p>
              <p className="text-sm text-gray-600">
                {selectedSport.charAt(0).toUpperCase() + selectedSport.slice(1)}
              </p>
            </div>
          </Card>

          {/* Customization */}
          <div className="space-y-6">
            {/* Sport Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sport
              </label>
              <select
                value={selectedSport}
                onChange={(e) => setSelectedSport(e.target.value as any)}
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:outline-none"
              >
                <option value="basketball">🏀 Basketball</option>
                <option value="soccer">⚽ Soccer</option>
                <option value="running">🏃 Running</option>
                <option value="cycling">🚴 Cycling</option>
                <option value="skiing">⛷️ Skiing</option>
              </select>
            </div>

            {/* Hair Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hair Color
              </label>
              <div className="flex gap-2">
                {hairColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setHairColor(color)}
                    className={`w-12 h-12 rounded-full border-4 capitalize ${
                      hairColor === color ? 'border-blue-500' : 'border-gray-300'
                    }`}
                    style={{
                      backgroundColor: color === 'black' ? '#000' :
                        color === 'brown' ? '#8B4513' :
                        color === 'blonde' ? '#FFD700' :
                        color === 'red' ? '#DC143C' : '#FFF'
                    }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            {/* Hair Style */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hair Style
              </label>
              <div className="grid grid-cols-3 gap-2">
                {hairStyles.map((style) => (
                  <button
                    key={style}
                    onClick={() => setHairStyle(style)}
                    className={`px-4 py-2 rounded-lg border-2 capitalize ${
                      hairStyle === style
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            {/* Jersey Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jersey Number
              </label>
              <input
                type="number"
                min="0"
                max="99"
                value={jerseyNumber}
                onChange={(e) => setJerseyNumber(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:outline-none text-center text-2xl font-bold"
              />
            </div>

            {/* Save Button */}
            <Button onClick={handleSave} className="w-full">
              Save Avatar
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}