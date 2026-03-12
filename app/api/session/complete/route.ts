import { NextResponse } from 'next/server'

import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { getSupabaseServerClient } from '@/lib/supabase/server'

interface SessionCompleteBody {
  session_id?: string
  completed?: boolean
}

interface CompleteSessionRpcRow {
  session_id: string
  ended_at: string
  completed: boolean
  actual_minutes: number
  streak_count: number
  longest_streak: number
  last_session_date: string | null
  total_sessions: number
  total_focus_minutes: number
  was_already_completed: boolean
}

export async function POST(request: Request) {
  const supabase = await getSupabaseServerClient()
  const supabaseAdmin = getSupabaseAdminClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: SessionCompleteBody

  try {
    body = (await request.json()) as SessionCompleteBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { session_id: sessionId, completed } = body

  if (!sessionId || typeof sessionId !== 'string' || typeof completed !== 'boolean') {
    return NextResponse.json(
      { error: 'Request body must include { session_id: string, completed: boolean }' },
      { status: 400 },
    )
  }

  const { data: ownedSession, error: ownershipError } = await supabase
    .from('sessions')
    .select('id')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (ownershipError) {
    return NextResponse.json(
      {
        error: 'Failed to validate session ownership',
        details: ownershipError.message,
      },
      { status: 500 },
    )
  }

  if (!ownedSession) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  const { data, error } = await supabaseAdmin
    .rpc('complete_session_admin', {
      p_session_id: sessionId,
      p_user_id: user.id,
      p_completed: completed,
    })
    .single<CompleteSessionRpcRow>()

  if (error || !data) {
    if (error?.code === 'P0002') {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if (error?.code === '42501') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      {
        error: 'Failed to complete session',
        details: error?.message ?? null,
      },
      { status: 500 },
    )
  }

  return NextResponse.json({
    success: true,
    idempotent: data.was_already_completed,
    session: {
      id: data.session_id,
      ended_at: data.ended_at,
      completed: data.completed,
      actual_minutes: data.actual_minutes,
    },
    profile: {
      id: user.id,
      streak_count: data.streak_count,
      longest_streak: data.longest_streak,
      last_session_date: data.last_session_date,
      total_sessions: data.total_sessions,
      total_focus_minutes: data.total_focus_minutes,
    },
  })
}
