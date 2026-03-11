'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'

import type { SessionStartPayload } from '@/lib/types'

interface SessionStartCardProps {
  onStart: (payload: SessionStartPayload) => Promise<void>
}

const durations = [25, 45, 60, 90]

export function SessionStartCard({ onStart }: SessionStartCardProps) {
  const [task, setTask] = useState('')
  const [durationMinutes, setDurationMinutes] = useState(25)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    await onStart({ task: task.trim(), durationMinutes })
    setIsSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-[#334155] bg-[#1E293B] p-5">
      <h3 className="text-lg font-semibold text-[#F8FAFC]">Start a focus session</h3>
      <input
        value={task}
        onChange={(event) => setTask(event.target.value)}
        placeholder="What are you working on?"
        required
        className="mt-4 w-full rounded-md border border-[#334155] bg-[#0F172A] px-3 py-2 text-sm text-[#F8FAFC] outline-none focus:border-[#6366F1]"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        {durations.map((duration) => (
          <button
            key={duration}
            type="button"
            onClick={() => setDurationMinutes(duration)}
            className={`rounded-md border px-3 py-1 text-sm ${
              durationMinutes === duration ? 'border-[#6366F1] text-[#6366F1]' : 'border-[#334155] text-[#94A3B8]'
            }`}
          >
            {duration}m
          </button>
        ))}
      </div>
      <button
        type="submit"
        disabled={task.trim().length === 0 || isSubmitting}
        className="mt-4 rounded-md bg-[#6366F1] px-4 py-2 text-sm font-semibold text-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? 'Starting...' : 'Start Session'}
      </button>
    </form>
  )
}
