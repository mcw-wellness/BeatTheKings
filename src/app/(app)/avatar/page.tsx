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

interface ProgressValue {
  current: number
  required: number
}

interface UnlockProgress {
  matches: ProgressValue | null
  challenges: ProgressValue | null
  invites: ProgressValue | null
  xp: ProgressValue | null
}

interface AvatarItem {
  id: string
  name: string
  itemType: string
  imageUrl: string | null
  isUnlocked: boolean
  unlockedVia: 'default' | 'achievement' | 'purchase' | null
  canUnlock: boolean
  canPurchase: boolean
  requiredMatches: number | null
  requiredChallenges: number | null
  requiredInvites: number | null
  requiredXp: number | null
  rpCost: number | null
  progress: UnlockProgress
}

interface UserStats {
  matchesPlayed: number
  challengesCompleted: number
  usersInvited: number
  totalXp: number
  availableRp: number
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
  const { data: session, status, update } = useSession()

  // User profile fields (collected on this page)
  const [gender, setGender] = useState<Gender>('male')
  const [dateOfBirth, setDateOfBirth] = useState<string>('')
  const [dobDay, setDobDay] = useState<string>('')
  const [dobMonth, setDobMonth] = useState<string>('')
  const [dobYear, setDobYear] = useState<string>('')

  // Avatar customization fields
  const [skinTone, setSkinTone] = useState<SkinTone>('medium')
  const [hairStyle, setHairStyle] = useState<HairStyle>('short')
  const [hairColor, setHairColor] = useState<HairColor>('black')
  const [jerseyNumber, setJerseyNumber] = useState('10')

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [savedAvatarUrl, setSavedAvatarUrl] = useState<string | null>(null)
  const [isNewPreview, setIsNewPreview] = useState(false)

  // Fetch user's existing profile and avatar data
  useEffect(() => {
    const fetchUserData = async (): Promise<void> => {
      try {
        // Fetch user profile (gender, DOB)
        const profileRes = await fetch('/api/users/profile')
        if (profileRes.ok) {
          const profileData = await profileRes.json()
          const user = profileData.user || profileData // Handle both structures
          if (user.gender) {
            setGender(user.gender as Gender)
          }
          if (user.dateOfBirth) {
            const dob = user.dateOfBirth.split('T')[0] // Format as YYYY-MM-DD
            setDateOfBirth(dob)
            const [year, month, day] = dob.split('-')
            setDobYear(year)
            setDobMonth(month)
            setDobDay(day)
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

            // Load jersey number from equipment
            const equipment = data.equipment
            if (equipment?.basketball?.jerseyNumber != null) {
              setJerseyNumber(String(equipment.basketball.jerseyNumber))
            }

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

  // Combine DOB parts into dateOfBirth string
  useEffect(() => {
    if (dobYear && dobMonth && dobDay) {
      const paddedMonth = dobMonth.padStart(2, '0')
      const paddedDay = dobDay.padStart(2, '0')
      setDateOfBirth(`${dobYear}-${paddedMonth}-${paddedDay}`)
    } else {
      setDateOfBirth('')
    }
  }, [dobDay, dobMonth, dobYear])

  // Get default avatar URL with SAS token
  const defaultAvatarUrl = useAvatarUrl({ type: 'default', gender })

  // Calculate age group from DOB for avatar generation
  const ageGroup = dateOfBirth ? calculateAgeGroup(dateOfBirth) : undefined

  // Priority: new preview > saved avatar > default
  const displayAvatarUrl = previewImage || savedAvatarUrl || defaultAvatarUrl

  // Equipment items fetched from API
  const [items, setItems] = useState<AvatarItem[]>([])
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [isLoadingItems, setIsLoadingItems] = useState(true)

  // Fetch items and user stats
  useEffect(() => {
    const fetchItems = async (): Promise<void> => {
      try {
        const res = await fetch('/api/items')
        if (res.ok) {
          const data = await res.json()
          setItems(data.items || [])
          setUserStats(data.stats || null)
        }
      } catch (error) {
        console.error('Error fetching items:', error)
      } finally {
        setIsLoadingItems(false)
      }
    }
    fetchItems()
  }, [])

  // Unlock or purchase an item
  const handleUnlockItem = async (
    itemId: string,
    method: 'achievement' | 'purchase'
  ): Promise<void> => {
    try {
      const res = await fetch(`/api/items/${itemId}/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        // Refresh items to get updated unlock status
        const itemsRes = await fetch('/api/items')
        if (itemsRes.ok) {
          const itemsData = await itemsRes.json()
          setItems(itemsData.items || [])
          setUserStats(itemsData.stats || null)
        }
      } else {
        setError(data.error || 'Failed to unlock item')
      }
    } catch (error) {
      console.error('Error unlocking item:', error)
      setError('Failed to unlock item')
    }
  }

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
          jerseyNumber: parseInt(jerseyNumber) || 10,
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
        jerseyNumber: parseInt(jerseyNumber) || 10,
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
          {session?.user?.hasCreatedAvatar ? (
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
              <div className="grid grid-cols-3 gap-2">
                {/* Day */}
                <div>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Day"
                    value={dobDay}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 2)
                      const num = parseInt(val)
                      if (val === '' || (num >= 1 && num <= 31)) {
                        setDobDay(val)
                      }
                    }}
                    className="w-full px-3 py-3 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:outline-none text-gray-700 text-center"
                  />
                </div>
                {/* Month */}
                <div>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Month"
                    value={dobMonth}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 2)
                      const num = parseInt(val)
                      if (val === '' || (num >= 1 && num <= 12)) {
                        setDobMonth(val)
                      }
                    }}
                    className="w-full px-3 py-3 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:outline-none text-gray-700 text-center"
                  />
                </div>
                {/* Year */}
                <div>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Year"
                    value={dobYear}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 4)
                      setDobYear(val)
                    }}
                    className="w-full px-3 py-3 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:outline-none text-gray-700 text-center"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">DD / MM / YYYY</p>
              {dateOfBirth && (
                <p className="text-xs text-gray-500 mt-1">
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
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-semibold text-gray-700">Equipment</h3>
                {userStats && (
                  <span className="text-xs text-amber-600 font-medium">
                    {userStats.availableRp} RP
                  </span>
                )}
              </div>

              {isLoadingItems ? (
                <div className="text-center py-4 text-gray-400 text-sm">Loading items...</div>
              ) : items.length === 0 ? (
                <div className="text-center py-4 text-gray-400 text-sm">No items available</div>
              ) : (
                <>
                  {/* Jersey */}
                  {getItemsByType('jersey').length > 0 && (
                    <div className="mb-3">
                      <span className="text-xs text-gray-500 mb-1 block">Jersey</span>
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {getItemsByType('jersey').map((item) => (
                          <ItemButton key={item.id} item={item} onUnlock={handleUnlockItem} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Shorts */}
                  {getItemsByType('shorts').length > 0 && (
                    <div className="mb-3">
                      <span className="text-xs text-gray-500 mb-1 block">Shorts</span>
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {getItemsByType('shorts').map((item) => (
                          <ItemButton key={item.id} item={item} onUnlock={handleUnlockItem} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Shoes */}
                  {getItemsByType('shoes').length > 0 && (
                    <div className="mb-3">
                      <span className="text-xs text-gray-500 mb-1 block">Shoes</span>
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {getItemsByType('shoes').map((item) => (
                          <ItemButton key={item.id} item={item} onUnlock={handleUnlockItem} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Hair */}
                  {getItemsByType('hair').length > 0 && (
                    <div className="mb-3">
                      <span className="text-xs text-gray-500 mb-1 block">Hair</span>
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {getItemsByType('hair').map((item) => (
                          <ItemButton key={item.id} item={item} onUnlock={handleUnlockItem} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Accessory */}
                  {getItemsByType('accessory').length > 0 && (
                    <div>
                      <span className="text-xs text-gray-500 mb-1 block">Accessory</span>
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {getItemsByType('accessory').map((item) => (
                          <ItemButton key={item.id} item={item} onUnlock={handleUnlockItem} />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
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

interface ItemButtonProps {
  item: AvatarItem
  onUnlock: (itemId: string, method: 'achievement' | 'purchase') => Promise<void>
}

function ItemButton({ item, onUnlock }: ItemButtonProps): JSX.Element {
  const [isUnlocking, setIsUnlocking] = useState(false)

  // Get the primary progress for display
  const getProgressText = (): string => {
    if (item.progress.matches) {
      return `${item.progress.matches.current}/${item.progress.matches.required}`
    }
    if (item.progress.challenges) {
      return `${item.progress.challenges.current}/${item.progress.challenges.required}`
    }
    if (item.progress.invites) {
      return `${item.progress.invites.current}/${item.progress.invites.required}`
    }
    if (item.progress.xp) {
      return `${item.progress.xp.current}/${item.progress.xp.required}`
    }
    return ''
  }

  const getProgressLabel = (): string => {
    if (item.progress.matches) return 'matches'
    if (item.progress.challenges) return 'challenges'
    if (item.progress.invites) return 'invites'
    if (item.progress.xp) return 'XP'
    return ''
  }

  const handleUnlock = async (method: 'achievement' | 'purchase'): Promise<void> => {
    setIsUnlocking(true)
    await onUnlock(item.id, method)
    setIsUnlocking(false)
  }

  // UNLOCKED item
  if (item.isUnlocked) {
    return (
      <button
        className="relative flex-shrink-0 w-16 h-16 rounded-lg border-2 border-blue-500 bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition-all"
        title={item.name}
      >
        <span className="text-xs font-medium text-blue-700 text-center px-1">{item.name}</span>
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </button>
    )
  }

  // CAN UNLOCK (requirements met)
  if (item.canUnlock) {
    return (
      <button
        onClick={() => handleUnlock('achievement')}
        disabled={isUnlocking}
        className="relative flex-shrink-0 w-16 h-16 rounded-lg border-2 border-green-500 bg-green-50 hover:bg-green-100 flex flex-col items-center justify-center transition-all"
        title={`Unlock ${item.name}`}
      >
        {isUnlocking ? (
          <div className="animate-spin w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full" />
        ) : (
          <>
            <span className="text-[10px] font-bold text-green-600">Ready!</span>
            <span className="text-[8px] text-green-600 mt-0.5">Unlock</span>
          </>
        )}
      </button>
    )
  }

  // CAN PURCHASE
  if (item.canPurchase && item.rpCost) {
    return (
      <button
        onClick={() => handleUnlock('purchase')}
        disabled={isUnlocking}
        className="relative flex-shrink-0 w-16 h-16 rounded-lg border-2 border-amber-500 bg-amber-50 hover:bg-amber-100 flex flex-col items-center justify-center transition-all"
        title={`Buy ${item.name} for ${item.rpCost} RP`}
      >
        {isUnlocking ? (
          <div className="animate-spin w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full" />
        ) : (
          <>
            <span className="text-[10px] font-bold text-amber-600">{item.rpCost} RP</span>
            <span className="text-[8px] text-amber-600 mt-0.5">Buy</span>
          </>
        )}
      </button>
    )
  }

  // LOCKED with progress
  const progressText = getProgressText()
  const progressLabel = getProgressLabel()

  return (
    <div
      className="relative flex-shrink-0 w-16 h-16 rounded-lg border-2 border-gray-200 bg-gray-100 flex flex-col items-center justify-center cursor-not-allowed"
      title={item.name}
    >
      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
        />
      </svg>
      {progressText && (
        <>
          <span className="text-[9px] text-gray-500 font-medium mt-0.5">{progressText}</span>
          <span className="text-[7px] text-gray-400 leading-tight">{progressLabel}</span>
        </>
      )}
      {item.rpCost && !progressText && (
        <span className="text-[8px] text-gray-400 mt-0.5">{item.rpCost} RP</span>
      )}
    </div>
  )
}
