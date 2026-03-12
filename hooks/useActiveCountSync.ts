'use client'

import { useEffect, useRef } from 'react'

import { getSupabaseBrowserClient } from '@/lib/supabase/client'

export function useActiveCountSync(roomId: string, currentCount: number): void {
  const latestCountRef = useRef(currentCount)

  useEffect(() => {
    latestCountRef.current = currentCount
  }, [currentCount])

  useEffect(() => {
    if (!roomId) {
      return
    }

    const supabase = getSupabaseBrowserClient()

    const syncCount = async (count: number) => {
      const { error } = await supabase.rpc('upsert_room_active_count', {
        p_room_id: roomId,
        p_count: count,
      })

      if (error) {
        console.error('Failed to sync room active count:', error.message)
      }
    }

    void syncCount(Math.max(0, latestCountRef.current))

    return () => {
      void syncCount(Math.max(0, latestCountRef.current - 1))
    }
  }, [roomId])
}
