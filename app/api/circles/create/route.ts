import { NextResponse } from 'next/server'

import { getSupabaseServerClient } from '@/lib/supabase/server'

export const runtime = 'edge'
interface CreateCircleBody {
  name?: string
}

interface CircleRow {
  id: string
  name: string
  invite_code: string
  created_by: string
  created_at: string
}

const INVITE_CODE_LENGTH = 8
const INVITE_CODE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
const MAX_INVITE_CODE_RETRIES = 5

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

function getSecureRandomIndex(maxExclusive: number) {
  const randomValues = new Uint32Array(1)
  crypto.getRandomValues(randomValues)
  return randomValues[0] % maxExclusive
}

function generateInviteCode() {
  let code = ''

  for (let i = 0; i < INVITE_CODE_LENGTH; i += 1) {
    const randomIndex = getSecureRandomIndex(INVITE_CODE_CHARS.length)
    code += INVITE_CODE_CHARS[randomIndex]
  }

  return code
}

export async function POST(request: Request) {
  const supabase = await getSupabaseServerClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return errorResponse(401, 'unauthorized', 'You must be logged in to create a circle.')
  }

  let body: CreateCircleBody

  try {
    body = (await request.json()) as CreateCircleBody
  } catch {
    return errorResponse(400, 'invalid_json', 'Request body must be valid JSON.')
  }

  const name = body.name?.trim()

  if (!name) {
    return errorResponse(400, 'invalid_name', 'Request body must include a non-empty `name`.')
  }

  let createdCircle: CircleRow | null = null

  for (let attempt = 0; attempt < MAX_INVITE_CODE_RETRIES; attempt += 1) {
    const inviteCode = generateInviteCode()

    const { data, error } = await supabase
      .from('circles')
      .insert({
        name,
        invite_code: inviteCode,
        created_by: user.id,
      })
      .select('id, name, invite_code, created_by, created_at')
      .single<CircleRow>()

    if (error?.code === '23505') {
      continue
    }

    if (error || !data) {
      return errorResponse(500, 'circle_create_failed', 'Failed to create circle.', error?.message)
    }

    createdCircle = data
    break
  }

  if (!createdCircle) {
    return errorResponse(500, 'invite_code_generation_failed', 'Failed to generate a unique invite code.')
  }

  const { error: memberInsertError } = await supabase.from('circle_members').insert({
    circle_id: createdCircle.id,
    user_id: user.id,
  })

  if (memberInsertError) {
    return errorResponse(
      500,
      'circle_member_insert_failed',
      'Circle was created, but adding creator as a member failed.',
      memberInsertError.message,
    )
  }

  return NextResponse.json({
    circle: createdCircle,
  })
}
