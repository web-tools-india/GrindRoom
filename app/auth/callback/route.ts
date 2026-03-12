import { NextResponse, type NextRequest } from 'next/server'

import { getSupabaseServerClient } from '@/lib/supabase/server'


export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  const supabase = await getSupabaseServerClient()
  await supabase.auth.exchangeCodeForSession(code)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .maybeSingle()

  const hasUsername = typeof profile?.username === 'string' && profile.username.trim().length > 0
  const dashboardPath = hasUsername ? '/dashboard' : '/dashboard?setup=1'

  return NextResponse.redirect(new URL(dashboardPath, request.url))
}
