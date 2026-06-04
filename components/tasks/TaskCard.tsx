'use client'

import React, { useState } from 'react'
import { Task } from '@/types'
import { Check, Loader2, ArrowRight, Lock, Repeat } from 'lucide-react'
import { PriorityBadge } from '@/components/shared/PriorityBadge'
import { isPast, isToday } from 'date-fns'
import { formatDateIST } from '@/lib/utils/dates'
import { cn } from '@/lib/utils'
import { useQueryClient } from '@tanstack/react-query'
import { useUpdateTask } from '@/lib/queries/tasks'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function TaskCard({ task }: { task: Task }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  
  const isCompleted = task.status === 'done'
  const isOverdue = task.is_overdue && !isCompleted

  const pColor = {
    urgent: 'bg-rose-500',
    high: 'bg-orange-500',
    medium: 'bg-amber-500',
    low: 'bg-emerald-500'
  }[task.priority]

  const updateMutation = useUpdateTask()

  const cycleStatus = (e: React.MouseEvent) => {
    e.stopPropagation()
    const statuses = ['todo', 'in_progress', 'review', 'done']
    const currentIndex = statuses.indexOf(task.status)
    const next = (currentIndex === -1 ? 'todo' : statuses[(currentIndex + 1) % statuses.length]) || 'todo'
    
    if (next === 'in_progress' && task.is_blocked) {
      toast.error('Cannot start task: it is blocked by dependencies')
      return
    }

    toast.success(`Task marked as ${next.replace('_', ' ')}`)
    updateMutation.mutate({ id: task.id, data: { status: next } })
  }

  return (
    <div 
      onClick={() => router.push(`/tasks/${task.id}`)}
      onMouseEnter={() => router.prefetch(`/tasks/${task.id}`)}
      className={cn(
        "bg-[#111111] border border-[#2a2a2a] rounded-xl p-4 hover:border-[#3a3a3a] transition-all cursor-pointer relative group flex",
        isCompleted && "opacity-60"
      )}
    >
      {/* Left accent */}
      <div className={cn("w-1 h-full absolute left-0 top-0 bottom-0 rounded-l-xl", pColor)} />

      <div className="flex-1 ml-2">
        <div className="flex items-start gap-3">
          <div className="p-2 -m-2 z-10" onClick={cycleStatus}>
            <div 
              className={cn(
                "w-5 h-5 rounded-full mt-0.5 flex items-center justify-center cursor-pointer transition-colors shrink-0",
                task.status === 'done' ? "bg-emerald-500" :
                task.status === 'in_progress' ? "border-2 border-indigo-500 bg-indigo-500/20" :
                "border-2 border-[#3a3a3a] hover:border-indigo-500"
              )}
            >
              {task.status === 'done' && <Check size={12} className="text-white" />}
            </div>
          </div>
          
          <div className="flex-1">
            <h3 className={cn(
              "text-sm font-semibold mb-2",
              isCompleted ? "line-through text-neutral-500" : "text-white"
            )}>
              {task.title}
            </h3>

            <div className="flex flex-wrap items-center gap-3">
              <PriorityBadge priority={task.priority} />
              
              {task.due_date && (
                <span className={cn(
                  "text-xs font-medium",
                  isOverdue ? "text-rose-400" : isToday(new Date(task.due_date)) ? "text-amber-400" : "text-neutral-500"
                )}>
                  {formatDateIST(task.due_date, 'MMM d, yyyy')}
                </span>
              )}

              {task.is_blocked && (
                <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded">
                  <Lock size={10} /> Blocked
                </span>
              )}
              {task.recurrence && (
                <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded" title={`Repeats ${task.recurrence}`}>
                  <Repeat size={10} />
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {isOverdue && (
        <div className="absolute top-4 right-4 bg-rose-500/10 text-rose-400 text-[10px] uppercase font-bold px-2 py-0.5 rounded">
          Overdue
        </div>
      )}
    </div>
  )
}
