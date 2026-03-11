import Link from 'next/link'

import type { Room } from '@/lib/types'

import { LiveCountBadge } from './LiveCountBadge'

interface RoomCardProps {
  room: Pick<Room, 'id' | 'name' | 'description' | 'emoji' | 'category' | 'active_count'>
}

export function RoomCard({ room }: RoomCardProps) {
  return (
    <article className="rounded-xl border border-[#334155] bg-[#1E293B] p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-wide text-[#94A3B8]">{room.category}</p>
        <LiveCountBadge count={room.active_count} />
      </div>
      <h3 className="mt-2 text-lg font-semibold text-[#F8FAFC]">
        <span className="mr-2">{room.emoji ?? '🔥'}</span>
        {room.name}
      </h3>
      <p className="mt-3 min-h-10 text-sm text-[#94A3B8]">{room.description ?? 'Focus with people who share your grind.'}</p>
      <Link
        href={`/room/${room.id}`}
        className="mt-5 inline-flex rounded-md border border-[#334155] px-3 py-2 text-sm font-medium text-[#F8FAFC] transition-colors hover:border-[#6366F1] hover:text-[#6366F1]"
      >
        Enter Room
      </Link>
    </article>
  )
}

export function RoomCardSkeleton() {
  return <div className="h-44 animate-pulse rounded-xl border border-[#334155] bg-[#1E293B]" />
}
