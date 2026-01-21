'use client'

import { useState, useEffect } from 'react'

interface UseAvatarUrlOptions {
  type?: 'default' | 'user'
  gender?: string | null
  userId?: string | null
  sport?: string
}

interface UseAvatarUrlResult {
  url: string | null
  isLoading: boolean
}

/**
 * Hook to get avatar URL with SAS token
 * Fetches from API to generate secure SAS URL
 * Returns { url, isLoading } to handle loading states properly
 */
export function useAvatarUrl(options: UseAvatarUrlOptions): string | null {
  const result = useAvatarUrlWithLoading(options)
  return result.url
}

/**
 * Hook to get avatar URL with loading state
 * Use this when you need to show a loading spinner instead of placeholder
 */
export function useAvatarUrlWithLoading(options: UseAvatarUrlOptions): UseAvatarUrlResult {
  const { type = 'default', gender, userId, sport = 'basketball' } = options
  const [url, setUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchUrl = async (): Promise<void> => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams()
        params.set('type', type)
        params.set('sport', sport)

        if (type === 'user' && userId) {
          params.set('userId', userId)
        } else {
          params.set('gender', gender || 'male')
        }

        const res = await fetch(`/api/avatar/url?${params.toString()}`)
        if (res.ok) {
          const data = await res.json()
          setUrl(data.url)
        }
      } catch {
        // Silently fail - component should handle null URL
      } finally {
        setIsLoading(false)
      }
    }

    fetchUrl()
  }, [type, gender, userId, sport])

  return { url, isLoading }
}

/**
 * Fetch avatar URL directly (for server components or one-time fetches)
 */
export async function fetchAvatarUrl(options: UseAvatarUrlOptions): Promise<string | null> {
  const { type = 'default', gender, userId, sport = 'basketball' } = options

  try {
    const params = new URLSearchParams()
    params.set('type', type)
    params.set('sport', sport)

    if (type === 'user' && userId) {
      params.set('userId', userId)
    } else {
      params.set('gender', gender || 'male')
    }

    const res = await fetch(`/api/avatar/url?${params.toString()}`)
    if (res.ok) {
      const data = await res.json()
      return data.url
    }
  } catch {
    // Silently fail
  }

  return null
}
