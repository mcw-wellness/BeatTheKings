'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import type { NotificationEvent } from '@/lib/notifications/emitter'

interface UseNotificationsOptions {
  onEvent?: (event: NotificationEvent) => void
  enabled?: boolean
}

/**
 * Hook to subscribe to real-time SSE notifications
 * Automatically reconnects on disconnect with exponential backoff
 */
export function useNotifications({ onEvent, enabled = true }: UseNotificationsOptions = {}): {
  isConnected: boolean
  lastEvent: NotificationEvent | null
} {
  const [isConnected, setIsConnected] = useState(false)
  const [lastEvent, setLastEvent] = useState<NotificationEvent | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const retryCountRef = useRef(0)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const onEventRef = useRef(onEvent)

  // Keep callback ref current without triggering reconnect
  onEventRef.current = onEvent

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const es = new EventSource('/api/notifications/stream')
    eventSourceRef.current = es

    es.onopen = () => {
      setIsConnected(true)
      retryCountRef.current = 0
    }

    es.onmessage = (event) => {
      try {
        const parsed: NotificationEvent = JSON.parse(event.data)
        setLastEvent(parsed)
        onEventRef.current?.(parsed)
      } catch {
        // Ignore non-JSON messages (heartbeats, comments)
      }
    }

    es.onerror = () => {
      setIsConnected(false)
      es.close()
      eventSourceRef.current = null

      // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
      const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000)
      retryCountRef.current++

      retryTimeoutRef.current = setTimeout(connect, delay)
    }
  }, [])

  useEffect(() => {
    if (!enabled) return

    connect()

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
    }
  }, [connect, enabled])

  return { isConnected, lastEvent }
}
