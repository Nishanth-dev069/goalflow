'use client'

import React from 'react'
import Link from 'next/link'
import { Goal } from '@/types'
import { Building2, CalendarRange } from 'lucide-react'
import { TypeBadge } from '@/components/shared/TypeBadge'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { DaysRemainingBadge } from '@/components/shared/DaysRemainingBadge'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

import { toast } from 'sonner'
import { useUpdateGoal } from '@/lib/queries/goals'
import { CheckCircle2 } from 'lucide-react'
import { GoalCard } from '@/components/goals/GoalCard'

export function CompanyGoalsHero({ goals, currentUser }: { goals: Goal[], currentUser: any }) {
  const heroGoals = goals.filter(g => g.type === 'yearly' || g.type === 'long_term')
  const regularGoals = goals.filter(g => g.type === 'weekly' || g.type === 'monthly')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 size={16} className="text-neutral-500" />
          <h2 className="text-sm font-semibold text-white">Company Goals</h2>
          <span className="text-xs text-neutral-600 hidden sm:inline">Shared with everyone</span>
        </div>
        <Link href="/goals?scope=company" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
          View all →
        </Link>
      </div>

      {heroGoals.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {heroGoals.map(goal => <HeroGoalCard key={goal.id} goal={goal} currentUser={currentUser} />)}
        </div>
      )}

      {regularGoals.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {regularGoals.map(goal => <GoalCard key={goal.id} goal={goal} />)}
        </div>
      )}
    </div>
  )
}

function HeroGoalCard({ goal, currentUser }: { goal: Goal, currentUser: any }) {
  const router = useRouter()
  const updateMutation = useUpdateGoal()

  const isAuthorized = currentUser?.role === 'admin' || (currentUser?.role === 'manager' && goal.created_by === currentUser.id)

  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation()
    updateMutation.mutate({ id: goal.id, data: { status: 'completed' } }, {
      onSuccess: () => toast.success('Goal marked as completed'),
      onError: (err) => toast.error(err.message)
    })
  }

  return (
    <div 
      onClick={() => router.push(`/goals/${goal.id}`)}
      onMouseEnter={() => router.prefetch(`/goals/${goal.id}`)}
      className="relative overflow-hidden bg-gradient-to-br from-indigo-500/10 via-[#111111] to-[#111111] border border-indigo-500/20 rounded-2xl p-6 hover:border-indigo-500/40 transition-all group cursor-pointer"
    >
      <div className="absolute -top-8 -right-8 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl" />
      
      <div className="flex items-center gap-2 mb-4 relative z-10">
        <TypeBadge type={goal.type} />
        <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
          Company
        </span>
        <div className="ml-auto flex items-center gap-2">
          {isAuthorized && goal.status !== 'completed' && (
            <button
              onClick={handleComplete}
              disabled={updateMutation.isPending}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-emerald-500/20 rounded-md text-emerald-500"
              title="Mark as completed"
            >
              <CheckCircle2 size={16} />
            </button>
          )}
          <StatusBadge status={goal.status} type="goal" />
        </div>
      </div>

      <h3 className="text-lg font-bold text-white mb-2 leading-snug group-hover:text-indigo-100 transition-colors relative z-10">
        {goal.title}
      </h3>
      
      {goal.description && (
        <p className="text-sm text-neutral-400 mb-4 line-clamp-2 leading-relaxed relative z-10">
          {goal.description}
        </p>
      )}

      {goal.target_value && (
        <div className="mb-4 relative z-10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-neutral-500">Progress</span>
            <span className="text-sm font-bold text-white">{goal.progress_percentage || 0}%</span>
          </div>
          <div className="h-2.5 bg-[#2a2a2a] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r from-indigo-600 to-indigo-400"
              style={{ width: `${goal.progress_percentage || 0}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-xs text-neutral-600">{goal.current_value} {goal.unit}</span>
            <span className="text-xs text-neutral-600">Target: {goal.target_value} {goal.unit}</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-1.5 text-xs text-neutral-500">
          <CalendarRange size={11} />
          <span>{format(new Date(goal.start_date), 'MMM yyyy')} — {format(new Date(goal.end_date), 'MMM yyyy')}</span>
        </div>
        <DaysRemainingBadge daysRemaining={goal.days_remaining || 0} isOverdue={goal.is_overdue} />
      </div>
    </div>
  )
}

function CompactGoalCard({ goal, currentUser }: { goal: Goal, currentUser: any }) {
  const router = useRouter()
  const updateMutation = useUpdateGoal()

  const isAuthorized = currentUser?.role === 'admin' || (currentUser?.role === 'manager' && goal.created_by === currentUser.id)

  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation()
    updateMutation.mutate({ id: goal.id, data: { status: 'completed' } }, {
      onSuccess: () => toast.success('Goal marked as completed'),
      onError: (err) => toast.error(err.message)
    })
  }

  return (
    <div 
      onClick={() => router.push(`/goals/${goal.id}`)}
      onMouseEnter={() => router.prefetch(`/goals/${goal.id}`)}
      className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-4 hover:border-[#3a3a3a] transition-all group cursor-pointer relative"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-semibold text-white leading-snug line-clamp-1 flex-1 group-hover:text-indigo-300 transition-colors">
          {goal.title}
        </h4>
        <div className="flex items-center gap-2">
          {isAuthorized && goal.status !== 'completed' && (
            <button
              onClick={handleComplete}
              disabled={updateMutation.isPending}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 -m-1 hover:bg-emerald-500/20 rounded-md text-emerald-500"
              title="Mark as completed"
            >
              <CheckCircle2 size={14} />
            </button>
          )}
          <TypeBadge type={goal.type} />
        </div>
      </div>
      {goal.target_value ? (
        <>
          <div className="h-1.5 bg-[#2a2a2a] rounded-full overflow-hidden mb-1.5">
            <div className="h-full rounded-full transition-all duration-700"
              style={{ 
                width: `${goal.progress_percentage || 0}%`, 
                backgroundColor: (goal.progress_percentage || 0) >= 70 ? '#22c55e' : (goal.progress_percentage || 0) >= 30 ? '#f59e0b' : '#6366f1' 
              }}
            />
          </div>
          <div className="flex justify-between">
            <span className="text-[11px] text-neutral-600">{goal.progress_percentage || 0}% complete</span>
            <DaysRemainingBadge daysRemaining={goal.days_remaining || 0} small isOverdue={goal.is_overdue} />
          </div>
        </>
      ) : (
        <div className="flex items-center justify-between">
          <StatusBadge status={goal.status} type="goal" />
          <DaysRemainingBadge daysRemaining={goal.days_remaining || 0} small isOverdue={goal.is_overdue} />
        </div>
      )}
    </div>
  )
}
