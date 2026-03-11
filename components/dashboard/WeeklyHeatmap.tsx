import type { HeatmapDay } from '@/lib/types'

interface WeeklyHeatmapProps {
  days: HeatmapDay[]
  isLoading?: boolean
}

function getIntensity(minutes: number) {
  if (minutes >= 120) return 'bg-emerald-400/90'
  if (minutes >= 60) return 'bg-emerald-400/70'
  if (minutes >= 30) return 'bg-emerald-400/50'
  if (minutes > 0) return 'bg-emerald-400/30'
  return 'bg-[#334155]'
}

export function WeeklyHeatmap({ days, isLoading = false }: WeeklyHeatmapProps) {
  if (isLoading) {
    return <div className="h-32 animate-pulse rounded-xl border border-[#334155] bg-[#1E293B]" />
  }

  if (days.length === 0) {
    return (
      <div className="rounded-xl border border-[#334155] bg-[#1E293B] p-6 text-sm text-[#94A3B8]">
        Your grind history will show up here after your first session.
      </div>
    )
  }

  return (
    <section className="rounded-xl border border-[#334155] bg-[#1E293B] p-5">
      <h3 className="text-lg font-semibold text-[#F8FAFC]">Weekly Heatmap</h3>
      <div className="mt-4 grid grid-cols-7 gap-2">
        {days.map((day) => (
          <div key={day.date} className="space-y-1 text-center">
            <div className={`h-10 rounded-md ${getIntensity(day.minutes)}`} />
            <p className="text-xs text-[#94A3B8]">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
