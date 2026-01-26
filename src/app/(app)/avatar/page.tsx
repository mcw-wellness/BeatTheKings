'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useAvatarUrl } from '@/lib/hooks/useAvatarUrl'
import {
  VALID_SKIN_TONES,
  VALID_HAIR_STYLES,
  VALID_HAIR_COLORS,
} from '@/components/avatar/AvatarPreview'
import { calculateAgeGroup } from '@/lib/avatar/prompts'
import { SkinToneSelector } from '@/components/avatar/SkinToneSelector'
import { HairSelector } from '@/components/avatar/HairSelector'
import { JerseyNumberInput, JerseyColorSelector } from '@/components/avatar/JerseySelector'
import { ShoeSelector, type ShoeItem } from '@/components/avatar/ShoeSelector'
import { JerseyUnlockSelector, type JerseyItem } from '@/components/avatar/JerseyUnlockSelector'
import { AvatarDisplay } from '@/components/avatar/AvatarDisplay'
import { ActionButtons, TabBar } from '@/components/avatar/AvatarActions'
import { Logo } from '@/components/layout/Logo'

type SkinTone = (typeof VALID_SKIN_TONES)[number]
type HairStyle = (typeof VALID_HAIR_STYLES)[number]
type HairColor = (typeof VALID_HAIR_COLORS)[number]
type TabType = 'skin' | 'hair' | 'jerseyNumber' | 'jerseyColor' | 'jersey' | 'shoes'

export default function AvatarPage(): JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-white/60">Loading...</div>
        </div>
      }
    >
      <AvatarPageContent />
    </Suspense>
  )
}

function AvatarPageContent(): JSX.Element {
  const router = useRouter()
  const { status, update } = useSession()

  const [gender, setGender] = useState<'male' | 'female'>('male')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [skinTone, setSkinTone] = useState<SkinTone>('medium')
  const [hairStyle, setHairStyle] = useState<HairStyle>('short')
  const [hairColor, setHairColor] = useState<HairColor>('black')
  const [jerseyNumber, setJerseyNumber] = useState('9')
  const [jerseyColor, setJerseyColor] = useState('#1a1a4e')
  const [shoes, setShoes] = useState<ShoeItem[]>([])
  const [selectedShoeId, setSelectedShoeId] = useState<string | null>(null)
  const [jerseys, setJerseys] = useState<JerseyItem[]>([])
  const [selectedJerseyId, setSelectedJerseyId] = useState<string | null>(null)
  const [isUnlocking, setIsUnlocking] = useState(false)
  const [isUnlockingJersey, setIsUnlockingJersey] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('hair')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoadingAvatar, setIsLoadingAvatar] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [savedAvatarUrl, setSavedAvatarUrl] = useState<string | null>(null)

  useEffect(() => {
    fetchUserData()
  }, [])
  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  const defaultAvatarUrl = useAvatarUrl({ type: 'default', gender })
  const displayAvatarUrl = previewImage || savedAvatarUrl || defaultAvatarUrl
  const ageGroup = dateOfBirth ? calculateAgeGroup(dateOfBirth) : undefined

  async function fetchUserData(): Promise<void> {
    setIsLoadingAvatar(true)
    try {
      const [profileRes, avatarRes, shoesRes, jerseysRes] = await Promise.all([
        fetch('/api/users/profile'),
        fetch('/api/users/avatar'),
        fetch('/api/items?type=shoes'),
        fetch('/api/items?type=jersey'),
      ])
      if (profileRes.ok) {
        const { user } = await profileRes.json()
        if (user?.gender) setGender(user.gender)
        if (user?.dateOfBirth) setDateOfBirth(user.dateOfBirth.split('T')[0])
      }
      if (avatarRes.ok) {
        const { avatar, equipment } = await avatarRes.json()
        if (avatar?.skinTone) setSkinTone(avatar.skinTone)
        if (avatar?.hairStyle) setHairStyle(avatar.hairStyle)
        if (avatar?.hairColor) setHairColor(avatar.hairColor)
        if (equipment?.basketball?.jerseyNumber != null)
          setJerseyNumber(String(equipment.basketball.jerseyNumber))
        if (equipment?.basketball?.shoesItemId) setSelectedShoeId(equipment.basketball.shoesItemId)
        if (equipment?.basketball?.jersey?.id) setSelectedJerseyId(equipment.basketball.jersey.id)
        if (avatar?.imageUrl) {
          const sasRes = await fetch('/api/avatar/url?type=user&userId=me')
          if (sasRes.ok) {
            const { url } = await sasRes.json()
            if (url) setSavedAvatarUrl(url)
          }
        }
      }
      if (shoesRes.ok) {
        const { items } = await shoesRes.json()
        setShoes(items || [])
        setSelectedShoeId(
          (cur) => cur || items?.find((s: ShoeItem) => s.isDefault && s.isUnlocked)?.id || null
        )
      }
      if (jerseysRes.ok) {
        const { items } = await jerseysRes.json()
        setJerseys(items || [])
        setSelectedJerseyId(
          (cur) => cur || items?.find((j: JerseyItem) => j.isDefault && j.isUnlocked)?.id || null
        )
      }
    } catch (e) {
      console.error('fetchUserData error:', e)
    } finally {
      setIsLoadingAvatar(false)
    }
  }

  const handleUnlockShoe = async (shoeId: string): Promise<void> => {
    setIsUnlocking(true)
    try {
      const res = await fetch(`/api/items/${shoeId}/unlock`, { method: 'POST' })
      if (res.ok) {
        const itemsRes = await fetch('/api/items?type=shoes')
        if (itemsRes.ok) setShoes((await itemsRes.json()).items || [])
        setSelectedShoeId(shoeId)
      } else {
        setError((await res.json()).error || 'Failed to unlock')
      }
    } catch {
      setError('Failed to unlock shoe')
    } finally {
      setIsUnlocking(false)
    }
  }

  const handleUnlockJersey = async (jerseyId: string): Promise<void> => {
    setIsUnlockingJersey(true)
    try {
      const res = await fetch(`/api/items/${jerseyId}/unlock`, { method: 'POST' })
      if (res.ok) {
        const itemsRes = await fetch('/api/items?type=jersey')
        if (itemsRes.ok) setJerseys((await itemsRes.json()).items || [])
        setSelectedJerseyId(jerseyId)
      } else {
        setError((await res.json()).error || 'Failed to unlock')
      }
    } catch {
      setError('Failed to unlock jersey')
    } finally {
      setIsUnlockingJersey(false)
    }
  }

  const handleGeneratePreview = async (): Promise<void> => {
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
          jerseyNumber: parseInt(jerseyNumber) || 9,
          jerseyColor,
          jerseyItemId: selectedJerseyId || undefined,
          shoesItemId: selectedShoeId || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate')
      setPreviewImage(data.imageUrl)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = async (): Promise<void> => {
    setError(null)
    setIsSubmitting(true)
    try {
      const payload = {
        skinTone,
        hairStyle,
        hairColor,
        jerseyNumber: parseInt(jerseyNumber) || 9,
        jerseyColor,
        shoesItemId: selectedShoeId || undefined,
        jerseyItemId: selectedJerseyId || undefined,
        previewImage: previewImage || undefined,
        ageGroup,
      }
      let res = await fetch('/api/users/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.status === 409)
        res = await fetch('/api/users/avatar', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      await update()
      router.push('/welcome')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (status === 'loading')
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-white/60">Loading...</div>
      </div>
    )

  const tabs: { id: TabType; label: string }[] = [
    { id: 'skin', label: 'Skin' },
    { id: 'hair', label: 'Hair' },
    { id: 'jerseyNumber', label: 'Number' },
    { id: 'jerseyColor', label: 'Color' },
    { id: 'jersey', label: 'Jersey' },
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
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none" />
      <div className="p-4 pt-6 relative z-10 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {savedAvatarUrl ? 'Edit Avatar' : 'Create Avatar'}
          </h1>
          <p className="text-white/60 text-sm">Basketball</p>
        </div>
        <Logo size="sm" linkToHome className="w-10 h-10" />
      </div>
      {error && (
        <div className="mx-4 bg-red-500/20 border border-red-500/30 text-red-200 px-4 py-2 rounded-lg text-sm relative z-10">
          {error}
        </div>
      )}
      <AvatarDisplay
        isGenerating={isGenerating}
        isLoadingAvatar={isLoadingAvatar}
        previewImage={previewImage}
        displayAvatarUrl={displayAvatarUrl}
      />
      <div className="px-4 py-3 min-h-[100px] relative z-10">
        {activeTab === 'skin' && <SkinToneSelector skinTone={skinTone} onSelect={setSkinTone} />}
        {activeTab === 'hair' && (
          <HairSelector
            hairStyle={hairStyle}
            hairColor={hairColor}
            onStyleSelect={setHairStyle}
            onColorSelect={setHairColor}
          />
        )}
        {activeTab === 'jerseyNumber' && (
          <JerseyNumberInput jerseyNumber={jerseyNumber} onChange={setJerseyNumber} />
        )}
        {activeTab === 'jerseyColor' && (
          <JerseyColorSelector jerseyColor={jerseyColor} onSelect={setJerseyColor} />
        )}
        {activeTab === 'jersey' && (
          <JerseyUnlockSelector
            jerseys={jerseys}
            selectedJerseyId={selectedJerseyId}
            isUnlocking={isUnlockingJersey}
            onSelect={setSelectedJerseyId}
            onUnlock={handleUnlockJersey}
          />
        )}
        {activeTab === 'shoes' && (
          <ShoeSelector
            shoes={shoes}
            selectedShoeId={selectedShoeId}
            isUnlocking={isUnlocking}
            onSelect={setSelectedShoeId}
            onUnlock={handleUnlockShoe}
          />
        )}
      </div>
      <TabBar tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
      <ActionButtons
        isSubmitting={isSubmitting}
        isGenerating={isGenerating}
        onGenerate={handleGeneratePreview}
        onSave={handleSave}
      />
      <div className="py-3 text-center relative z-10">
        <p className="text-xs text-white/30">BB Championship sponsored by DONK</p>
      </div>
    </main>
  )
}
