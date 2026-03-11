import { formatTimer } from '@/lib/utils'
import type { ActiveGrinder } from '@/lib/types'

interface ActiveGrinderRowProps {
  grinder: ActiveGrinder
  now: number
}

export function ActiveGrinderRow({ grinder, now }: ActiveGrinderRowProps) {
  const remainingMs = new Date(grinder.timerEndAt).getTime() - now

  return (
    <div className="rounded-xl border border-[#334155] bg-[#1E293B] p-4">
      <div className="flex items-center justify-between border-l-2 border-emerald-500 pl-3">
        <div>
          <p className="font-semibold text-[#F8FAFC]">@{grinder.username}</p>
          <p className="text-sm text-[#94A3B8]">{grinder.task}</p>
        </div>
        <p className="font-mono text-sm text-emerald-300">{formatTimer(remainingMs)}</p>
      </div>
    </div>
  )
}

export function ActiveGrinderRowSkeleton() {
  return <div className="h-20 animate-pulse rounded-xl border border-[#334155] bg-[#1E293B]" />
}
