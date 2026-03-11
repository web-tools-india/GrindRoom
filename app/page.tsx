import Link from 'next/link'

import { getSupabaseServerClient } from '@/lib/supabase/server'
import type { Room } from '@/lib/types'

type HomeRoom = Pick<Room, 'id' | 'name' | 'description' | 'emoji' | 'category' | 'active_count'>

export default async function HomePage() {
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

  const liveRooms: HomeRoom[] = data ?? []

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-high)]">
      <nav className="border-b border-[var(--border-default)] bg-[var(--bg-surface)]/95">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <p className="text-lg font-semibold tracking-wide">GrindRoom</p>
          <Link
            href="/rooms"
            className="rounded-md border border-[var(--border-default)] px-4 py-2 text-sm font-medium text-[var(--primary)] transition-colors hover:border-[var(--border-focus)] hover:text-[var(--primary-hover)]"
          >
            Browse Rooms
          </Link>
        </div>
      </nav>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 py-12">
        <section className="rounded-[10px] border border-[var(--border-default)] bg-[var(--bg-surface)] p-8 shadow-[0_1px_3px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.06)]">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--text-mid)]">Silent shared focus</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight">
            Study with others. Without the awkward Zoom calls.
          </h1>
          <p className="mt-4 max-w-2xl text-base text-[var(--text-mid)]">
            Declare your task, start your timer, and grind in public rooms where accountability is felt in real time.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/rooms"
              className="rounded-md bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-[var(--bg-base)] transition-colors hover:bg-[var(--primary-hover)]"
            >
              Join a Room Free
            </Link>
            <p className="text-sm text-[var(--text-mid)]">Trusted by 4,000+ focused builders and students every week.</p>
          </div>
        </section>

        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Live public rooms</h2>
            <Link href="/rooms" className="text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-hover)]">
              See all rooms
            </Link>
          </div>

          {liveRooms.length === 0 ? (
            <div className="rounded-[10px] border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 text-[var(--text-mid)] shadow-[0_1px_3px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.06)]">
              No live rooms right now. Check back in a bit or create the first focused session.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {liveRooms.map((room) => (
                <article
                  key={room.id}
                  className="rounded-[10px] border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.06)]"
                >
                  <p className="text-sm text-[var(--text-mid)]">{room.category}</p>
                  <h3 className="mt-2 text-lg font-semibold">
                    <span className="mr-2" aria-hidden="true">
                      {room.emoji ?? '🔥'}
                    </span>
                    {room.name}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm text-[var(--text-mid)]">
                    {room.description ?? 'Focused grind room for deep work.'}
                  </p>
                  <p className="mt-4 text-sm font-medium text-[var(--success)]">{room.active_count} active now</p>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-[10px] border border-[var(--border-default)] bg-[var(--bg-surface)] p-8 shadow-[0_1px_3px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.06)]">
          <h2 className="text-2xl font-semibold">How it works</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-[10px] border border-[var(--border-subtle)] bg-[var(--bg-raised)] p-4">
              <p className="text-sm text-[var(--text-mid)]">Step 1</p>
              <p className="mt-2 font-medium">Pick a public room and declare your task.</p>
            </div>
            <div className="rounded-[10px] border border-[var(--border-subtle)] bg-[var(--bg-raised)] p-4">
              <p className="text-sm text-[var(--text-mid)]">Step 2</p>
              <p className="mt-2 font-medium">Start a focus timer and grind with everyone in silence.</p>
            </div>
            <div className="rounded-[10px] border border-[var(--border-subtle)] bg-[var(--bg-raised)] p-4">
              <p className="text-sm text-[var(--text-mid)]">Step 3</p>
              <p className="mt-2 font-medium">Mark your session done and keep your momentum alive.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--border-default)] px-6 py-8 text-center text-sm text-[var(--text-low)]">
        Built for deep work. No calls, no noise, just accountable focus.
      </footer>
    </div>
  )
}
