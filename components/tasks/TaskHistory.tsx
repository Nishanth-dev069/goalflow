'use client'

import React, { useState } from 'react'
import { TaskHistory as TaskHistoryType, User } from '@/types'
import { useQuery } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { ChevronDown, ChevronRight, Loader2 } from 'lucide-react'

export function TaskHistory({ taskId }: { taskId: string }) {
  const [isOpen, setIsOpen] = useState(false)

  const { data: history = [], isLoading } = useQuery({
    queryKey: ['task_history', taskId],
    queryFn: async () => {
      const res = await fetch(`/api/tasks/${taskId}/history`)
      if (!res.ok) throw new Error('Failed to fetch history')
      const json = await res.json()
      return json.data as (TaskHistoryType & { user: User })[]
    },
    enabled: isOpen
  })

  return (
    <div className="mt-8 pt-6 border-t border-[#1a1a1a]">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-xs font-semibold text-neutral-500 uppercase tracking-widest hover:text-neutral-400 transition-colors w-full"
      >
        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        Task History
      </button>

      {isOpen && (
        <div className="mt-4 space-y-3">
          {isLoading ? (
            <div className="flex justify-center"><Loader2 className="animate-spin text-neutral-600" /></div>
          ) : history.length === 0 ? (
            <div className="text-xs text-neutral-600 italic">No history recorded yet.</div>
          ) : (
            history.map(entry => (
              <div key={entry.id} className="text-xs text-neutral-500 leading-snug">
                <span className="font-medium text-neutral-300">{entry.user?.full_name}</span>{' '}
                changed <span className="text-neutral-400">{entry.field_changed.replace('_', ' ')}</span>{' '}
                from <span className="line-through text-neutral-600">{entry.old_value || 'none'}</span>{' '}
                to <span className="font-medium text-neutral-300">{entry.new_value || 'none'}</span>{' '}
                <span className="text-neutral-600 ml-1">· {formatDistanceToNow(new Date(entry.changed_at))} ago</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
