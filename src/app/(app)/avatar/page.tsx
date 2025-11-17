'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Logo } from '@/components/layout/Logo';

type StyleTab = 'skin' | 'hair' | 'jersey' | 'short' | 'shoes';
type HairStyle = 'short' | 'fade' | 'curly' | 'afro' | 'buzzcut' | 'long';

export default function AvatarPage() {
  const router = useRouter();
  const { createAvatar, completeOnboarding } = useApp();

  // Avatar customization states
  const [ageGroup, setAgeGroup] = useState('14-16');
  const [sport, setSport] = useState('basketball');
  const [activeTab, setActiveTab] = useState<StyleTab>('skin');
  const [skinColor, setSkinColor] = useState('#D2A679');
  const [hairColor, setHairColor] = useState('#000000');
  const [hairStyle, setHairStyle] = useState<HairStyle>('short');
  const [jerseyColor, setJerseyColor] = useState('#E53E3E');
  const [shortsColor, setShortsColor] = useState('#C53030');
  const [shoesColor, setShoesColor] = useState('#2D3748');
  const [jerseyNumber, setJerseyNumber] = useState('10');

  const ageGroups = ['12-14', '14-16', '16-18', '18+'];

  const skinColors = [
    { name: 'Light', value: '#FFE0BD' },
    { name: 'Medium', value: '#D2A679' },
    { name: 'Tan', value: '#A67C52' },
    { name: 'Dark', value: '#6F4E37' },
  ];

  const hairColors = [
    { name: 'Black', value: '#000000' },
    { name: 'Brown', value: '#8B4513' },
    { name: 'Blonde', value: '#FFD700' },
    { name: 'Red', value: '#DC143C' },
  ];

  const hairStyles = [
    { name: 'Short', value: 'short' as HairStyle },
    { name: 'Fade', value: 'fade' as HairStyle },
    { name: 'Curly', value: 'curly' as HairStyle },
    { name: 'Afro', value: 'afro' as HairStyle },
    { name: 'Buzz Cut', value: 'buzzcut' as HairStyle },
    { name: 'Long', value: 'long' as HairStyle },
  ];

  const jerseyColors = [
    { name: 'Red', value: '#E53E3E' },
    { name: 'Blue', value: '#3182CE' },
    { name: 'Green', value: '#38A169' },
    { name: 'Yellow', value: '#F6E05E' },
    { name: 'Purple', value: '#805AD5' },
    { name: 'White', value: '#FFFFFF' },
    { name: 'Black', value: '#1A202C' },
  ];

  const shortsColors = [
    { name: 'Red', value: '#C53030' },
    { name: 'Blue', value: '#2C5282' },
    { name: 'Black', value: '#1A202C' },
    { name: 'White', value: '#FFFFFF' },
  ];

  const shoesColors = [
    { name: 'Black', value: '#2D3748' },
    { name: 'White', value: '#F7FAFC' },
    { name: 'Red', value: '#C53030' },
    { name: 'Blue', value: '#2C5282' },
  ];

  // Function to render different hair styles
  const renderHair = () => {
    const darkerHairColor = adjustColor(hairColor, -30);

    switch (hairStyle) {
      case 'short':
        return (
          <g>
            <ellipse cx="140" cy="30" rx="42" ry="25" fill={hairColor}/>
            <ellipse cx="140" cy="32" rx="40" ry="23" fill={darkerHairColor}/>
          </g>
        );
      case 'fade':
        return (
          <g>
            <ellipse cx="140" cy="32" rx="40" ry="22" fill={hairColor}/>
            <ellipse cx="140" cy="34" rx="38" ry="20" fill={darkerHairColor}/>
            <ellipse cx="120" cy="45" rx="15" ry="18" fill={hairColor} opacity="0.6"/>
            <ellipse cx="160" cy="45" rx="15" ry="18" fill={hairColor} opacity="0.6"/>
          </g>
        );
      case 'curly':
        return (
          <g>
            {/* Multiple circles to create curly effect */}
            <circle cx="115" cy="25" r="12" fill={hairColor}/>
            <circle cx="130" cy="20" r="13" fill={darkerHairColor}/>
            <circle cx="145" cy="20" r="13" fill={hairColor}/>
            <circle cx="160" cy="23" r="12" fill={darkerHairColor}/>
            <circle cx="125" cy="35" r="10" fill={hairColor}/>
            <circle cx="150" cy="35" r="10" fill={hairColor}/>
            <ellipse cx="140" cy="30" rx="35" ry="15" fill={darkerHairColor}/>
          </g>
        );
      case 'afro':
        return (
          <g>
            <circle cx="140" cy="35" r="50" fill={hairColor}/>
            <circle cx="120" cy="30" r="25" fill={darkerHairColor} opacity="0.5"/>
            <circle cx="160" cy="30" r="25" fill={darkerHairColor} opacity="0.5"/>
            <circle cx="140" cy="15" r="30" fill={darkerHairColor} opacity="0.5"/>
          </g>
        );
      case 'buzzcut':
        return (
          <g>
            <ellipse cx="140" cy="35" rx="38" ry="18" fill={hairColor} opacity="0.8"/>
          </g>
        );
      case 'long':
        return (
          <g>
            <ellipse cx="140" cy="30" rx="42" ry="25" fill={hairColor}/>
            <path d="M 100 40 Q 95 60 100 80" fill={hairColor} stroke={darkerHairColor} strokeWidth="2"/>
            <path d="M 180 40 Q 185 60 180 80" fill={hairColor} stroke={darkerHairColor} strokeWidth="2"/>
            <ellipse cx="140" cy="32" rx="40" ry="23" fill={darkerHairColor}/>
          </g>
        );
      default:
        return <ellipse cx="140" cy="30" rx="42" ry="25" fill={hairColor}/>;
    }
  };

  // Helper function to adjust color brightness
  const adjustColor = (color: string, amount: number) => {
    const num = parseInt(color.replace('#', ''), 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
    const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  };

  const handleSave = () => {
    const avatarConfig = {
      ageGroup,
      sport,
      skinColor,
      hairColor,
      hairStyle,
      jerseyColor,
      shortsColor,
      shoesColor,
      jerseyNumber,
    };

    console.log('Saving avatar...');
    createAvatar(hairColor, hairStyle, parseInt(jerseyNumber), avatarConfig);
    console.log('Completing onboarding...');
    completeOnboarding(); // Mark onboarding as complete to unlock features
    localStorage.setItem('avatar_created', 'true');

    console.log('LocalStorage after save:');
    console.log('avatar_data:', localStorage.getItem('avatar_data'));
    console.log('user_data:', localStorage.getItem('user_data'));

    router.push('/welcome');
  };

  // Generate gradient colors for shading
  const skinDark = adjustColor(skinColor, -30);
  const jerseyDark = adjustColor(jerseyColor, -40);
  const shortsDark = adjustColor(shortsColor, -40);
  const shoesDark = adjustColor(shoesColor, -50);

  return (
    <main className="min-h-screen bg-white">
      {/* Logo at the top */}
      <div className="p-6">
        <div className="flex items-start mb-8">
          <div className="w-32 h-32">
            <Logo size="lg" pulsing />
          </div>
        </div>

        {/* Header */}
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create Your Avatar</h1>
          <p className="text-gray-600">Customize your basketball player</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pb-8">

        <div className="grid md:grid-cols-2 gap-8">
          {/* Avatar Preview - Left Side */}
          <div className="flex items-center justify-center">
            <div className="relative bg-gray-50 rounded-2xl p-8 border border-gray-200">
              {/* Enhanced Basketball Player Avatar */}
              <svg width="300" height="420" viewBox="0 0 300 420" className="drop-shadow-2xl">
                <defs>
                  {/* Gradients for 3D effect */}
                  <linearGradient id="skinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={skinColor}/>
                    <stop offset="100%" stopColor={skinDark}/>
                  </linearGradient>
                  <linearGradient id="jerseyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={jerseyColor}/>
                    <stop offset="100%" stopColor={jerseyDark}/>
                  </linearGradient>
                  <linearGradient id="shortsGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={shortsColor}/>
                    <stop offset="100%" stopColor={shortsDark}/>
                  </linearGradient>
                  <linearGradient id="shoesGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={shoesColor}/>
                    <stop offset="100%" stopColor={shoesDark}/>
                  </linearGradient>
                </defs>

                {/* Hair (rendered behind head) */}
                {renderHair()}

                {/* Head with gradient */}
                <circle cx="150" cy="60" r="38" fill="url(#skinGradient)" stroke="#000" strokeWidth="1.5"/>

                {/* Ears */}
                <ellipse cx="112" cy="65" rx="8" ry="12" fill={skinColor} stroke="#000" strokeWidth="1"/>
                <ellipse cx="188" cy="65" rx="8" ry="12" fill={skinColor} stroke="#000" strokeWidth="1"/>

                {/* Eyes */}
                <ellipse cx="135" cy="58" rx="5" ry="6" fill="#FFF" stroke="#000" strokeWidth="1"/>
                <ellipse cx="165" cy="58" rx="5" ry="6" fill="#FFF" stroke="#000" strokeWidth="1"/>
                <circle cx="135" cy="59" r="3" fill="#000"/>
                <circle cx="165" cy="59" r="3" fill="#000"/>

                {/* Eyebrows */}
                <path d="M 128 50 Q 135 48 142 50" stroke="#000" strokeWidth="2" fill="none" strokeLinecap="round"/>
                <path d="M 158 50 Q 165 48 172 50" stroke="#000" strokeWidth="2" fill="none" strokeLinecap="round"/>

                {/* Nose */}
                <path d="M 150 65 L 148 72 L 152 72" stroke="#000" strokeWidth="1.5" fill="none" strokeLinecap="round"/>

                {/* Smile */}
                <path d="M 135 75 Q 150 82 165 75" stroke="#000" strokeWidth="2.5" fill="none" strokeLinecap="round"/>

                {/* Neck */}
                <rect x="135" y="95" width="30" height="15" fill="url(#skinGradient)" stroke="#000" strokeWidth="1"/>

                {/* Jersey/Body */}
                <path d="M 100 110 L 100 190 L 200 190 L 200 110 L 180 110 L 180 100 L 165 100 L 165 110 L 135 110 L 135 100 L 120 100 L 120 110 Z"
                      fill="url(#jerseyGradient)" stroke="#000" strokeWidth="2"/>

                {/* Jersey collar */}
                <path d="M 135 110 L 135 100 L 165 100 L 165 110" fill={jerseyDark} stroke="#000" strokeWidth="1.5"/>

                {/* Jersey Number */}
                <text x="150" y="155" fontSize="40" fontWeight="bold" fill="#FFF" textAnchor="middle"
                      stroke="#000" strokeWidth="1" fontFamily="Arial">
                  {jerseyNumber}
                </text>

                {/* Arms */}
                <ellipse cx="85" cy="140" rx="18" ry="50" fill="url(#skinGradient)" stroke="#000" strokeWidth="1.5"/>
                <ellipse cx="215" cy="140" rx="18" ry="50" fill="url(#skinGradient)" stroke="#000" strokeWidth="1.5"/>

                {/* Hands */}
                <circle cx="85" cy="185" r="12" fill={skinColor} stroke="#000" strokeWidth="1.5"/>
                <circle cx="215" cy="185" r="12" fill={skinColor} stroke="#000" strokeWidth="1.5"/>

                {/* Shorts */}
                <path d="M 100 190 L 95 245 L 130 245 L 135 190 Z" fill="url(#shortsGradient)" stroke="#000" strokeWidth="2"/>
                <path d="M 165 190 L 170 245 L 205 245 L 200 190 Z" fill="url(#shortsGradient)" stroke="#000" strokeWidth="2"/>

                {/* Shorts stripes */}
                <line x1="100" y1="235" x2="130" y2="235" stroke="#FFF" strokeWidth="3"/>
                <line x1="170" y1="235" x2="205" y2="235" stroke="#FFF" strokeWidth="3"/>

                {/* Legs */}
                <rect x="100" y="245" width="28" height="90" fill="url(#skinGradient)" stroke="#000" strokeWidth="1.5" rx="8"/>
                <rect x="172" y="245" width="28" height="90" fill="url(#skinGradient)" stroke="#000" strokeWidth="1.5" rx="8"/>

                {/* Shoes */}
                <ellipse cx="114" cy="355" rx="24" ry="30" fill="url(#shoesGradient)" stroke="#000" strokeWidth="2"/>
                <ellipse cx="186" cy="355" rx="24" ry="30" fill="url(#shoesGradient)" stroke="#000" strokeWidth="2"/>

                {/* Shoe laces */}
                <ellipse cx="114" cy="345" rx="8" ry="5" fill="#FFF" opacity="0.8"/>
                <ellipse cx="186" cy="345" rx="8" ry="5" fill="#FFF" opacity="0.8"/>

                {/* Shoe soles */}
                <ellipse cx="114" cy="370" rx="26" ry="8" fill={shoesDark}/>
                <ellipse cx="186" cy="370" rx="26" ry="8" fill={shoesDark}/>

                {/* Basketball */}
                <circle cx="50" cy="150" r="28" fill="#FF8C00" stroke="#000" strokeWidth="2"/>
                <circle cx="50" cy="150" r="28" fill="url(#ballGradient)"/>
                <path d="M 25 150 Q 50 140 75 150" stroke="#000" strokeWidth="2.5" fill="none"/>
                <path d="M 25 150 Q 50 160 75 150" stroke="#000" strokeWidth="2.5" fill="none"/>
                <line x1="50" y1="122" x2="50" y2="178" stroke="#000" strokeWidth="2.5"/>

                <defs>
                  <radialGradient id="ballGradient">
                    <stop offset="0%" stopColor="#FFA500"/>
                    <stop offset="100%" stopColor="#FF8C00"/>
                  </radialGradient>
                </defs>
              </svg>
            </div>
          </div>

          {/* Customization Options - Right Side */}
          <div className="space-y-6">

            {/* Age Group Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Age Group</label>
              <div className="grid grid-cols-4 gap-2">
                {ageGroups.map((group) => (
                  <button
                    key={group}
                    onClick={() => setAgeGroup(group)}
                    className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                      ageGroup === group
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    {group}
                  </button>
                ))}
              </div>
            </div>

            {/* Sport Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Sport</label>
              <select
                value={sport}
                onChange={(e) => setSport(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:outline-none bg-white"
              >
                <option value="basketball">🏀 Basketball</option>
                <option value="soccer">⚽ Soccer</option>
                <option value="running">🏃 Running</option>
                <option value="cycling">🚴 Cycling</option>
                <option value="skiing">⛷️ Skiing</option>
              </select>
            </div>

            {/* Style Tabs */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Style</label>
              <div className="grid grid-cols-5 gap-2 mb-4">
                {(['skin', 'hair', 'jersey', 'short', 'shoes'] as StyleTab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-2 rounded-lg border-2 text-sm font-medium capitalize transition-all ${
                      activeTab === tab
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Options based on active tab */}
              <div className="space-y-3">
                {/* Skin Colors */}
                {activeTab === 'skin' && (
                  <div className="grid grid-cols-4 gap-3">
                    {skinColors.map((color) => (
                      <button
                        key={color.name}
                        onClick={() => setSkinColor(color.value)}
                        style={{ backgroundColor: color.value }}
                        className={`h-14 rounded-lg border-2 transition-all shadow-sm ${
                          skinColor === color.value
                            ? 'border-blue-500 ring-4 ring-blue-200 scale-105'
                            : 'border-gray-300 hover:border-gray-400 hover:scale-105'
                        }`}
                        title={color.name}
                      />
                    ))}
                  </div>
                )}

                {/* Hair Styles and Colors */}
                {activeTab === 'hair' && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-2">Hair Style</p>
                      <div className="grid grid-cols-3 gap-2">
                        {hairStyles.map((style) => (
                          <button
                            key={style.value}
                            onClick={() => setHairStyle(style.value)}
                            className={`px-3 py-2 rounded-lg border-2 text-xs font-medium transition-all ${
                              hairStyle === style.value
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                            }`}
                          >
                            {style.name}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-2">Hair Color</p>
                      <div className="grid grid-cols-4 gap-3">
                        {hairColors.map((color) => (
                          <button
                            key={color.name}
                            onClick={() => setHairColor(color.value)}
                            style={{ backgroundColor: color.value }}
                            className={`h-14 rounded-lg border-2 transition-all shadow-sm ${
                              hairColor === color.value
                                ? 'border-blue-500 ring-4 ring-blue-200 scale-105'
                                : 'border-gray-300 hover:border-gray-400 hover:scale-105'
                            }`}
                            title={color.name}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Jersey Colors */}
                {activeTab === 'jersey' && (
                  <div className="grid grid-cols-4 gap-3">
                    {jerseyColors.map((color) => (
                      <button
                        key={color.name}
                        onClick={() => setJerseyColor(color.value)}
                        style={{
                          backgroundColor: color.value,
                          border: color.value === '#FFFFFF' ? '2px solid #E5E7EB' : '2px solid transparent'
                        }}
                        className={`h-14 rounded-lg transition-all shadow-sm ${
                          jerseyColor === color.value
                            ? 'ring-4 ring-blue-500 scale-105'
                            : 'hover:ring-2 hover:ring-gray-400 hover:scale-105'
                        }`}
                        title={color.name}
                      />
                    ))}
                  </div>
                )}

                {/* Shorts Colors */}
                {activeTab === 'short' && (
                  <div className="grid grid-cols-4 gap-3">
                    {shortsColors.map((color) => (
                      <button
                        key={color.name}
                        onClick={() => setShortsColor(color.value)}
                        style={{
                          backgroundColor: color.value,
                          border: color.value === '#FFFFFF' ? '2px solid #E5E7EB' : '2px solid transparent'
                        }}
                        className={`h-14 rounded-lg transition-all shadow-sm ${
                          shortsColor === color.value
                            ? 'ring-4 ring-blue-500 scale-105'
                            : 'hover:ring-2 hover:ring-gray-400 hover:scale-105'
                        }`}
                        title={color.name}
                      />
                    ))}
                  </div>
                )}

                {/* Shoes Colors */}
                {activeTab === 'shoes' && (
                  <div className="grid grid-cols-4 gap-3">
                    {shoesColors.map((color) => (
                      <button
                        key={color.name}
                        onClick={() => setShoesColor(color.value)}
                        style={{
                          backgroundColor: color.value,
                          border: color.value === '#F7FAFC' ? '2px solid #E5E7EB' : '2px solid transparent'
                        }}
                        className={`h-14 rounded-lg transition-all shadow-sm ${
                          shoesColor === color.value
                            ? 'ring-4 ring-blue-500 scale-105'
                            : 'hover:ring-2 hover:ring-gray-400 hover:scale-105'
                        }`}
                        title={color.name}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Jersey Number */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Jersey Number</label>
              <input
                type="number"
                min="0"
                max="99"
                value={jerseyNumber}
                onChange={(e) => setJerseyNumber(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:outline-none text-center text-2xl font-bold bg-white"
              />
            </div>

            {/* Note about future features */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Note:</span> Shorts and Shoes customization will be available in the full version. Currently showing default options.
              </p>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              className="w-full bg-[#4361EE] hover:bg-[#3651DE] text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Save Avatar
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
