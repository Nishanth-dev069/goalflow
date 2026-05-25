'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Goal } from '@/types'
import { TypeBadge } from '@/components/shared/TypeBadge'
import { Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function CompanyGoalsPanel({ initialData }: { initialData: Goal[] }) {
  const router = useRouter()
  const goals = initialData

  if (goals.length === 0) return null

  const renderGoal = (goal: Goal) => {
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
          <TypeBadge type={goal.type} className="shrink-0" />
        </div>

        {goal.target_value && (
          <div className="mb-3 mt-1">
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
        )}

        <div className="flex justify-between items-center mt-1">
          <div className={cn(
            "text-[10px] uppercase font-bold tracking-wider",
            isOverdue ? "text-rose-400" :
            daysLeft === 0 ? "text-rose-400" :
            daysLeft <= 7 ? "text-amber-400" :
            "text-neutral-600"
          )}>
            {isOverdue ? `OVERDUE` : daysLeft === 0 ? 'DUE TODAY' : `${daysLeft} DAYS LEFT`}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-5 relative overflow-hidden">
      {/* Decorative background flair */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />

      <div className="flex items-center justify-between mb-2 relative z-10">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-white">Company Goals</h2>
          <Building2 size={16} className="text-neutral-600" />
        </div>
      </div>

      <div className="flex flex-col relative z-10">
        {goals.slice(0, 5).map(renderGoal)}
      </div>

      {goals.length > 5 && (
        <Link href="/goals?scope=company" className="block text-center text-xs text-neutral-400 hover:text-white mt-4 pt-4 border-t border-[#1a1a1a] transition-colors">
          View all {goals.length} company goals â†’
        </Link>
      )}
    </div>
  )
}
