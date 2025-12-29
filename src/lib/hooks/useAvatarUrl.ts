'use client'

import { useState, useEffect } from 'react'

interface UseAvatarUrlOptions {
  type?: 'default' | 'user'
  gender?: string | null
  userId?: string | null
  sport?: string
}

/**
 * Hook to get avatar URL with SAS token
 * Fetches from API to generate secure SAS URL
 */
export function useAvatarUrl(options: UseAvatarUrlOptions): string | null {
  const { type = 'default', gender, userId, sport = 'basketball' } = options
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    const fetchUrl = async (): Promise<void> => {
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
      }
    }

    fetchUrl()
  }, [type, gender, userId, sport])

  return url
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
