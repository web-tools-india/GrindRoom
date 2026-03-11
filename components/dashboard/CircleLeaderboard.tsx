import type { CircleLeaderboardEntry } from '@/lib/types'

interface CircleLeaderboardProps {
  entries: CircleLeaderboardEntry[]
  isLoading?: boolean
}

export function CircleLeaderboard({ entries, isLoading = false }: CircleLeaderboardProps) {
  if (isLoading) {
    return <div className="h-56 animate-pulse rounded-xl border border-[#334155] bg-[#1E293B]" />
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-[#334155] bg-[#1E293B] p-6 text-sm text-[#94A3B8]">
        Share your invite code to bring your crew in.
      </div>
    )
  }

  return (
    <section className="rounded-xl border border-[#334155] bg-[#1E293B] p-5">
      <h3 className="text-lg font-semibold text-[#F8FAFC]">Circle leaderboard</h3>
      <div className="mt-4 space-y-3">
        {entries.map((entry) => (
          <div key={entry.id} className="flex items-center justify-between rounded-md border border-[#334155] px-3 py-2">
            <div>
              <p className="font-medium text-[#F8FAFC]">#{entry.rank} @{entry.username}</p>
              <p className="text-xs text-[#94A3B8]">{entry.weeklySessions} sessions this week</p>
            </div>
            <p className="font-semibold text-[#10B981]">{entry.weeklyMinutes} min</p>
          </div>
        ))}
      </div>
    </section>
  )
}
