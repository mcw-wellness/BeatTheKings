'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { Logo } from '@/components/layout/Logo'
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
  const { status, update } = useSession()

  // User profile fields (collected on this page)
  const [gender, setGender] = useState<Gender>('male')
  const [dateOfBirth, setDateOfBirth] = useState<string>('')

  // Avatar customization fields
  const [skinTone, setSkinTone] = useState<SkinTone>('medium')
  const [hairStyle, setHairStyle] = useState<HairStyle>('short')
  const [hairColor, setHairColor] = useState<HairColor>('black')
  const [jerseyNumber, setJerseyNumber] = useState(10)

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [savedAvatarUrl, setSavedAvatarUrl] = useState<string | null>(null)
  const [isNewPreview, setIsNewPreview] = useState(false)
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(true)

  // Fetch user's existing profile and avatar data
  useEffect(() => {
    const fetchUserData = async (): Promise<void> => {
      try {
        // Fetch user profile (gender, DOB)
        const profileRes = await fetch('/api/users/profile')
        if (profileRes.ok) {
          const profileData = await profileRes.json()
          if (profileData.gender) {
            setGender(profileData.gender as Gender)
          }
          if (profileData.dateOfBirth) {
            setDateOfBirth(profileData.dateOfBirth.split('T')[0]) // Format as YYYY-MM-DD
            setIsFirstTimeUser(false)
          }
        }

        // Fetch existing avatar if user has one
        const avatarRes = await fetch('/api/users/avatar')

        if (avatarRes.ok) {
          const data = await avatarRes.json()
          const avatar = data.avatar

          if (avatar) {
            if (avatar.skinTone) setSkinTone(avatar.skinTone)
            if (avatar.hairStyle) setHairStyle(avatar.hairStyle)
            if (avatar.hairColor) setHairColor(avatar.hairColor)
            setIsFirstTimeUser(false)

            // If user has a saved avatar image, fetch SAS URL for it
            if (avatar.imageUrl) {
              const sasRes = await fetch('/api/avatar/url?type=user&userId=me')
              const sasData = await sasRes.json()
              if (sasRes.ok && sasData.url) {
                setSavedAvatarUrl(sasData.url)
              }
            }
          }
        }
      } catch (error) {
        console.error('Error in fetchUserData:', error)
      }
    }
    fetchUserData()
  }, [])

  // Get default avatar URL with SAS token
  const defaultAvatarUrl = useAvatarUrl({ type: 'default', gender })

  // Calculate age group from DOB for avatar generation
  const ageGroup = dateOfBirth ? calculateAgeGroup(dateOfBirth) : undefined

  // Priority: new preview > saved avatar > default
  const displayAvatarUrl = previewImage || savedAvatarUrl || defaultAvatarUrl

  // Mock equipment items - will be fetched from API
  const [items] = useState<AvatarItem[]>([
    { id: '1', name: 'Blue Jersey', itemType: 'jersey', imageUrl: '', isLocked: false },
    {
      id: '2',
      name: 'Red Jersey',
      itemType: 'jersey',
      imageUrl: '',
      isLocked: true,
      unlockRequirement: '10 Matches',
    },
    {
      id: '3',
      name: 'Gold Jersey',
      itemType: 'jersey',
      imageUrl: '',
      isLocked: true,
      unlockRequirement: '25 Matches',
    },
    { id: '4', name: 'Blue Shorts', itemType: 'shorts', imageUrl: '', isLocked: false },
    {
      id: '5',
      name: 'Black Shorts',
      itemType: 'shorts',
      imageUrl: '',
      isLocked: true,
      unlockRequirement: '5 Challenges',
    },
    { id: '6', name: 'Black Shoes', itemType: 'shoes', imageUrl: '', isLocked: false },
    {
      id: '7',
      name: 'Red Shoes',
      itemType: 'shoes',
      imageUrl: '',
      isLocked: true,
      unlockRequirement: '3 Invites',
    },
  ])

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  if (status === 'loading') return <AvatarPageSkeleton />

  const handleGeneratePreview = async (): Promise<void> => {
    // Validate required fields
    if (!dateOfBirth) {
      setError('Please enter your date of birth')
      return
    }

    setError(null)
    setIsGenerating(true)

    try {
      const res = await fetch('/api/avatar/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gender,
          skinTone,
          hairStyle,
          hairColor,
          ageGroup,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate preview')
      }

      setPreviewImage(data.imageUrl)
      setIsNewPreview(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate preview')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = async (): Promise<void> => {
    // Validate required fields
    if (!dateOfBirth) {
      setError('Please enter your date of birth')
      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      // First, update user profile with gender and DOB
      const profileRes = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gender,
          dateOfBirth,
        }),
      })

      if (!profileRes.ok) {
        const profileData = await profileRes.json()
        throw new Error(profileData.error || 'Failed to update profile')
      }

      // Then save avatar
      const avatarPayload = {
        skinTone,
        hairStyle,
        hairColor,
        ...(isNewPreview && previewImage && { previewImage }),
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
        if (!updateRes.ok) throw new Error(data.error || 'Failed to update avatar')
      } else if (!res.ok) {
        throw new Error(data.error || 'Failed to create avatar')
      }

      // Refresh the session to update hasCreatedAvatar in the JWT token
      await update()

      // Redirect to location selection (new step) or welcome
      router.push('/location')
    } catch (err) {
      console.error('Save error:', err)
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getItemsByType = (type: string): AvatarItem[] => items.filter((i) => i.itemType === type)

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 sm:p-6 pb-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          {!isFirstTimeUser ? (
            <button
              onClick={() => router.push('/welcome')}
              className="text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              ← Back
            </button>
          ) : (
            <div className="w-14" />
          )}
          <div className="w-16 h-16">
            <Logo size="lg" pulsing />
          </div>
          <div className="w-14" /> {/* Spacer for centering */}
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
          <div className="relative bg-white rounded-2xl shadow-lg overflow-hidden h-[300px] sm:h-[400px] lg:h-[500px]">
            {isGenerating ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-amber-50">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4" />
                <p className="text-gray-600 font-medium">Generating your avatar...</p>
                <p className="text-gray-400 text-sm">This may take a few seconds</p>
              </div>
            ) : displayAvatarUrl ? (
              <Image
                src={displayAvatarUrl}
                alt="Your Avatar"
                fill
                className="object-cover"
                priority
                unoptimized
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center animate-pulse text-gray-400 bg-amber-50">
                Loading...
              </div>
            )}
            {/* Preview Badge - only show for newly generated previews */}
            {isNewPreview && previewImage && !isGenerating && (
              <div className="absolute top-4 left-4 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                Preview
              </div>
            )}
            {/* Jersey Number Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
              <label className="block text-xs font-semibold text-white/80 mb-1 text-center">
                Jersey Number
              </label>
              <input
                type="number"
                min="0"
                max="99"
                value={jerseyNumber}
                onChange={(e) =>
                  setJerseyNumber(Math.min(99, Math.max(0, parseInt(e.target.value) || 0)))
                }
                className="w-full max-w-[120px] mx-auto block text-center text-3xl font-bold py-2 bg-white/90 border-2 border-yellow-400 rounded-lg focus:border-yellow-500 focus:outline-none"
                disabled={isGenerating}
              />
            </div>
          </div>

          {/* Customization Options */}
          <div className="space-y-4">
            {/* Gender Selection */}
            <div className="bg-white rounded-xl shadow p-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Gender</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setGender('male')}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-all ${
                    gender === 'male'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  Male
                </button>
                <button
                  onClick={() => setGender('female')}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-all ${
                    gender === 'female'
                      ? 'border-pink-500 bg-pink-50 text-pink-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  Female
                </button>
              </div>
            </div>

            {/* Date of Birth */}
            <div className="bg-white rounded-xl shadow p-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Date of Birth
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:outline-none text-gray-700"
              />
              {dateOfBirth && (
                <p className="text-xs text-gray-500 mt-2">
                  Age Group: <span className="font-medium">{ageGroup}</span>
                </p>
              )}
            </div>

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
      </div>

      {/* Sticky Footer Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
        <div className="flex gap-3 max-w-4xl mx-auto">
          {/* Generate Preview Button */}
          <button
            onClick={handleGeneratePreview}
            disabled={isGenerating || isSubmitting}
            className="flex-1 min-h-[48px] bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200"
          >
            {isGenerating ? 'Generating...' : previewImage ? 'Regenerate' : 'Generate Preview'}
          </button>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={isSubmitting || isGenerating}
            className="flex-1 min-h-[48px] bg-[#4361EE] hover:bg-[#3651DE] disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200"
          >
            {isSubmitting ? 'Saving...' : 'Save & Continue'}
          </button>
        </div>
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
