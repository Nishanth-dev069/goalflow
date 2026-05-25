import { Clock, Calendar, CalendarRange, Milestone } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GoalType } from '@/types'

interface TypeBadgeProps {
  type: GoalType | string | null | undefined
  className?: string
}

const typeConfig: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  weekly:    { icon: Clock,         label: 'Weekly',    color: 'bg-sky-500/10 text-sky-400 border-sky-500/20' },
  monthly:   { icon: Calendar,      label: 'Monthly',   color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
  yearly:    { icon: CalendarRange, label: 'Yearly',    color: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
  long_term: { icon: Milestone,     label: 'Long-term', color: 'bg-pink-500/10 text-pink-400 border-pink-500/20' },
}

const fallback = { icon: Calendar, label: 'Goal', color: 'bg-neutral-800 text-neutral-400 border-neutral-700' }

export function TypeBadge({ type, className }: TypeBadgeProps) {
  // GUARD: if type is null, undefined, or not in config — use fallback, never crash
  const entry = (type && typeConfig[type]) ? typeConfig[type] : fallback
  const Icon = entry.icon

  return (
    <span className={cn(
      'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md border',
      entry.color,
      className
    )}>
      <Icon size={10} />
      {entry.label}
    </span>
  )
}
