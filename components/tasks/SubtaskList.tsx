'use client'

import React from 'react'
import { Check } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function SubtaskList({ taskId, subtasks, canEdit }: { taskId: string, subtasks: any[], canEdit: boolean }) {
  const queryClient = useQueryClient()

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_completed }: { id: string, is_completed: boolean }) => {
      const res = await fetch(`/api/subtasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_completed })
      })
      if (!res.ok) throw new Error('Failed to toggle subtask')
      return res.json()
    },
    onMutate: async ({ id, is_completed }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', taskId] })
      const prev = queryClient.getQueryData(['tasks', taskId])
      
      queryClient.setQueryData(['tasks', taskId], (old: any) => {
        if (!old) return old
        return {
          ...old,
          data: {
            ...old.data,
            subtasks: old.data.subtasks.map((st: any) => st.id === id ? { ...st, is_completed } : st)
          }
        }
      })
      return { prev }
    },
    onError: (err, variables, context) => {
      if (context?.prev) queryClient.setQueryData(['tasks', taskId], context.prev)
      toast.error(err.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', taskId] })
    }
  })

  if (!subtasks || subtasks.length === 0) return null

  return (
    <div className="pt-6 border-t border-[#1a1a1a]">
      <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-widest mb-4">Subtasks</h3>
      <div className="space-y-2">
        {subtasks.sort((a: any, b: any) => a.position - b.position).map((sub: any) => (
          <div key={sub.id} className="flex items-center gap-3 bg-[#111111] border border-[#2a2a2a] p-3 rounded-lg">
            <button
              disabled={!canEdit || toggleMutation.isPending}
              onClick={() => canEdit && toggleMutation.mutate({ id: sub.id, is_completed: !sub.is_completed })}
              className={cn(
                "w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors border",
                sub.is_completed 
                  ? "bg-indigo-600 border-indigo-600" 
                  : "border-[#4a4a4a] hover:border-indigo-500",
                !canEdit && "opacity-50 cursor-not-allowed"
              )}
            >
              {sub.is_completed && <Check size={12} className="text-white" />}
            </button>
            <span className={cn("text-sm transition-colors", sub.is_completed ? "text-neutral-500 line-through" : "text-white")}>
              {sub.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
