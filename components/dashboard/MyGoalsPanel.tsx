'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Goal } from '@/types'
import { TypeBadge } from '@/components/shared/TypeBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { Target } from 'lucide-react'
import { cn } from '@/lib/utils'

export function MyGoalsPanel({ initialData }: { initialData: Goal[] }) {
  const router = useRouter()
  const goals = initialData

  const renderGoal = (goal: Goal) => {
    if (!goal || !goal.id) return null
    const prog = goal.progress_percentage || 0
    const progColor = prog < 30 ? 'bg-rose-500' : prog < 70 ? 'bg-amber-500' : prog < 100 ? 'bg-indigo-500' : 'bg-emerald-500'
    const daysLeft = goal.days_remaining || 0
    const isOverdue = goal.is_overdue

    return (
      <div 
        key={goal.id} 
        onClick={() => router.push(`/goals/${goal.id}`)}
        className="py-4 border-b border-[#1a1a1a] last:border-0 cursor-pointer group"
      >
        <div className="flex justify-between items-start mb-2">
          <div className="text-sm font-medium text-white group-hover:text-indigo-400 transition-colors line-clamp-1 pr-4">
            {goal.title}
          </div>
          <TypeBadge type={goal.type ?? 'monthly'} className="shrink-0" />
        </div>

        {goal.target_value ? (
          <div className="mb-3">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="text-neutral-500">{goal.current_value} / {goal.target_value}</span>
              <span className="font-medium text-white">{prog}%</span>
            </div>
            <div className="h-1.5 bg-[#2a2a2a] rounded-full overflow-hidden">
              <div 
                className={cn("h-full rounded-full transition-all duration-700 ease-out", progColor)} 
                style={{ width: `${prog}%` }} 
              />
            </div>
          </div>
        ) : (
          <div className="h-1.5 mb-3" /> // spacer if no progress bar
        )}

        <div className="flex justify-between items-center">
          <div className={cn(
            "text-xs px-2 py-0.5 rounded-md font-medium",
            isOverdue ? "bg-rose-500/10 text-rose-400" :
            daysLeft === 0 ? "bg-rose-500/10 text-rose-400" :
            daysLeft <= 7 ? "bg-amber-500/10 text-amber-400" :
            "bg-neutral-800 text-neutral-400"
          )}>
            {isOverdue ? `${Math.abs(daysLeft)} days overdue` : daysLeft === 0 ? 'Due today' : `${daysLeft} days left`}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-5">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base font-semibold text-white">My Goals</h2>
        <Link href="/goals" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
          View all â†’
        </Link>
      </div>

      <div className="flex flex-col">
        {goals.length === 0 ? (
          <div className="py-8">
            <EmptyState icon={Target} title="No personal goals yet" />
          </div>
        ) : (
          goals.slice(0, 5).map(renderGoal)
        )}
      </div>
    </div>
  )
}
