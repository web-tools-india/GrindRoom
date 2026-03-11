import { createClient } from '@supabase/supabase-js'

function getRequiredEnv(name: 'NEXT_PUBLIC_SUPABASE_URL' | 'SUPABASE_SERVICE_ROLE_KEY') {
  const value = process.env[name]

  if (!value) {
    if (name === 'SUPABASE_SERVICE_ROLE_KEY') {
      throw new Error(
        'Missing SUPABASE_SERVICE_ROLE_KEY environment variable. Server-side admin operations cannot run without it.',
      )
    }

    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable for Supabase admin client.')
  }

  return value
}

export function getSupabaseAdminClient() {
  return createClient(getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL'), getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
