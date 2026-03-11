'use client'

import { useState } from 'react'

import { getSupabaseBrowserClient } from '@/lib/supabase/client'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  if (!isOpen) {
    return null
  }

  const handleSignIn = async () => {
    const supabase = getSupabaseBrowserClient()
    setIsLoading(true)

    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    setIsLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-xl border border-[#334155] bg-[#1E293B] p-6 text-[#F8FAFC]">
        <h2 className="text-xl font-semibold">Sign in to GrindRoom</h2>
        <p className="mt-2 text-sm text-[#94A3B8]">Use Google to join rooms and track your focus streak.</p>
        <button
          type="button"
          onClick={handleSignIn}
          disabled={isLoading}
          className="mt-6 w-full rounded-md bg-[#6366F1] px-4 py-2 text-sm font-semibold text-[#F8FAFC] transition-colors hover:bg-[#4F46E5] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? 'Redirecting...' : 'Continue with Google'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full rounded-md border border-[#334155] px-4 py-2 text-sm text-[#94A3B8]"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
