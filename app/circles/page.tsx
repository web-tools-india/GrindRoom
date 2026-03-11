import Link from 'next/link'

import { Navbar } from '@/components/shared/Navbar'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import type { Circle } from '@/lib/types'

type CircleItem = Pick<Circle, 'id' | 'name' | 'invite_code' | 'created_at'>

export default async function CirclesPage() {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase.from('profiles').select('username').eq('id', user?.id ?? '').maybeSingle()

  const { data: memberships } = await supabase.from('circle_members').select('circle_id').eq('user_id', user?.id ?? '')

  const circleIds = (memberships ?? []).map((membership) => membership.circle_id)

  let circles: CircleItem[] = []

  if (circleIds.length > 0) {
    const { data } = await supabase.from('circles').select('id, name, invite_code, created_at').in('id', circleIds)
    circles = data ?? []
  }

  return (
    <div className="min-h-screen bg-[#0F172A]">
      <Navbar username={profile?.username ?? null} />
      <main className="mx-auto w-full max-w-6xl px-6 py-8">
        <h1 className="text-3xl font-semibold text-[#F8FAFC]">Your circles</h1>
        <p className="mt-2 text-sm text-[#94A3B8]">Compete with your crew and stay accountable every week.</p>

        {circles.length === 0 ? (
          <div className="mt-6 rounded-xl border border-[#334155] bg-[#1E293B] p-6 text-sm text-[#94A3B8]">
            Share your invite code to bring your crew in.
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {circles.map((circle) => (
              <article key={circle.id} className="rounded-xl border border-[#334155] bg-[#1E293B] p-5">
                <h2 className="text-xl font-semibold text-[#F8FAFC]">{circle.name}</h2>
                <p className="mt-1 text-sm text-[#94A3B8]">Invite code: {circle.invite_code}</p>
                <Link href="/dashboard" className="mt-4 inline-flex text-sm font-semibold text-[#6366F1]">
                  View leaderboard
                </Link>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
