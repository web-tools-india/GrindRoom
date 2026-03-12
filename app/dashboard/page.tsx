import { CircleLeaderboard } from '@/components/dashboard/CircleLeaderboard'
import { DashboardClient } from '@/components/dashboard/DashboardClient'
import { WeeklyHeatmap } from '@/components/dashboard/WeeklyHeatmap'
import { Navbar } from '@/components/shared/Navbar'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import type { CircleLeaderboardEntry, HeatmapDay } from '@/lib/types'

export const dynamic = 'force-dynamic'

interface DashboardPageProps {
  searchParams?: Promise<{ setup?: string }>
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const needsUsernameSetup = resolvedSearchParams?.setup === '1'

  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('username,total_focus_minutes,streak_count')
    .eq('id', user?.id ?? '')
    .maybeSingle()

  const { data: sessions, error: sessionsError } = await supabase
    .from('sessions')
    .select('started_at,actual_minutes')
    .eq('user_id', user?.id ?? '')
    .order('started_at', { ascending: false })
    .limit(30)

  if (sessionsError) {
    console.error('Failed to fetch dashboard sessions:', sessionsError.message)
  }

  const days: HeatmapDay[] = Array.from({ length: 7 }, (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - index))
    const key = date.toISOString().slice(0, 10)
    const minutes = (sessions ?? [])
      .filter((session) => session.started_at.slice(0, 10) === key)
      .reduce((sum, session) => sum + (session.actual_minutes ?? 0), 0)

    return { date: key, minutes }
  })

  const entries: CircleLeaderboardEntry[] = []

  return (
    <div className="min-h-screen bg-[#0F172A]">
      <Navbar username={profile?.username ?? null} />
      <DashboardClient needsUsernameSetup={needsUsernameSetup} />
      <main className="mx-auto w-full max-w-6xl space-y-6 px-6 py-8">
        <section className="rounded-xl border border-[#334155] bg-[#1E293B] p-5">
          <h1 className="text-3xl font-semibold text-[#F8FAFC]">Dashboard</h1>
          <p className="mt-2 text-sm text-[#94A3B8]">🔥 {profile?.streak_count ?? 0} day streak · {profile?.total_focus_minutes ?? 0} total minutes</p>
        </section>
        <WeeklyHeatmap days={days} />
        <CircleLeaderboard entries={entries} />
      </main>
    </div>
  )
}
