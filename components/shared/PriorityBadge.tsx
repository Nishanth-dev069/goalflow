import React from 'react'
import { cn } from '@/lib/utils'

interface PriorityBadgeProps {
  priority: string | null | undefined
  className?: string
}

const config: Record<string, { label: string; class: string }> = {
  low:    { label: 'Low',    class: 'border-emerald-500 text-emerald-400' },
  medium: { label: 'Medium', class: 'border-amber-500 text-amber-400' },
  high:   { label: 'High',   class: 'border-orange-500 text-orange-400' },
  urgent: { label: 'Urgent', class: 'border-rose-500 text-rose-400' },
  default:{ label: '—',      class: 'border-neutral-600 text-neutral-500' },
}

const fallback = { label: 'Unknown', class: 'border-neutral-600 text-neutral-500' }

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const entry = (priority && config[priority]) ? config[priority] : config['default'] || fallback

  return (
    <div className={cn('inline-flex items-center text-xs font-medium border-l-2 pl-2', entry.class, className)}>
      {entry.label}
    </div>
  )
}
