'use client'

import { useEffect, useMemo, useState } from 'react'

import type { ActiveGrinder, Room, RoomFilters } from '@/lib/types'

import { useActiveCountSync } from '@/hooks/useActiveCountSync'
import { useRoomPresence } from '@/hooks/useRoomPresence'
import { RoomCard } from '@/components/ui/RoomCard'
import { RoomFilter } from '@/components/ui/RoomFilter'
import { ActiveGrinderRow, ActiveGrinderRowSkeleton } from './ActiveGrinderRow'

interface RoomClientProps {
  mode: 'rooms' | 'room'
  rooms?: Array<Pick<Room, 'id' | 'name' | 'description' | 'emoji' | 'category' | 'active_count'>>
  roomId?: string
  initialGrinders?: ActiveGrinder[]
  initialActiveCount?: number
}

export function RoomClient({ mode, rooms = [], roomId, initialGrinders = [], initialActiveCount = 0 }: RoomClientProps) {
  const [filters, setFilters] = useState<RoomFilters>({ search: '', category: 'all' })
  const [now, setNow] = useState(() => new Date().getTime())
  const realtimeRoomId = mode === 'room' ? (roomId ?? '') : ''

  const { grinders, activeCount, isConnected } = useRoomPresence(realtimeRoomId, initialGrinders, initialActiveCount)
  useActiveCountSync(realtimeRoomId, activeCount)

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      const matchesSearch = room.name.toLowerCase().includes(filters.search.toLowerCase())
      const matchesCategory = filters.category === 'all' || room.category === filters.category
      return matchesSearch && matchesCategory
    })
  }, [filters, rooms])

  if (mode === 'rooms') {
    return (
      <div className="space-y-4">
        <RoomFilter filters={filters} onChange={setFilters} />
        {filteredRooms.length === 0 ? (
          <p className="rounded-xl border border-[#334155] bg-[#1E293B] p-6 text-sm text-[#94A3B8]">
            No rooms yet. Be the first to create one.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredRooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        )}
      </div>
    )
  }

  if (!roomId) {
    return (
      <p className="rounded-xl border border-[#334155] bg-[#1E293B] p-6 text-sm text-[#94A3B8]">
        Room connection is unavailable. Refresh and try again.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#94A3B8]">{activeCount} grinding now</p>
        <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
          <span className={`h-2 w-2 rounded-full ${isConnected ? 'animate-pulse bg-emerald-400' : 'bg-[#64748B]'}`} />
          <span>{isConnected ? 'Live' : 'Connecting...'}</span>
        </div>
      </div>

      {!isConnected && grinders.length === 0 ? (
        <div className="space-y-3">
          <ActiveGrinderRowSkeleton />
          <ActiveGrinderRowSkeleton />
        </div>
      ) : grinders.length === 0 ? (
        <p className="rounded-xl border border-[#334155] bg-[#1E293B] p-6 text-sm text-[#94A3B8]">
          Room is quiet right now. Start a session and become the first active grinder.
        </p>
      ) : (
        grinders.map((grinder) => <ActiveGrinderRow key={grinder.userId} grinder={grinder} now={now} />)
      )}
    </div>
  )
}
