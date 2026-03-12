import Link from 'next/link'

import { getSupabaseServerClient } from '@/lib/supabase/server'
import type { Room } from '@/lib/types'

export const dynamic = 'force-dynamic'

interface HomeRoom {
  id: Room['id']
  name: Room['name']
  description: Room['description']
  emoji: Room['emoji']
  category: Room['category']
  active_count: Room['active_count']
}

export default async function HomePage() {
  const hasSupabaseEnv = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) && Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  let liveRooms: HomeRoom[] = []

  if (hasSupabaseEnv) {
    const supabase = await getSupabaseServerClient()

    const { data, error } = await supabase
      .from('rooms')
      .select('id, name, description, emoji, category, active_count')
      .eq('is_public', true)
      .order('active_count', { ascending: false })
      .limit(3)

    if (error) {
      console.error('Failed to fetch top rooms:', error.message)
    }

    liveRooms = data ?? []
  } else {
    console.error('Landing page running without NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY.')
  }

  return (
    <div className="min-h-screen bg-[#08090E] text-[#EEE8D5]">
      <nav className="border-b border-white/10 bg-[#0E1117]/95">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <p className="text-lg font-semibold tracking-wide">GrindRoom</p>
          <Link
            href="/rooms"
            className="rounded-md border border-white/10 px-4 py-2 text-sm font-medium text-[#E8A847] transition-colors hover:border-white/[0.22] hover:text-[#F0B85A]"
          >
            Browse Rooms
          </Link>
        </div>
      </nav>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 py-12">
        <section className="rounded-[10px] border border-white/10 bg-[#0E1117] p-8 shadow-[0_1px_3px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.06)]">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#7A8BA8]">Silent shared focus</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight">
            Study with others. Without the awkward Zoom calls.
          </h1>
          <p className="mt-4 max-w-2xl text-base text-[#7A8BA8]">
            Declare your task, start your timer, and grind in public rooms where accountability is felt in real time.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/login"
              className="rounded-md bg-[#E8A847] px-5 py-3 text-sm font-semibold text-[#08090E] transition-colors hover:bg-[#F0B85A]"
            >
              Join a Room Free
            </Link>
            <p className="text-sm text-[#7A8BA8]">No downloads. No accounts needed to browse.</p>
          </div>
        </section>

        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Live public rooms</h2>
            <Link href="/rooms" className="text-sm font-medium text-[#E8A847] hover:text-[#F0B85A]">
              See all rooms
            </Link>
          </div>

          {!hasSupabaseEnv ? (
            <div className="rounded-[10px] border border-[#F97316]/40 bg-[#F97316]/10 p-6 text-[#EEE8D5] shadow-[0_1px_3px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.06)]">
              <p className="font-medium">Deployment setup incomplete.</p>
              <p className="mt-2 text-sm text-[#7A8BA8]">
                Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in Cloudflare Workers
                environment variables, then redeploy.
              </p>
            </div>
          ) : liveRooms.length === 0 ? (
            <div className="rounded-[10px] border border-white/10 bg-[#0E1117] p-6 text-[#7A8BA8] shadow-[0_1px_3px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.06)]">
              No live rooms right now. Check back in a bit or be the first to start a session.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {liveRooms.map((room) => (
                <Link
                  key={room.id}
                  href={`/room/${room.id}`}
                  className="rounded-[10px] border border-white/10 bg-[#0E1117] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.06)] transition-colors hover:border-white/[0.22]"
                >
                  <p className="text-sm text-[#7A8BA8]">{room.category}</p>
                  <h3 className="mt-2 text-lg font-semibold">
                    <span className="mr-2" aria-hidden="true">
                      {room.emoji ?? '🔥'}
                    </span>
                    {room.name}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm text-[#7A8BA8]">
                    {room.description ?? 'Focused grind room for deep work.'}
                  </p>
                  <p className="mt-4 text-sm font-medium text-[#22C55E]">{room.active_count} active now</p>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-[10px] border border-white/10 bg-[#0E1117] p-8 shadow-[0_1px_3px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.06)]">
          <h2 className="text-2xl font-semibold">How it works</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-[10px] border border-white/[0.06] bg-[#13181F] p-4">
              <p className="text-sm text-[#7A8BA8]">Step 1</p>
              <p className="mt-2 font-medium">Pick a public room and declare your task.</p>
            </div>
            <div className="rounded-[10px] border border-white/[0.06] bg-[#13181F] p-4">
              <p className="text-sm text-[#7A8BA8]">Step 2</p>
              <p className="mt-2 font-medium">Start a focus timer and grind with everyone in silence.</p>
            </div>
            <div className="rounded-[10px] border border-white/[0.06] bg-[#13181F] p-4">
              <p className="text-sm text-[#7A8BA8]">Step 3</p>
              <p className="mt-2 font-medium">Mark your session done and keep your streak alive.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 px-6 py-8 text-center text-sm text-[#3A4A60]">
        Built for deep work. No calls, no noise, just accountable focus.
      </footer>
    </div>
  )
              }
