'use client'

import { useEffect, useMemo, useState } from 'react'

import type { ActiveGrinder, Room, RoomFilters } from '@/lib/types'

import { RoomCard } from '@/components/ui/RoomCard'
import { RoomFilter } from '@/components/ui/RoomFilter'
import { ActiveGrinderRow } from './ActiveGrinderRow'

interface RoomClientProps {
  mode: 'rooms' | 'room'
  rooms?: Array<Pick<Room, 'id' | 'name' | 'description' | 'emoji' | 'category' | 'active_count'>>
  grinders?: ActiveGrinder[]
}

export function RoomClient({ mode, rooms = [], grinders = [] }: RoomClientProps) {
  const [filters, setFilters] = useState<RoomFilters>({ search: '', category: 'all' })
  const [now, setNow] = useState(() => new Date().getTime())

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

  return (
    <div className="space-y-3">
      {grinders.length === 0 ? (
        <p className="rounded-xl border border-[#334155] bg-[#1E293B] p-6 text-sm text-[#94A3B8]">
          Room is quiet right now. Start a session and become the first active grinder.
        </p>
      ) : (
        grinders.map((grinder) => <ActiveGrinderRow key={grinder.userId} grinder={grinder} now={now} />)
      )}
    </div>
  )
}
