'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export function RealtimeProvider() {
  const queryClient = useQueryClient()
  
  useEffect(() => {
    // We use the authenticated client
    const supabase = createClient()
    
    const channel = supabase.channel('global-changes')

    // Handle reconnections / offline recovery
    channel.on('system', {}, (payload) => {
      if (payload.status === 'SUBSCRIBED') {
        // Re-fetch everything on reconnect in case we missed events while offline
        queryClient.invalidateQueries({ queryKey: ['tasks'] })
        queryClient.invalidateQueries({ queryKey: ['goals'] })
        queryClient.invalidateQueries({ queryKey: ['checkpoints'] })
      }
    })

    // Listen to tasks
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'tasks' },
      (payload) => {
        queryClient.invalidateQueries({ queryKey: ['tasks'] })
      }
    )

    // Listen to goals
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'goals' },
      (payload) => {
        queryClient.invalidateQueries({ queryKey: ['goals'] })
      }
    )

    // Listen to checkpoints
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'checkpoints' },
      (payload) => {
        // Invalidating checkpoints and goals, as completing a checkpoint affects goal progress
        queryClient.invalidateQueries({ queryKey: ['checkpoints'] })
        queryClient.invalidateQueries({ queryKey: ['goals'] })
      }
    )

    channel.subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])

  // This component doesn't render anything visually
  return null
}
