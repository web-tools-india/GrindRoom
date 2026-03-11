import { Navbar } from '@/components/shared/Navbar'
import { RoomClient } from '@/components/room/RoomClient'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import type { Room } from '@/lib/types'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'
type RoomListItem = Pick<Room, 'id' | 'name' | 'description' | 'emoji' | 'category' | 'active_count'>

export default async function RoomsPage() {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase.from('profiles').select('username').eq('id', user?.id ?? '').maybeSingle()

  const { data, error } = await supabase
    .from('rooms')
    .select('id, name, description, emoji, category, active_count')
    .eq('is_public', true)
    .order('active_count', { ascending: false })

  if (error) {
    console.error('Failed to fetch rooms:', error.message)
  }

  const rooms: RoomListItem[] = data ?? []

  return (
    <div className="min-h-screen bg-[#0F172A]">
      <Navbar username={profile?.username ?? null} />
      <main className="mx-auto w-full max-w-6xl px-6 py-8">
        <h1 className="text-3xl font-semibold text-[#F8FAFC]">Public Rooms</h1>
        <p className="mt-2 text-sm text-[#94A3B8]">Pick a room, declare your task, and start your grind.</p>
        <div className="mt-6">
          <RoomClient mode="rooms" rooms={rooms} />
        </div>
      </main>
    </div>
  )
}
