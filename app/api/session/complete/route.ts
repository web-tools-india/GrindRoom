import { NextResponse } from 'next/server'

import { getSupabaseServerClient } from '@/lib/supabase/server'

interface SessionCompleteBody {
  session_id?: string
  completed?: boolean
}

function getUtcDateOnly(date: Date) {
  return date.toISOString().slice(0, 10)
}

export async function POST(request: Request) {
  const supabase = await getSupabaseServerClient()

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

  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('id, user_id, started_at, ended_at')
    .eq('id', sessionId)
    .single()

  if (sessionError || !session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  if (session.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (session.ended_at) {
    return NextResponse.json({ error: 'Session already completed' }, { status: 409 })
  }

  const now = new Date()
  const startedAt = new Date(session.started_at)

  if (Number.isNaN(startedAt.getTime())) {
    return NextResponse.json({ error: 'Session has invalid started_at timestamp' }, { status: 500 })
  }

  const elapsedMs = now.getTime() - startedAt.getTime()
  const actualMinutes = Math.max(0, Math.floor(elapsedMs / 60000))
  const endedAtIso = now.toISOString()

  const { error: updateSessionError } = await supabase
    .from('sessions')
    .update({
      ended_at: endedAtIso,
      completed,
      actual_minutes: actualMinutes,
    })
    .eq('id', sessionId)
    .eq('user_id', user.id)

  if (updateSessionError) {
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 })
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, streak_count, longest_streak, last_session_date, total_sessions, total_focus_minutes')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }

  const todayUtc = getUtcDateOnly(now)
  const yesterdayDate = new Date(now)
  yesterdayDate.setUTCDate(yesterdayDate.getUTCDate() - 1)
  const yesterdayUtc = getUtcDateOnly(yesterdayDate)

  const profileUpdate: {
    streak_count?: number
    longest_streak?: number
    last_session_date?: string
    total_sessions?: number
    total_focus_minutes: number
  } = {
    total_focus_minutes: profile.total_focus_minutes + actualMinutes,
  }

  if (completed) {
    let nextStreak = profile.streak_count

    if (profile.last_session_date === todayUtc) {
      nextStreak = profile.streak_count
    } else if (profile.last_session_date === yesterdayUtc) {
      nextStreak = profile.streak_count + 1
    } else {
      nextStreak = 1
    }

    profileUpdate.streak_count = nextStreak
    profileUpdate.longest_streak = Math.max(profile.longest_streak, nextStreak)
    profileUpdate.last_session_date = todayUtc
    profileUpdate.total_sessions = profile.total_sessions + 1
  }

  const { data: updatedProfile, error: profileUpdateError } = await supabase
    .from('profiles')
    .update(profileUpdate)
    .eq('id', user.id)
    .select('id, streak_count, longest_streak, last_session_date, total_sessions, total_focus_minutes')
    .single()

  if (profileUpdateError || !updatedProfile) {
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    session: {
      id: sessionId,
      ended_at: endedAtIso,
      completed,
      actual_minutes: actualMinutes,
    },
    profile: updatedProfile,
  })
}
