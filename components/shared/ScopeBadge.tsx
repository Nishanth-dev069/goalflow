import React from 'react'
import { Building2, Users, User } from 'lucide-react'
import { GoalScope } from '@/types'
import { cn } from '@/lib/utils'

interface ScopeBadgeProps {
  scope: GoalScope
  entityName?: string // Department name or Person name
  className?: string
}

export function ScopeBadge({ scope, entityName, className }: ScopeBadgeProps) {
  if (!scope) {
    return <span className={cn("inline-flex items-center text-xs text-neutral-600 px-2 py-0.5", className)}>—</span>
  }

  if (scope === 'company') {
    return (
      <div className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs border bg-sky-500/10 text-sky-400 border-sky-500/20", className)}>
        <Building2 size={12} />
        <span>Company</span>
      </div>
    )
  }

  if (scope === 'department') {
    return (
      <div className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs border bg-purple-500/10 text-purple-400 border-purple-500/20", className)}>
        <Users size={12} />
        <span className="truncate max-w-[120px]">{entityName || 'Department'}</span>
      </div>
    )
  }

  return (
    <div className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs border bg-teal-500/10 text-teal-400 border-teal-500/20", className)}>
      <User size={12} />
      <span className="truncate max-w-[120px]">{entityName || 'Personal'}</span>
    </div>
  )
}
