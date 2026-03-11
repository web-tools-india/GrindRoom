'use client'

import { useEffect, useMemo, useState } from 'react'

import { formatTimer } from '@/lib/utils'

interface ActiveSessionCardProps {
  task: string
  timerEndAt: string
  onComplete: () => Promise<void>
}

export function ActiveSessionCard({ task, timerEndAt, onComplete }: ActiveSessionCardProps) {
  const [now, setNow] = useState(() => new Date().getTime())

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  const remaining = useMemo(() => {
    if (now === 0) {
      return new Date(timerEndAt).getTime() - new Date(timerEndAt).getTime()
    }

    return new Date(timerEndAt).getTime() - now
  }, [timerEndAt, now])

  return (
    <section className="rounded-xl border border-[#334155] bg-[#1E293B] p-5">
      <p className="text-sm uppercase tracking-wide text-[#94A3B8]">Active session</p>
      <h3 className="mt-1 text-xl font-semibold text-[#F8FAFC]">{task}</h3>
      <p className="mt-2 font-mono text-3xl text-[#10B981]">{formatTimer(remaining)}</p>
      <button
        type="button"
        onClick={() => void onComplete()}
        className="mt-4 rounded-md bg-[#10B981] px-4 py-2 text-sm font-semibold text-[#0F172A]"
      >
        Mark Complete
      </button>
    </section>
  )
}
