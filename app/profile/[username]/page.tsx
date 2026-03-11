import { notFound } from 'next/navigation'

import { Navbar } from '@/components/shared/Navbar'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'
interface ProfilePageProps {
  params: Promise<{ username: string }>
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params
  const supabase = await getSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: myProfile } = await supabase.from('profiles').select('username').eq('id', user?.id ?? '').maybeSingle()

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, full_name, streak_count, total_sessions, total_focus_minutes')
    .eq('username', username)
    .maybeSingle()

  if (!profile) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-[#0F172A]">
      <Navbar username={myProfile?.username ?? null} />
      <main className="mx-auto w-full max-w-3xl px-6 py-8">
        <section className="rounded-xl border border-[#334155] bg-[#1E293B] p-6">
          <p className="text-sm text-[#94A3B8]">Public profile</p>
          <h1 className="mt-2 text-3xl font-semibold text-[#F8FAFC]">@{profile.username}</h1>
          <p className="mt-1 text-sm text-[#94A3B8]">{profile.full_name ?? 'Focused grinder'}</p>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <StatCard label="Streak" value={`🔥 ${profile.streak_count}`} />
            <StatCard label="Sessions" value={`${profile.total_sessions}`} />
            <StatCard label="Minutes" value={`${profile.total_focus_minutes}`} />
          </div>
        </section>
      </main>
    </div>
  )
}

interface StatCardProps {
  label: string
  value: string
}

function StatCard({ label, value }: StatCardProps) {
  return (
    <article className="rounded-md border border-[#334155] bg-[#0F172A] p-4">
      <p className="text-xs uppercase tracking-wide text-[#94A3B8]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[#F8FAFC]">{value}</p>
    </article>
  )
}
