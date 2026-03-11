'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { UsernameModal } from '@/components/shared/UsernameModal'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

interface DashboardClientProps {
  needsUsernameSetup: boolean
}

export function DashboardClient({ needsUsernameSetup }: DashboardClientProps) {
  const router = useRouter()
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState<boolean>(needsUsernameSetup)
  const [isSavingUsername, setIsSavingUsername] = useState<boolean>(false)

  const handleUsernameSubmit = async (username: string): Promise<void> => {
    if (username.length < 3) {
      return
    }

    setIsSavingUsername(true)

    const supabase = getSupabaseBrowserClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setIsSavingUsername(false)
      return
    }

    const { error } = await supabase.from('profiles').update({ username }).eq('id', user.id)

    setIsSavingUsername(false)

    if (error) {
      console.error('Failed to save username:', error.message)
      return
    }

    setIsUsernameModalOpen(false)
    router.refresh()
  }

  return <UsernameModal isOpen={isUsernameModalOpen} isSaving={isSavingUsername} onSubmit={handleUsernameSubmit} />
}
