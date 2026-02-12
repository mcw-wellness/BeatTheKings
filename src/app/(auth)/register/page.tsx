'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Logo } from '@/components/layout/Logo'
import { logger } from '@/lib/utils/logger'

interface Country {
  id: string
  name: string
  code?: string
}

interface City {
  id: string
  name: string
}

interface FormData {
  nickname: string
  age: string
  gender: string
  countryId: string
  cityId: string
}

interface FormErrors {
  nickname?: string
  age?: string
  gender?: string
  countryId?: string
  cityId?: string
  _form?: string
}

export default function RegisterPage(): JSX.Element {
  return (
    <Suspense fallback={<RegisterPageSkeleton />}>
      <RegisterPageContent />
    </Suspense>
  )
}

function RegisterPageSkeleton(): JSX.Element {
  return (
    <main
      className="flex h-dvh flex-col items-center justify-center overflow-y-auto p-4 sm:p-6 relative"
      style={{
        backgroundImage: 'url(/backgrounds/stadium.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none" />
      <div className="w-full max-w-sm sm:max-w-md space-y-6 animate-pulse relative z-10">
        <div className="flex justify-center">
          <div className="w-36 h-36 bg-white/10 rounded-full" />
        </div>
        <div className="space-y-4">
          <div className="h-12 bg-white/10 rounded-lg" />
          <div className="h-12 bg-white/10 rounded-lg" />
          <div className="h-12 bg-white/10 rounded-lg" />
          <div className="h-12 bg-white/10 rounded-lg" />
          <div className="h-12 bg-white/10 rounded-lg" />
          <div className="h-14 bg-white/10 rounded-lg" />
        </div>
      </div>
    </main>
  )
}

function RegisterPageContent(): JSX.Element {
  const router = useRouter()
  const { status, update } = useSession()

  const [formData, setFormData] = useState<FormData>({
    nickname: '',
    age: '',
    gender: '',
    countryId: '',
    cityId: '',
  })
  const [countries, setCountries] = useState<Country[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingCountries, setIsLoadingCountries] = useState(true)
  const [isLoadingCities, setIsLoadingCities] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    async function fetchCountries(): Promise<void> {
      try {
        const res = await fetch('/api/locations/countries')
        if (!res.ok) throw new Error('Failed to fetch countries')
        const data = await res.json()
        setCountries(data.countries || [])
      } catch (error) {
        logger.error({ error }, 'Failed to fetch countries')
        setErrors((prev) => ({ ...prev, _form: 'Failed to load countries. Please refresh.' }))
      } finally {
        setIsLoadingCountries(false)
      }
    }

    fetchCountries()
  }, [])

  useEffect(() => {
    async function fetchCities(): Promise<void> {
      if (!formData.countryId) {
        setCities([])
        return
      }

      setIsLoadingCities(true)
      try {
        const res = await fetch(`/api/locations/cities?countryId=${formData.countryId}`)
        if (!res.ok) throw new Error('Failed to fetch cities')
        const data = await res.json()
        setCities(data.cities || [])
      } catch (error) {
        logger.error({ error }, 'Failed to fetch cities')
        setErrors((prev) => ({ ...prev, _form: 'Failed to load cities. Please try again.' }))
      } finally {
        setIsLoadingCities(false)
      }
    }

    fetchCities()
  }, [formData.countryId])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.nickname.trim()) {
      newErrors.nickname = 'Nickname is required'
    } else if (formData.nickname.trim().length < 2) {
      newErrors.nickname = 'Nickname must be at least 2 characters'
    } else if (formData.nickname.trim().length > 50) {
      newErrors.nickname = 'Nickname must be less than 50 characters'
    }

    if (!formData.age) {
      newErrors.age = 'Age is required'
    } else {
      const ageNum = parseInt(formData.age)
      if (isNaN(ageNum) || ageNum < 5 || ageNum > 120) {
        newErrors.age = 'Age must be between 5 and 120'
      }
    }

    if (!formData.gender) {
      newErrors.gender = 'Please select a gender'
    }

    if (!formData.countryId) {
      newErrors.countryId = 'Please select a country'
    }

    if (!formData.cityId) {
      newErrors.cityId = 'Please select a city'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)
    setErrors({})

    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: formData.nickname.trim(),
          age: parseInt(formData.age),
          gender: formData.gender,
          cityId: formData.cityId,
          hasCompletedProfile: true,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.details) {
          setErrors(data.details)
        } else {
          setErrors({ _form: data.error || 'Failed to save profile' })
        }
        return
      }

      // Refresh session to get updated flags
      await update()

      // Success - redirect to photo upload
      router.push('/photo')
    } catch (error) {
      logger.error({ error }, 'Failed to submit profile')
      setErrors({ _form: 'An unexpected error occurred. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (status === 'loading') {
    return <RegisterPageSkeleton />
  }

  if (status === 'unauthenticated') {
    return <RegisterPageSkeleton />
  }

  return (
    <main
      className="flex h-dvh flex-col items-center justify-center overflow-y-auto p-4 sm:p-6 relative"
      style={{
        backgroundImage: 'url(/backgrounds/stadium.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Light overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none" />

      <div className="w-full max-w-sm sm:max-w-md space-y-6 relative z-10">
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <div className="w-28 h-28 sm:w-36 sm:h-36">
            <Logo size="lg" pulsing />
          </div>
        </div>

        {/* Title */}
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Rule the Game</h1>
          <p className="text-sm sm:text-base text-white/60 mt-2">
            Join the ultimate sports competition.
          </p>
        </div>

        {/* Form Error */}
        {errors._form && (
          <div
            className="bg-red-500/20 border border-red-500/30 text-red-200 px-4 py-3 rounded-lg text-sm"
            role="alert"
          >
            {errors._form}
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nickname Field */}
          <div>
            <label htmlFor="nickname" className="block text-sm font-medium text-white/80 mb-1.5">
              Nickname:
            </label>
            <input
              id="nickname"
              type="text"
              placeholder="Nickname"
              value={formData.nickname}
              onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
              disabled={isSubmitting}
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {errors.nickname && <p className="text-sm text-red-300 mt-1">{errors.nickname}</p>}
          </div>

          {/* Age Field */}
          <div>
            <label htmlFor="age" className="block text-sm font-medium text-white/80 mb-1.5">
              Age:
            </label>
            <input
              id="age"
              type="number"
              placeholder="Your age"
              min="5"
              max="120"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              disabled={isSubmitting}
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {errors.age && <p className="text-sm text-red-300 mt-1">{errors.age}</p>}
          </div>

          {/* Gender Field */}
          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-white/80 mb-1.5">
              Gender:
            </label>
            <select
              id="gender"
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              disabled={isSubmitting}
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="" className="bg-dark-primary text-white">
                Select...
              </option>
              <option value="male" className="bg-dark-primary text-white">
                Male
              </option>
              <option value="female" className="bg-dark-primary text-white">
                Female
              </option>
            </select>
            {errors.gender && <p className="text-sm text-red-300 mt-1">{errors.gender}</p>}
          </div>

          {/* Location Field - Combined label like old layout */}
          <div>
            <label htmlFor="country" className="block text-sm font-medium text-white/80 mb-1.5">
              Location:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <select
                id="country"
                value={formData.countryId}
                onChange={(e) => {
                  setFormData({ ...formData, countryId: e.target.value, cityId: '' })
                  setErrors({ ...errors, countryId: '', cityId: '' })
                }}
                disabled={isSubmitting || isLoadingCountries}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="" className="bg-dark-primary text-white">
                  {isLoadingCountries ? 'Loading...' : 'Country'}
                </option>
                {countries.map((country) => (
                  <option
                    key={country.id}
                    value={country.id}
                    className="bg-dark-primary text-white"
                  >
                    {country.name}
                  </option>
                ))}
              </select>
              <select
                id="city"
                value={formData.cityId}
                onChange={(e) => {
                  setFormData({ ...formData, cityId: e.target.value })
                  setErrors({ ...errors, cityId: '' })
                }}
                disabled={isSubmitting || !formData.countryId || isLoadingCities}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="" className="bg-dark-primary text-white">
                  {!formData.countryId ? 'City' : isLoadingCities ? 'Loading...' : 'City'}
                </option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id} className="bg-dark-primary text-white">
                    {city.name}
                  </option>
                ))}
              </select>
            </div>
            {(errors.countryId || errors.cityId) && (
              <p className="text-sm text-red-300 mt-1">{errors.countryId || errors.cityId}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full min-h-[48px] bg-white/20 hover:bg-white/30 text-white font-bold py-3 sm:py-4 px-6 rounded-lg transition-all duration-200 mt-6 border border-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : 'Get Started'}
          </button>
        </form>
      </div>
    </main>
  )
}
