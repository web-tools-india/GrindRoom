import { NextResponse } from 'next/server'

import { getSupabaseServerClient } from '@/lib/supabase/server'

interface JoinCircleBody {
  invite_code?: string
}

function errorResponse(status: number, code: string, message: string, details?: string) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        details: details ?? null,
      },
    },
    { status },
  )
}

export async function POST(request: Request) {
  const supabase = await getSupabaseServerClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return errorResponse(401, 'unauthorized', 'You must be logged in to join a circle.')
  }

  let body: JoinCircleBody

  try {
    body = (await request.json()) as JoinCircleBody
  } catch {
    return errorResponse(400, 'invalid_json', 'Request body must be valid JSON.')
  }

  const inviteCode = body.invite_code?.trim().toUpperCase()

  if (!inviteCode) {
    return errorResponse(400, 'invalid_invite_code', 'Request body must include `invite_code`.')
  }

  const { data: circle, error: circleLookupError } = await supabase
    .from('circles')
    .select('id, name, invite_code, created_by, created_at')
    .eq('invite_code', inviteCode)
    .maybeSingle()

  if (circleLookupError) {
    return errorResponse(500, 'circle_lookup_failed', 'Failed to lookup circle.', circleLookupError.message)
  }

  if (!circle) {
    return errorResponse(404, 'circle_not_found', 'No circle found for this invite code.')
  }

  const { error: joinError } = await supabase.from('circle_members').insert({
    circle_id: circle.id,
    user_id: user.id,
  })

  if (joinError && joinError.code !== '23505') {
    return errorResponse(500, 'circle_join_failed', 'Failed to join circle.', joinError.message)
  }

  return NextResponse.json({
    circle,
  })
}
