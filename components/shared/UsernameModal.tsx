'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'

interface UsernameModalProps {
  isOpen: boolean
  isSaving: boolean
  onSubmit: (username: string) => Promise<void>
}

export function UsernameModal({ isOpen, isSaving, onSubmit }: UsernameModalProps) {
  const [username, setUsername] = useState('')

  if (!isOpen) {
    return null
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await onSubmit(username.trim())
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-xl border border-[#334155] bg-[#1E293B] p-6">
        <h2 className="text-xl font-semibold text-[#F8FAFC]">Choose your username</h2>
        <p className="mt-2 text-sm text-[#94A3B8]">This is how other grinders will identify you in rooms and circles.</p>
        <label className="mt-4 block text-sm text-[#94A3B8]" htmlFor="username-input">
          Username
        </label>
        <input
          id="username-input"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          minLength={3}
          maxLength={24}
          required
          className="mt-2 w-full rounded-md border border-[#334155] bg-[#0F172A] px-3 py-2 text-[#F8FAFC] outline-none focus:border-[#6366F1]"
        />
        <button
          type="submit"
          disabled={isSaving || username.trim().length < 3}
          className="mt-5 w-full rounded-md bg-[#6366F1] px-4 py-2 text-sm font-semibold text-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? 'Saving...' : 'Save Username'}
        </button>
      </form>
    </div>
  )
}
