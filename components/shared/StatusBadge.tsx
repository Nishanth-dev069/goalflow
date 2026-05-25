import React from 'react'
import { GoalStatus, TaskStatus } from '@/types'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: GoalStatus | TaskStatus
  type?: 'goal' | 'task'
  className?: string
}

export function StatusBadge({ status, type = 'goal', className }: StatusBadgeProps) {
  if (type === 'goal') {
    const config: Record<string, { label: string; class: string }> = {
      draft: { label: 'Draft', class: 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20' },
      active: { label: 'Active', class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
      completed: { label: 'Completed', class: 'bg-sky-500/10 text-sky-400 border-sky-500/20' },
      paused: { label: 'Paused', class: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
      cancelled: { label: 'Cancelled', class: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
      missed: { label: 'Missed', class: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
      default: { label: 'Unknown', class: 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20' },
    }
    const fallback = config.default
    const entry = (status && config[status]) ? config[status] : fallback

    return (
      <div className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs border font-medium", entry.class, className)}>
        {entry.label}
      </div>
    )
  }

  // Task Status
  const config: Record<string, { label: string; class: string }> = {
    todo: { label: 'To Do', class: 'text-neutral-400' },
    in_progress: { label: 'In Progress', class: 'text-sky-400' },
    review: { label: 'In Review', class: 'text-amber-400' },
    done: { label: 'Done', class: 'text-emerald-400' },
    cancelled: { label: 'Cancelled', class: 'text-rose-400 line-through' },
    default: { label: 'Unknown', class: 'text-neutral-400' },
  }
  const fallback = config.default
  const entry = (status && config[status]) ? config[status] : fallback

  return (
    <div className={cn("inline-flex items-center text-xs font-medium", entry.class, className)}>
      {entry.label}
    </div>
  )
}
