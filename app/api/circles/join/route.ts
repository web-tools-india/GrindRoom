import { NextResponse } from 'next/server'

import { getSupabaseServerClient } from '@/lib/supabase/server'

interface JoinCircleBody {
  invite_code?: string
}

interface CircleInviteLookupRow {
  id: string
  name: string
  invite_code: string
  created_by: string
  created_at: string
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
    .rpc('resolve_circle_by_invite_code', {
      p_invite_code: inviteCode,
    })
    .single<CircleInviteLookupRow>()

  if (circleLookupError) {
    if (circleLookupError.code === 'P0002') {
      return errorResponse(404, 'circle_not_found', 'No circle found for this invite code.')
    }

    if (circleLookupError.code === '42501') {
      return errorResponse(401, 'unauthorized', 'You must be logged in to join a circle.')
    }

    return errorResponse(500, 'circle_lookup_failed', 'Failed to lookup circle.', circleLookupError.message)
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
