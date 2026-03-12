import { NextResponse, type NextRequest } from 'next/server'

import { getSupabaseServerClient } from '@/lib/supabase/server'


export async function GET(request: NextRequest) {
  const supabase = await getSupabaseServerClient()
  const origin = new URL(request.url).origin

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  })

  if (error || !data.url) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.redirect(data.url)
}
