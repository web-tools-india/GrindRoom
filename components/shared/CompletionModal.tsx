'use client'

interface CompletionModalProps {
  isOpen: boolean
  focusMinutes: number
  onClose: () => void
}

export function CompletionModal({ isOpen, focusMinutes, onClose }: CompletionModalProps) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-xl border border-[#334155] bg-[#1E293B] p-6 text-center text-[#F8FAFC]">
        <p className="text-4xl">🔥</p>
        <h2 className="mt-3 text-2xl font-semibold">Session complete</h2>
        <p className="mt-2 text-sm text-[#94A3B8]">You just logged {focusMinutes} focused minutes. Keep the streak alive.</p>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 rounded-md bg-[#10B981] px-5 py-2 text-sm font-semibold text-[#0F172A]"
        >
          Nice. Back to room
        </button>
      </div>
    </div>
  )
}
