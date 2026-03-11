'use client'

import { useMemo, useState } from 'react'

import { ActiveSessionCard } from '@/components/room/ActiveSessionCard'
import { SessionStartCard } from '@/components/room/SessionStartCard'
import { CompletionModal } from '@/components/shared/CompletionModal'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import type { SessionStartPayload } from '@/lib/types'

interface RoomSessionManagerProps {
  roomId: string
  userId: string | null
}

interface ActiveSessionState {
  id: string
  task: string
  timerEndAt: string
}

interface CompleteSessionResponse {
  session?: {
    actual_minutes?: number | null
  }
  error?: string
}

export function RoomSessionManager({ roomId, userId }: RoomSessionManagerProps) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), [])
  const [activeSession, setActiveSession] = useState<ActiveSessionState | null>(null)
  const [completionMinutes, setCompletionMinutes] = useState(0)
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleStartSession = async ({ task, durationMinutes }: SessionStartPayload) => {
    if (!userId) {
      setErrorMessage('Please sign in to start a focus session.')
      return
    }

    const trimmedTask = task.trim()
    if (!trimmedTask) {
      setErrorMessage('Please enter a task before starting your session.')
      return
    }

    setErrorMessage(null)

    const startedAt = new Date().toISOString()

    const { data, error } = await supabase
      .from('sessions')
      .insert({
        user_id: userId,
        room_id: roomId,
        task_declared: trimmedTask,
        duration_minutes: durationMinutes,
        started_at: startedAt,
      })
      .select('id, task_declared, started_at, duration_minutes')
      .single()

    if (error || !data) {
      setErrorMessage('Unable to start your session right now. Please try again.')
      return
    }

    const timerEndAt = new Date(new Date(data.started_at).getTime() + data.duration_minutes * 60_000).toISOString()

    setActiveSession({
      id: data.id,
      task: data.task_declared,
      timerEndAt,
    })
  }

  const handleCompleteSession = async () => {
    if (!activeSession) {
      return
    }

    setErrorMessage(null)

    const response = await fetch('/api/session/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_id: activeSession.id,
        completed: true,
      }),
    })

    const payload = (await response.json()) as CompleteSessionResponse

    if (!response.ok) {
      setErrorMessage(payload.error ?? 'Unable to complete your session right now. Please try again.')
      return
    }

    setCompletionMinutes(payload.session?.actual_minutes ?? 0)
    setActiveSession(null)
    setIsCompletionModalOpen(true)
  }

  return (
    <>
      {activeSession ? (
        <ActiveSessionCard task={activeSession.task} timerEndAt={activeSession.timerEndAt} onComplete={handleCompleteSession} />
      ) : (
        <SessionStartCard onStart={handleStartSession} />
      )}

      {errorMessage ? <p className="text-sm text-[#EF4444]">{errorMessage}</p> : null}

      <CompletionModal
        isOpen={isCompletionModalOpen}
        focusMinutes={completionMinutes}
        onClose={() => setIsCompletionModalOpen(false)}
      />
    </>
  )
}
