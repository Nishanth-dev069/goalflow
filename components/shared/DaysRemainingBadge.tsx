import React from 'react'
import { cn } from '@/lib/utils'
import { Clock, AlertCircle } from 'lucide-react'

interface DaysRemainingBadgeProps {
  daysRemaining: number
  isOverdue?: boolean
  small?: boolean
  className?: string
}

export function DaysRemainingBadge({ daysRemaining, isOverdue, small, className }: DaysRemainingBadgeProps) {
  if (daysRemaining === undefined || daysRemaining === null) return null;

  return (
    <div className={cn(
      "flex items-center gap-1 rounded-full font-medium border",
      small ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs",
      isOverdue 
        ? "bg-red-500/10 text-red-500 border-red-500/20" 
        : daysRemaining <= 3
          ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
          : "bg-neutral-800 text-neutral-400 border-neutral-700",
      className
    )}>
      {isOverdue ? <AlertCircle size={small ? 10 : 12} /> : <Clock size={small ? 10 : 12} />}
      <span>
        {isOverdue ? 'Overdue' : `${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} left`}
      </span>
    </div>
  )
}
