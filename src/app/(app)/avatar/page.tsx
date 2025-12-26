'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Logo } from '@/components/layout/Logo'
import { AvatarPreview } from '@/components/avatar/AvatarPreview'
import {
  SKIN_TONE_COLORS,
  HAIR_COLOR_HEX,
  VALID_SKIN_TONES,
  VALID_HAIR_STYLES,
  VALID_HAIR_COLORS,
} from '@/components/avatar/AvatarPreview'

type SkinTone = (typeof VALID_SKIN_TONES)[number]
type HairStyle = (typeof VALID_HAIR_STYLES)[number]
type HairColor = (typeof VALID_HAIR_COLORS)[number]

interface AvatarItem {
  id: string
  name: string
  itemType: string
  imageUrl: string
  isLocked: boolean
  unlockRequirement?: string
}

export default function AvatarPage(): JSX.Element {
  return (
    <Suspense fallback={<AvatarPageSkeleton />}>
      <AvatarPageContent />
    </Suspense>
  )
}

function AvatarPageSkeleton(): JSX.Element {
  return (
    <main className="min-h-screen bg-white flex items-center justify-center">
      <div className="animate-pulse text-gray-400">Loading...</div>
    </main>
  )
}

function AvatarPageContent(): JSX.Element {
  const router = useRouter()
  const { status } = useSession()

  const [skinTone, setSkinTone] = useState<SkinTone>('medium')
  const [hairStyle, setHairStyle] = useState<HairStyle>('short')
  const [hairColor, setHairColor] = useState<HairColor>('black')
  const [jerseyNumber, setJerseyNumber] = useState(10)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Mock equipment items - will be fetched from API
  const [items] = useState<AvatarItem[]>([
    { id: '1', name: 'Blue Jersey', itemType: 'jersey', imageUrl: '', isLocked: false },
    { id: '2', name: 'Red Jersey', itemType: 'jersey', imageUrl: '', isLocked: true, unlockRequirement: '10 Matches' },
    { id: '3', name: 'Gold Jersey', itemType: 'jersey', imageUrl: '', isLocked: true, unlockRequirement: '25 Matches' },
    { id: '4', name: 'Blue Shorts', itemType: 'shorts', imageUrl: '', isLocked: false },
    { id: '5', name: 'Black Shorts', itemType: 'shorts', imageUrl: '', isLocked: true, unlockRequirement: '5 Challenges' },
    { id: '6', name: 'Black Shoes', itemType: 'shoes', imageUrl: '', isLocked: false },
    { id: '7', name: 'Red Shoes', itemType: 'shoes', imageUrl: '', isLocked: true, unlockRequirement: '3 Invites' },
  ])

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  if (status === 'loading') return <AvatarPageSkeleton />

  const handleSave = async (): Promise<void> => {
    setError(null)
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/users/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skinTone, hairStyle, hairColor }),
      })

      let data = await res.json()

      if (res.status === 409) {
        const updateRes = await fetch('/api/users/avatar', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ skinTone, hairStyle, hairColor }),
        })
        data = await updateRes.json()
        if (!updateRes.ok) throw new Error(data.error || 'Failed to update avatar')
      } else if (!res.ok) {
        throw new Error(data.error || 'Failed to create avatar')
      }

      router.push('/welcome')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setIsSubmitting(false)
    }
  }

  const getItemsByType = (type: string): AvatarItem[] => items.filter((i) => i.itemType === type)

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16">
            <Logo size="lg" pulsing />
          </div>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-2">
          Create Your Avatar
        </h1>
        <p className="text-gray-600 text-center mb-6 text-sm">
          Customize your look and unlock more items as you play
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Avatar Preview */}
          <div className="bg-white rounded-2xl shadow-lg p-4 flex flex-col items-center">
            <AvatarPreview
              skinTone={skinTone}
              hairStyle={hairStyle}
              hairColor={hairColor}
              jerseyNumber={jerseyNumber}
            />
            {/* Jersey Number */}
            <div className="mt-4 w-full max-w-[200px]">
              <label className="block text-xs font-semibold text-gray-700 mb-1 text-center">
                Jersey Number
              </label>
              <input
                type="number"
                min="0"
                max="99"
                value={jerseyNumber}
                onChange={(e) => setJerseyNumber(Math.min(99, Math.max(0, parseInt(e.target.value) || 0)))}
                className="w-full text-center text-2xl font-bold py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Customization Options */}
          <div className="space-y-4">
            {/* Skin Tone */}
            <div className="bg-white rounded-xl shadow p-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Skin Tone</label>
              <div className="grid grid-cols-5 gap-2">
                {VALID_SKIN_TONES.map((tone) => (
                  <button
                    key={tone}
                    onClick={() => setSkinTone(tone)}
                    style={{ backgroundColor: SKIN_TONE_COLORS[tone] }}
                    className={`h-10 rounded-lg border-2 transition-all ${
                      skinTone === tone
                        ? 'border-blue-500 ring-2 ring-blue-200 scale-105'
                        : 'border-gray-300 hover:scale-105'
                    }`}
                    title={tone}
                  />
                ))}
              </div>
            </div>

            {/* Hair Style */}
            <div className="bg-white rounded-xl shadow p-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Hair Style</label>
              <div className="grid grid-cols-4 gap-2">
                {VALID_HAIR_STYLES.map((style) => (
                  <button
                    key={style}
                    onClick={() => setHairStyle(style)}
                    className={`px-2 py-2 rounded-lg border-2 text-xs font-medium capitalize transition-all ${
                      hairStyle === style
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            {/* Hair Color */}
            <div className="bg-white rounded-xl shadow p-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Hair Color</label>
              <div className="grid grid-cols-6 gap-2">
                {VALID_HAIR_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setHairColor(color)}
                    style={{ backgroundColor: HAIR_COLOR_HEX[color] }}
                    className={`h-10 rounded-lg border-2 transition-all ${
                      hairColor === color
                        ? 'border-blue-500 ring-2 ring-blue-200 scale-105'
                        : 'border-gray-300 hover:scale-105'
                    } ${color === 'white' ? 'border-gray-400' : ''}`}
                    title={color}
                  />
                ))}
              </div>
            </div>

            {/* Equipment Section */}
            <div className="bg-white rounded-xl shadow p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Equipment</h3>

              {/* Jersey */}
              <div className="mb-3">
                <span className="text-xs text-gray-500 mb-1 block">Jersey</span>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {getItemsByType('jersey').map((item) => (
                    <ItemButton key={item.id} item={item} />
                  ))}
                </div>
              </div>

              {/* Shorts */}
              <div className="mb-3">
                <span className="text-xs text-gray-500 mb-1 block">Shorts</span>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {getItemsByType('shorts').map((item) => (
                    <ItemButton key={item.id} item={item} />
                  ))}
                </div>
              </div>

              {/* Shoes */}
              <div>
                <span className="text-xs text-gray-500 mb-1 block">Shoes</span>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {getItemsByType('shoes').map((item) => (
                    <ItemButton key={item.id} item={item} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={isSubmitting}
          className="w-full max-w-md mx-auto block mt-6 min-h-[48px] bg-[#4361EE] hover:bg-[#3651DE] disabled:bg-gray-400 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 text-lg"
        >
          {isSubmitting ? 'Saving...' : 'Save & Continue'}
        </button>
      </div>
    </main>
  )
}

function ItemButton({ item }: { item: AvatarItem }): JSX.Element {
  return (
    <button
      disabled={item.isLocked}
      className={`relative flex-shrink-0 w-16 h-16 rounded-lg border-2 flex items-center justify-center transition-all ${
        item.isLocked
          ? 'border-gray-200 bg-gray-100 cursor-not-allowed'
          : 'border-blue-500 bg-blue-50 hover:bg-blue-100'
      }`}
      title={item.isLocked ? `Unlock: ${item.unlockRequirement}` : item.name}
    >
      {item.isLocked ? (
        <div className="text-center">
          <svg
            className="w-5 h-5 mx-auto text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <span className="text-[8px] text-gray-400 mt-0.5 block leading-tight">
            {item.unlockRequirement}
          </span>
        </div>
      ) : (
        <span className="text-xs font-medium text-blue-700 text-center px-1">{item.name}</span>
      )}
    </button>
  )
}
