import { RoomClient } from '@/components/room/RoomClient'
import { RoomSessionManager } from '@/components/room/RoomSessionManager'
import { Navbar } from '@/components/shared/Navbar'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import type { ActiveGrinder } from '@/lib/types'

export const dynamic = 'force-dynamic'
interface RoomPageProps {
  params: Promise<{ id: string }>
}

interface ActiveSessionWithProfile {
  id: string
  user_id: string
  task_declared: string
  started_at: string
  duration_minutes: number
  profiles: {
    username: string | null
    avatar_url: string | null
  } | null
}

export default async function RoomPage({ params }: RoomPageProps) {
  const { id } = await params
  const supabase = await getSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase.from('profiles').select('username').eq('id', user?.id ?? '').maybeSingle()

  const { data: room } = await supabase
    .from('rooms')
    .select('id, name, description, active_count')
    .eq('id', id)
    .maybeSingle()

  const { data: activeSessions, error } = await supabase
    .from('sessions')
    .select('id, user_id, task_declared, started_at, duration_minutes, profiles(username, avatar_url)')
    .eq('room_id', id)
    .is('ended_at', null)
    .order('started_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('Failed to fetch active grinders:', error.message)
  }

  const grinders: ActiveGrinder[] = ((activeSessions as ActiveSessionWithProfile[] | null) ?? []).map((session) => {
    const profileData = session.profiles

    return {
      userId: session.user_id,
      username: profileData?.username ?? session.user_id.slice(0, 8),
      avatarUrl: profileData?.avatar_url ?? null,
      task: session.task_declared,
      timerEndAt: new Date(new Date(session.started_at).getTime() + session.duration_minutes * 60_000).toISOString(),
      isActive: true,
    }
  })

  return (
    <div className="min-h-screen bg-[#0F172A]">
      <Navbar username={profile?.username ?? null} />
      <main className="mx-auto grid w-full max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[1.2fr_0.8fr]">
        <section>
          <h1 className="text-3xl font-semibold text-[#F8FAFC]">{room?.name ?? 'Room'}</h1>
          <p className="mt-2 text-sm text-[#94A3B8]">{room?.description ?? 'Focus and grind in silence with live accountability.'}</p>
          <div className="mt-5">
            <RoomClient mode="room" roomId={id} initialGrinders={grinders} initialActiveCount={room?.active_count ?? 0} />
          </div>
        </section>
        <aside className="space-y-4">
          <RoomSessionManager roomId={id} userId={user?.id ?? null} />
        </aside>
      </main>
    </div>
  )
}
