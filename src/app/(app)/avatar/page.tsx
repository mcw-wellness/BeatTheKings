'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { useAvatarUrl } from '@/lib/hooks/useAvatarUrl'
import {
  SKIN_TONE_COLORS,
  HAIR_COLOR_HEX,
  VALID_SKIN_TONES,
  VALID_HAIR_STYLES,
  VALID_HAIR_COLORS,
} from '@/components/avatar/AvatarPreview'
import { calculateAgeGroup } from '@/lib/avatar/prompts'

type SkinTone = (typeof VALID_SKIN_TONES)[number]
type HairStyle = (typeof VALID_HAIR_STYLES)[number]
type HairColor = (typeof VALID_HAIR_COLORS)[number]
type Gender = 'male' | 'female'
type TabType = 'skin' | 'hair' | 'jerseyNumber' | 'jerseyColor' | 'shoes'

const JERSEY_COLORS = [
  { name: 'Navy', value: '#1a1a4e' },
  { name: 'Red', value: '#dc2626' },
  { name: 'Green', value: '#16a34a' },
  { name: 'White', value: '#ffffff' },
  { name: 'Black', value: '#1f2937' },
  { name: 'Purple', value: '#7c3aed' },
]

export default function AvatarPage(): JSX.Element {
  return (
    <Suspense fallback={<AvatarPageSkeleton />}>
      <AvatarPageContent />
    </Suspense>
  )
}

function AvatarPageSkeleton(): JSX.Element {
  return (
    <main className="min-h-screen bg-transparent flex items-center justify-center">
      <div className="animate-pulse text-white/60">Loading...</div>
    </main>
  )
}

function AvatarPageContent(): JSX.Element {
  const router = useRouter()
  const { status, update } = useSession()

  // User profile fields
  const [gender, setGender] = useState<Gender>('male')
  const [dateOfBirth, setDateOfBirth] = useState<string>('')

  // Avatar customization fields
  const [skinTone, setSkinTone] = useState<SkinTone>('medium')
  const [hairStyle, setHairStyle] = useState<HairStyle>('short')
  const [hairColor, setHairColor] = useState<HairColor>('black')
  const [jerseyNumber, setJerseyNumber] = useState('9')
  const [jerseyColor, setJerseyColor] = useState('#1a1a4e')

  // UI state
  const [activeTab, setActiveTab] = useState<TabType>('hair')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoadingAvatar, setIsLoadingAvatar] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [savedAvatarUrl, setSavedAvatarUrl] = useState<string | null>(null)

  // Fetch user's existing profile and avatar data
  useEffect(() => {
    const fetchUserData = async (): Promise<void> => {
      setIsLoadingAvatar(true)
      try {
        const profileRes = await fetch('/api/users/profile')
        if (profileRes.ok) {
          const profileData = await profileRes.json()
          const user = profileData.user || profileData
          if (user.gender) setGender(user.gender as Gender)
          if (user.dateOfBirth) setDateOfBirth(user.dateOfBirth.split('T')[0])
        }

        const avatarRes = await fetch('/api/users/avatar')
        if (avatarRes.ok) {
          const data = await avatarRes.json()
          const avatar = data.avatar
          if (avatar) {
            if (avatar.skinTone) setSkinTone(avatar.skinTone)
            if (avatar.hairStyle) setHairStyle(avatar.hairStyle)
            if (avatar.hairColor) setHairColor(avatar.hairColor)
            const equipment = data.equipment
            if (equipment?.basketball?.jerseyNumber != null) {
              setJerseyNumber(String(equipment.basketball.jerseyNumber))
            }
            if (avatar.imageUrl) {
              const sasRes = await fetch('/api/avatar/url?type=user&userId=me')
              const sasData = await sasRes.json()
              if (sasRes.ok && sasData.url) setSavedAvatarUrl(sasData.url)
            }
          }
        }
      } catch (error) {
        console.error('Error in fetchUserData:', error)
      } finally {
        setIsLoadingAvatar(false)
      }
    }
    fetchUserData()
  }, [])

  const defaultAvatarUrl = useAvatarUrl({ type: 'default', gender })
  const ageGroup = dateOfBirth ? calculateAgeGroup(dateOfBirth) : undefined
  const displayAvatarUrl = previewImage || savedAvatarUrl || defaultAvatarUrl

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  if (status === 'loading') return <AvatarPageSkeleton />

  // Generate preview based on current selections
  const handleGeneratePreview = async (): Promise<void> => {
    setError(null)
    setIsGenerating(true)

    try {
      const previewRes = await fetch('/api/avatar/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gender,
          skinTone,
          hairStyle,
          hairColor,
          ageGroup,
          jerseyNumber: parseInt(jerseyNumber) || 9,
          jerseyColor,
        }),
      })

      const previewData = await previewRes.json()
      if (!previewRes.ok) throw new Error(previewData.error || 'Failed to generate')

      setPreviewImage(previewData.imageUrl)
    } catch (err) {
      console.error('Generate error:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate preview')
    } finally {
      setIsGenerating(false)
    }
  }

  // Save current avatar settings
  const handleSave = async (): Promise<void> => {
    setError(null)
    setIsSubmitting(true)

    try {
      const avatarPayload = {
        skinTone,
        hairStyle,
        hairColor,
        jerseyNumber: parseInt(jerseyNumber) || 9,
        previewImage: previewImage || undefined, // Only include if we have a new preview
      }

      const res = await fetch('/api/users/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(avatarPayload),
      })

      let data = await res.json()

      if (res.status === 409) {
        const updateRes = await fetch('/api/users/avatar', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(avatarPayload),
        })
        data = await updateRes.json()
        if (!updateRes.ok) throw new Error(data.error || 'Failed to update')
      } else if (!res.ok) {
        throw new Error(data.error || 'Failed to create')
      }

      await update()
      router.push('/welcome')
    } catch (err) {
      console.error('Save error:', err)
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  const tabs: { id: TabType; label: string }[] = [
    { id: 'skin', label: 'Skin' },
    { id: 'hair', label: 'Hair' },
    { id: 'jerseyNumber', label: 'Jersey Number' },
    { id: 'jerseyColor', label: 'Jersey Color' },
    { id: 'shoes', label: 'Shoes' },
  ]

  return (
    <main
      className="min-h-screen flex flex-col relative"
      style={{
        backgroundImage: 'url(/backgrounds/stadium.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Light overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none" />

      {/* Header */}
      <div className="p-4 pt-6 relative z-10">
        <h1 className="text-2xl font-bold text-white">
          {savedAvatarUrl ? 'Edit Avatar' : 'Create Avatar'}
        </h1>
        <p className="text-white/60 text-sm">Basketball</p>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 bg-red-500/20 border border-red-500/30 text-red-200 px-4 py-2 rounded-lg text-sm relative z-10">
          {error}
        </div>
      )}

      {/* Avatar Display - takes up most of the screen */}
      <div className="flex-1 relative flex items-center justify-center px-4 z-10">
        {isGenerating ? (
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/30 border-t-white mb-4" />
            <p className="text-white/60">Generating your avatar...</p>
          </div>
        ) : isLoadingAvatar && !previewImage ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/30 border-t-white" />
          </div>
        ) : displayAvatarUrl ? (
          <div className="relative w-full max-w-sm h-[50vh] min-h-[300px]">
            <Image
              src={displayAvatarUrl}
              alt="Your Avatar"
              fill
              className="object-contain"
              priority
              unoptimized
            />
          </div>
        ) : (
          <div className="text-white/40">Loading...</div>
        )}
      </div>

      {/* Tab Content Area */}
      <div className="px-4 py-3 min-h-[100px] relative z-10">
        {activeTab === 'skin' && (
          <div className="flex gap-3 justify-center flex-wrap">
            {VALID_SKIN_TONES.map((tone) => (
              <button
                key={tone}
                onClick={() => setSkinTone(tone)}
                style={{ backgroundColor: SKIN_TONE_COLORS[tone] }}
                className={`w-12 h-12 rounded-full border-2 transition-all ${
                  skinTone === tone
                    ? 'border-white scale-110'
                    : 'border-white/20 hover:border-white/40'
                }`}
              />
            ))}
          </div>
        )}

        {activeTab === 'hair' && (
          <div className="space-y-3">
            <div className="flex gap-2 justify-center flex-wrap">
              {VALID_HAIR_STYLES.map((style) => (
                <button
                  key={style}
                  onClick={() => setHairStyle(style)}
                  className={`px-4 py-2 rounded-lg border text-sm capitalize transition-all ${
                    hairStyle === style
                      ? 'border-white bg-white/20 text-white'
                      : 'border-white/20 text-white/60 hover:border-white/40'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
            <div className="flex gap-2 justify-center">
              {VALID_HAIR_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setHairColor(color)}
                  style={{ backgroundColor: HAIR_COLOR_HEX[color] }}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    hairColor === color
                      ? 'border-white scale-110'
                      : 'border-white/20 hover:border-white/40'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'jerseyNumber' && (
          <div className="flex justify-center">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={2}
              value={jerseyNumber}
              onFocus={(e) => e.target.select()}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 2)
                setJerseyNumber(val)
              }}
              onBlur={() => {
                if (jerseyNumber === '') setJerseyNumber('0')
              }}
              className="w-24 text-center text-4xl font-bold py-3 bg-white/10 border-2 border-white/30 rounded-lg text-white focus:border-white focus:outline-none"
            />
          </div>
        )}

        {activeTab === 'jerseyColor' && (
          <div className="flex gap-3 justify-center flex-wrap">
            {JERSEY_COLORS.map((color) => (
              <button
                key={color.value}
                onClick={() => setJerseyColor(color.value)}
                style={{ backgroundColor: color.value }}
                className={`w-12 h-12 rounded-full border-2 transition-all ${
                  jerseyColor === color.value
                    ? 'border-white scale-110'
                    : 'border-white/20 hover:border-white/40'
                } ${color.value === '#ffffff' ? 'border-white/40' : ''}`}
                title={color.name}
              />
            ))}
          </div>
        )}

        {activeTab === 'shoes' && (
          <div className="text-center text-white/40 text-sm py-4">
            Shoes customization coming soon
          </div>
        )}
      </div>

      {/* Tab Bar */}
      <div className="border-t border-white/10 relative z-10">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-max px-4 py-3 text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'text-white border-b-2 border-white'
                  : 'text-white/50 hover:text-white/70'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-4 border-t border-white/10 space-y-2 relative z-10">
        <button
          onClick={handleGeneratePreview}
          disabled={isSubmitting || isGenerating}
          className="w-full py-3 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 font-semibold rounded-lg transition-all disabled:opacity-50 border border-yellow-500/30"
        >
          {isGenerating ? 'Generating...' : 'Generate Preview'}
        </button>
        <button
          onClick={handleSave}
          disabled={isSubmitting || isGenerating}
          className="w-full py-3 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-lg transition-all disabled:opacity-50 border border-white/30"
        >
          {isSubmitting ? 'Saving...' : 'Save Avatar'}
        </button>
      </div>

      {/* Sponsor Footer */}
      <div className="py-3 text-center relative z-10">
        <p className="text-xs text-white/30">BB Championship sponsored by DONK</p>
      </div>
    </main>
  )
}
