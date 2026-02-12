'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Logo } from '@/components/layout/Logo'

interface Country {
  id: string
  name: string
  code: string
}

interface City {
  id: string
  name: string
  countryId: string
}

export default function LocationPage(): JSX.Element {
  const router = useRouter()
  const { status, update } = useSession()

  const [countries, setCountries] = useState<Country[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [selectedCountry, setSelectedCountry] = useState<string>('')
  const [selectedCity, setSelectedCity] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch countries on mount
  useEffect(() => {
    const fetchCountries = async (): Promise<void> => {
      try {
        const res = await fetch('/api/locations/countries')
        if (res.ok) {
          const data = await res.json()
          setCountries(data.countries || [])
        }
      } catch (err) {
        console.error('Failed to fetch countries:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchCountries()
  }, [])

  // Fetch cities when country changes
  useEffect(() => {
    if (!selectedCountry) {
      setCities([])
      setSelectedCity('')
      return
    }

    const fetchCities = async (): Promise<void> => {
      try {
        const res = await fetch(`/api/locations/cities?countryId=${selectedCountry}`)
        if (res.ok) {
          const data = await res.json()
          setCities(data.cities || [])
        }
      } catch (err) {
        console.error('Failed to fetch cities:', err)
      }
    }
    fetchCities()
  }, [selectedCountry])

  // Check existing user location
  useEffect(() => {
    const fetchUserProfile = async (): Promise<void> => {
      try {
        const res = await fetch('/api/users/profile')
        if (res.ok) {
          const data = await res.json()
          if (data.cityId) {
            // User already has location, redirect to home
            router.push('/welcome')
          }
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err)
      }
    }
    fetchUserProfile()
  }, [router])

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  const handleSubmit = async (): Promise<void> => {
    if (!selectedCity) {
      setError('Please select your city')
      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cityId: selectedCity }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save location')
      }

      // Refresh session and redirect to home (Trump Card)
      await update()
      router.push('/welcome')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <main className="h-dvh bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </main>
    )
  }

  return (
    <main className="h-dvh bg-gradient-to-b from-blue-50 to-white p-4 sm:p-6 overflow-y-auto">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-center mb-6">
          <div className="w-20 h-20">
            <Logo size="lg" pulsing />
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-2">
          Select Your Location
        </h1>
        <p className="text-gray-600 text-center mb-8 text-sm">
          This helps us show you nearby courts and local rankings
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Country Selection */}
          <div className="bg-white rounded-xl shadow p-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:outline-none text-gray-700 bg-white"
            >
              <option value="">Select a country</option>
              {countries.map((country) => (
                <option key={country.id} value={country.id}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>

          {/* City Selection */}
          <div className="bg-white rounded-xl shadow p-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              City
              <span className="text-red-500 ml-1">*</span>
            </label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              disabled={!selectedCountry}
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:outline-none text-gray-700 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">
                {selectedCountry ? 'Select a city' : 'Select a country first'}
              </option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !selectedCity}
          className="w-full mt-8 py-4 px-6 bg-[#4361EE] hover:bg-[#3651DE] disabled:bg-gray-400 text-white font-semibold rounded-xl transition-all duration-200"
        >
          {isSubmitting ? 'Saving...' : 'Continue'}
        </button>
      </div>
    </main>
  )
}
