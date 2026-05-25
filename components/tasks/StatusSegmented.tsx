'use client'

import React from 'react'
import { TaskStatus } from '@/types'
import { cn } from '@/lib/utils'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

interface Props {
  taskId: string
  currentStatus: TaskStatus
  canEdit: boolean
}

const segments: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'todo', label: 'Todo', color: 'text-neutral-300' },
  { id: 'in_progress', label: 'In Progress', color: 'text-indigo-400 border-indigo-500' },
  { id: 'review', label: 'Review', color: 'text-amber-400 border-amber-500' },
  { id: 'done', label: 'Done', color: 'text-emerald-500 border-emerald-500' },
  { id: 'cancelled', label: 'Cancelled', color: 'text-neutral-500 border-neutral-600' },
]

export function StatusSegmented({ taskId, currentStatus, canEdit }: Props) {
  const queryClient = useQueryClient()

  const updateMutation = useMutation({
    mutationFn: async (status: TaskStatus) => {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      if (!res.ok) throw new Error('Failed to update status')
      return res.json()
    },
    onMutate: async (status) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', taskId] })
      const prev = queryClient.getQueryData(['tasks', taskId])
      
      queryClient.setQueryData(['tasks', taskId], (old: any) => {
        if (!old) return old
        return { ...old, data: { ...old.data, status } }
      })
      
      return { prev }
    },
    onError: (err, status, context) => {
      if (context?.prev) queryClient.setQueryData(['tasks', taskId], context.prev)
      toast.error('Failed to update status: ' + err.message)
    },
    onSuccess: () => {
      toast.success('Status updated')
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['task_history', taskId] })
    }
  })

  return (
    <div className="flex flex-wrap items-center bg-[#0a0a0a] border border-[#2a2a2a] p-1 rounded-lg w-fit">
      {segments.map(seg => {
        const isActive = currentStatus === seg.id
        return (
          <button
            key={seg.id}
            disabled={!canEdit || isPending(updateMutation, seg.id)}
            onClick={() => {
              if (!isActive && canEdit) updateMutation.mutate(seg.id)
            }}
            className={cn(
              "px-4 py-1.5 text-sm font-medium transition-all rounded-md",
              isActive 
                ? cn("bg-[#1a1a1a] shadow-sm", seg.color)
                : "text-neutral-500 hover:text-neutral-300",
              (!canEdit || isActive) && "cursor-default"
            )}
          >
            {seg.label}
          </button>
        )
      })}
    </div>
  )
}

function isPending(mutation: any, status: string) {
  return mutation.isPending && mutation.variables === status
}
