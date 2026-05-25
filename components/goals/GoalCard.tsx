'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Goal } from '@/types'
import { TypeBadge } from '@/components/shared/TypeBadge'
import { ScopeBadge } from '@/components/shared/ScopeBadge'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

export function GoalCard({ goal }: { goal: Goal }) {
  const router = useRouter()
  
  const prog = goal.progress_percentage || 0
  const progColor = prog < 30 ? 'bg-rose-500' : prog < 70 ? 'bg-amber-500' : prog < 100 ? 'bg-indigo-500' : 'bg-emerald-500'
  const daysLeft = goal.days_remaining || 0
  const isOverdue = goal.is_overdue

  return (
    <div 
      onClick={() => router.push(`/goals/${goal.id}`)}
      className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-5 hover:border-[#3a3a3a] transition-colors cursor-pointer flex flex-col h-full"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex flex-wrap gap-2">
          <TypeBadge type={goal.type} />
          <ScopeBadge 
            scope={goal.scope} 
            entityName={goal.scope === 'department' ? goal.assigned_dept?.name : goal.scope === 'personal' ? goal.assigned_user?.full_name : undefined}
          />
        </div>
        <StatusBadge status={goal.status} type="goal" className="shrink-0 ml-2" />
      </div>
      
      <h3 className="text-base font-semibold text-white mt-1 mb-1 leading-snug line-clamp-2">
        {goal.title}
      </h3>
      
      <p className="text-sm text-neutral-500 line-clamp-2 mb-4 min-h-[40px]">
        {goal.description || 'No description provided.'}
      </p>

      <div className="mt-auto">
        {goal.target_value ? (
          <div className="mb-4">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="text-neutral-600">Progress ({goal.current_value}/{goal.target_value})</span>
              <span className="font-medium text-white">{prog}%</span>
            </div>
            <div className="h-2 rounded-full bg-[#2a2a2a] overflow-hidden">
              <div 
                className={cn("h-full rounded-full transition-all duration-700 ease-out", progColor)} 
                style={{ width: `${prog}%` }} 
              />
            </div>
          </div>
        ) : (
          <div className="h-[34px] mb-4 flex items-center">
            <div className="text-xs text-neutral-600 italic">Milestone (Completion tracked)</div>
          </div>
        )}

        <div className="border-t border-[#1a1a1a] pt-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-neutral-600">
            <Calendar size={12} />
            <span className="text-xs text-neutral-500">
              {format(new Date(goal.start_date), 'MMM d')} - {format(new Date(goal.end_date), 'MMM d')}
            </span>
          </div>
          
          <div className={cn(
            "text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider",
            isOverdue ? "bg-rose-500/10 text-rose-400" :
            daysLeft === 0 ? "bg-rose-500/10 text-rose-400" :
            daysLeft <= 7 ? "bg-amber-500/10 text-amber-400" :
            "bg-neutral-800 text-neutral-400"
          )}>
            {isOverdue ? `OVERDUE` : daysLeft === 0 ? 'DUE TODAY' : `${daysLeft} DAYS LEFT`}
          </div>
        </div>
      </div>
    </div>
  )
}
