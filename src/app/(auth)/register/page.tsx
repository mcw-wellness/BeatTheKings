'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Logo } from '@/components/layout/Logo'
import { logger } from '@/lib/utils/logger'

interface Country {
  id: string
  name: string
  nameGerman: string
}

interface City {
  id: string
  name: string
}

interface FormData {
  name: string
  dateOfBirth: string
  gender: string
  countryId: string
  cityId: string
}

interface FormErrors {
  name?: string
  dateOfBirth?: string
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
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 bg-white">
      <div className="w-full max-w-sm sm:max-w-md space-y-6 animate-pulse">
        <div className="flex justify-center">
          <div className="w-48 h-48 bg-gray-200 rounded-full" />
        </div>
        <div className="space-y-4">
          <div className="h-12 bg-gray-200 rounded-lg" />
          <div className="h-12 bg-gray-200 rounded-lg" />
          <div className="h-12 bg-gray-200 rounded-lg" />
          <div className="h-12 bg-gray-200 rounded-lg" />
          <div className="h-12 bg-gray-200 rounded-lg" />
          <div className="h-14 bg-gray-200 rounded-lg" />
        </div>
      </div>
    </main>
  )
}

function RegisterPageContent(): JSX.Element {
  const router = useRouter()
  const { status } = useSession()

  const [formData, setFormData] = useState<FormData>({
    name: '',
    dateOfBirth: '',
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

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  // Fetch countries on mount
  useEffect(() => {
    async function fetchCountries(): Promise<void> {
      try {
        const res = await fetch('/api/locations/states')
        if (!res.ok) throw new Error('Failed to fetch countries')
        const data = await res.json()
        setCountries(data)
      } catch (error) {
        logger.error({ error }, 'Failed to fetch countries')
        setErrors((prev) => ({ ...prev, _form: 'Failed to load countries. Please refresh.' }))
      } finally {
        setIsLoadingCountries(false)
      }
    }

    fetchCountries()
  }, [])

  // Fetch cities when country changes
  useEffect(() => {
    async function fetchCities(): Promise<void> {
      if (!formData.countryId) {
        setCities([])
        return
      }

      setIsLoadingCities(true)
      try {
        const res = await fetch(`/api/locations/cities?state=${formData.countryId}`)
        if (!res.ok) throw new Error('Failed to fetch cities')
        const data = await res.json()
        setCities(data)
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

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required'
    } else {
      const dob = new Date(formData.dateOfBirth)
      const today = new Date()
      const age = Math.floor((today.getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      if (age < 5) {
        newErrors.dateOfBirth = 'Must be at least 5 years old'
      } else if (age > 120) {
        newErrors.dateOfBirth = 'Invalid date of birth'
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
          name: formData.name.trim(),
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender,
          cityId: formData.cityId,
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

      // Success - redirect to avatar creation
      router.push('/avatar')
    } catch (error) {
      logger.error({ error }, 'Failed to submit profile')
      setErrors({ _form: 'An unexpected error occurred. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show loading while checking auth
  if (status === 'loading') {
    return <RegisterPageSkeleton />
  }

  // Don't render if not authenticated (will redirect)
  if (status === 'unauthenticated') {
    return <RegisterPageSkeleton />
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 bg-white">
      <div className="w-full max-w-sm sm:max-w-md space-y-6">
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <div className="w-36 h-36 sm:w-48 sm:h-48">
            <Logo size="lg" pulsing />
          </div>
        </div>

        {/* Title */}
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Complete Your Profile</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">Tell us a bit about yourself</p>
        </div>

        {/* Form Error */}
        {errors._form && (
          <div
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
            role="alert"
          >
            {errors._form}
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
              Name
            </label>
            <input
              id="name"
              type="text"
              placeholder="Your name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={isSubmitting}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
          </div>

          {/* Date of Birth Field */}
          <div>
            <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1.5">
              Date of Birth
            </label>
            <input
              id="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              disabled={isSubmitting}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            {errors.dateOfBirth && (
              <p className="text-sm text-red-600 mt-1">{errors.dateOfBirth}</p>
            )}
          </div>

          {/* Gender Field */}
          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1.5">
              Gender
            </label>
            <select
              id="gender"
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              disabled={isSubmitting}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Select...</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            {errors.gender && <p className="text-sm text-red-600 mt-1">{errors.gender}</p>}
          </div>

          {/* Country Field */}
          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1.5">
              Country
            </label>
            <select
              id="country"
              value={formData.countryId}
              onChange={(e) => {
                setFormData({ ...formData, countryId: e.target.value, cityId: '' })
                setErrors({ ...errors, countryId: '', cityId: '' })
              }}
              disabled={isSubmitting || isLoadingCountries}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">{isLoadingCountries ? 'Loading...' : 'Select country...'}</option>
              {countries.map((country) => (
                <option key={country.id} value={country.id}>
                  {country.name}
                </option>
              ))}
            </select>
            {errors.countryId && <p className="text-sm text-red-600 mt-1">{errors.countryId}</p>}
          </div>

          {/* City Field */}
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1.5">
              City
            </label>
            <select
              id="city"
              value={formData.cityId}
              onChange={(e) => {
                setFormData({ ...formData, cityId: e.target.value })
                setErrors({ ...errors, cityId: '' })
              }}
              disabled={isSubmitting || !formData.countryId || isLoadingCities}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">
                {!formData.countryId
                  ? 'Select a country first'
                  : isLoadingCities
                    ? 'Loading...'
                    : 'Select city...'}
              </option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </select>
            {errors.cityId && <p className="text-sm text-red-600 mt-1">{errors.cityId}</p>}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full min-h-[48px] bg-[#4361EE] hover:bg-[#3651DE] text-white font-semibold py-3 sm:py-4 px-6 rounded-lg transition-colors duration-200 mt-6 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {isSubmitting ? 'Saving...' : 'Continue'}
          </button>
        </form>
      </div>
    </main>
  )
}
