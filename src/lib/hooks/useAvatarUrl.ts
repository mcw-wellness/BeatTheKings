'use client'

import { useState, useEffect, useCallback } from 'react'

interface UseAvatarUrlOptions {
  type?: 'default' | 'user'
  gender?: string | null
  userId?: string | null
  sport?: string
  refreshKey?: number // Change this to force re-fetch
}

interface UseAvatarUrlResult {
  url: string | null
  isLoading: boolean
  refetch: () => void
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
 * Call refetch() to force a new fetch (e.g., after avatar update)
 */
export function useAvatarUrlWithLoading(options: UseAvatarUrlOptions): UseAvatarUrlResult {
  const { type = 'default', gender, userId, sport = 'basketball', refreshKey } = options
  const [url, setUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [internalRefreshKey, setInternalRefreshKey] = useState(0)

  const fetchUrl = useCallback(async (): Promise<void> => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('type', type)
      params.set('sport', sport)
      // Add cache-buster to prevent API response caching
      params.set('_t', Date.now().toString())

      if (type === 'user' && userId) {
        params.set('userId', userId)
      } else {
        params.set('gender', gender || 'male')
      }

      const res = await fetch(`/api/avatar/url?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        // Add cache-buster to image URL to force browser to reload
        const separator = data.url?.includes('?') ? '&' : '?'
        setUrl(data.url ? `${data.url}${separator}_t=${Date.now()}` : null)
      }
    } catch {
      // Silently fail - component should handle null URL
    } finally {
      setIsLoading(false)
    }
  }, [type, gender, userId, sport])

  useEffect(() => {
    fetchUrl()
  }, [fetchUrl, refreshKey, internalRefreshKey])

  const refetch = useCallback(() => {
    setInternalRefreshKey((k) => k + 1)
  }, [])

  return { url, isLoading, refetch }
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
