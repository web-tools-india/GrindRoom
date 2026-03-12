'use client'

import { useEffect, useState } from 'react'

import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import type { ActiveGrinder } from '@/lib/types'

interface SessionRealtimeRow {
  id: string
  user_id: string
  task_declared: string
  started_at: string
  duration_minutes: number
  ended_at: string | null
}

interface RoomRealtimeRow {
  active_count: number | null
}

interface ProfileLookup {
  username: string | null
  avatar_url: string | null
}

interface UseRoomPresenceReturn {
  grinders: ActiveGrinder[]
  activeCount: number
  isConnected: boolean
}

export function useRoomPresence(
  roomId: string,
  initialGrinders: ActiveGrinder[],
  initialCount: number,
): UseRoomPresenceReturn {
  const [grinders, setGrinders] = useState<ActiveGrinder[]>(initialGrinders)
  const [activeCount, setActiveCount] = useState<number>(initialCount)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    setGrinders(initialGrinders)
  }, [initialGrinders])

  useEffect(() => {
    setActiveCount(initialCount)
  }, [initialCount])

  useEffect(() => {
    if (!roomId) {
      setIsConnected(false)
      return
    }

    const supabase = getSupabaseBrowserClient()
    const channel = supabase
      .channel(`room-sessions:${roomId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'sessions', filter: `room_id=eq.${roomId}` },
        async (payload) => {
          const session = payload.new as SessionRealtimeRow
          if (session.ended_at) {
            return
          }

          const { data: profile } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', session.user_id)
            .maybeSingle<ProfileLookup>()

          const grinder: ActiveGrinder = {
            userId: session.user_id,
            username: profile?.username ?? session.user_id.slice(0, 8),
            avatarUrl: profile?.avatar_url ?? null,
            task: session.task_declared,
            timerEndAt: new Date(new Date(session.started_at).getTime() + session.duration_minutes * 60_000).toISOString(),
            isActive: true,
          }

          setGrinders((prev) => {
            const withoutExisting = prev.filter((item) => item.userId !== grinder.userId)
            return [grinder, ...withoutExisting].slice(0, 20)
          })
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `room_id=eq.${roomId}` },
        (payload) => {
          const session = payload.new as SessionRealtimeRow
          if (!session.ended_at) {
            return
          }

          setGrinders((prev) => prev.filter((grinder) => grinder.userId !== session.user_id))
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
        (payload) => {
          const room = payload.new as RoomRealtimeRow
          setActiveCount(room.active_count ?? 0)
        },
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED')
      })

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [roomId])

  return { grinders, activeCount, isConnected }
}
