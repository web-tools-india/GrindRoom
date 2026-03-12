import { NextResponse } from 'next/server'

import { getSupabaseServerClient } from '@/lib/supabase/server'

interface SessionStartBody {
  room_id?: string
  task_declared?: string
  duration_minutes?: number
}

interface SessionRow {
  id: string
  task_declared: string
  started_at: string
  duration_minutes: number
}

function errorResponse(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status })
}

export async function POST(request: Request) {
  const supabase = await getSupabaseServerClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return errorResponse(401, 'unauthorized', 'You must be logged in to start a session.')
  }

  let body: SessionStartBody
  try {
    body = (await request.json()) as SessionStartBody
  } catch {
    return errorResponse(400, 'invalid_json', 'Request body must be valid JSON.')
  }

  const { room_id, task_declared, duration_minutes } = body

  if (!room_id || typeof room_id !== 'string') {
    return errorResponse(400, 'invalid_room', 'room_id is required.')
  }
  if (!task_declared || typeof task_declared !== 'string' || task_declared.trim().length === 0) {
    return errorResponse(400, 'invalid_task', 'task_declared is required.')
  }
  if (!duration_minutes || typeof duration_minutes !== 'number') {
    return errorResponse(400, 'invalid_duration', 'duration_minutes is required.')
  }

  const trimmedTask = task_declared.trim().slice(0, 120)
  const startedAt = new Date().toISOString()

  const { data, error } = await supabase
    .from('sessions')
    .insert({
      user_id: user.id,
      room_id,
      task_declared: trimmedTask,
      duration_minutes,
      started_at: startedAt,
    })
    .select('id, task_declared, started_at, duration_minutes')
    .single<SessionRow>()

  if (error || !data) {
    return errorResponse(500, 'session_start_failed', 'Failed to start session.')
  }

  return NextResponse.json({ session: data })
            }
