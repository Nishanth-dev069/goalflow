'use client'

import React from 'react'
import Link from 'next/link'
import { Goal } from '@/types'
import { Target } from 'lucide-react'
import { TypeBadge } from '@/components/shared/TypeBadge'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { DaysRemainingBadge } from '@/components/shared/DaysRemainingBadge'
import { EmptyState } from '@/components/shared/EmptyState'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useUpdateGoal } from '@/lib/queries/goals'
import { CheckCircle2 } from 'lucide-react'

export function MyGoalsPanel({ goals, currentUser }: { goals: Goal[], currentUser: any }) {
  const router = useRouter()
  const updateMutation = useUpdateGoal()

  const handleComplete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    updateMutation.mutate({ id, data: { status: 'completed' } }, {
      onSuccess: () => toast.success('Goal marked as completed'),
      onError: (err) => toast.error(err.message)
    })
  }

  return (
    <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Target size={15} className="text-indigo-400" />
          <h2 className="text-sm font-semibold text-white">My Goals</h2>
          <span className="bg-[#1a1a1a] text-xs text-neutral-500 px-1.5 py-0.5 rounded-md">{goals.length}</span>
        </div>
        <Link href="/goals" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">View all →</Link>
      </div>

      {goals.length === 0 ? (
        <EmptyState icon={Target} title="No active goals" description="Goals assigned to you will appear here" />
      ) : (
        <div className="space-y-3">
          {goals.map(goal => {
            const isAuthorized = currentUser?.role === 'admin' || (currentUser?.role === 'manager' && goal.created_by === currentUser.id) || goal.assigned_to_user_id === currentUser?.id

            return (
              <div 
                key={goal.id} 
                onClick={() => router.push(`/goals/${goal.id}`)}
                className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl p-4 hover:border-indigo-500/30 transition-all group cursor-pointer block relative"
              >
                
                {/* Title + type */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h4 className="text-sm font-semibold text-white leading-snug line-clamp-2 flex-1 group-hover:text-indigo-300 transition-colors">
                    {goal.title}
                  </h4>
                  <div className="flex items-center gap-2">
                    {isAuthorized && goal.status !== 'completed' && (
                      <button
                        onClick={(e) => handleComplete(e, goal.id)}
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

                {/* Progress */}
                {goal.target_value ? (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-neutral-500">{goal.current_value} / {goal.target_value} {goal.unit}</span>
                      <span className="font-semibold text-white">{goal.progress_percentage || 0}%</span>
                    </div>
                    <div className="h-1.5 bg-[#2a2a2a] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: `${goal.progress_percentage || 0}%`,
                          background: (goal.progress_percentage || 0) === 100 ? '#22c55e' : (goal.progress_percentage || 0) >= 70 ? '#6366f1' : (goal.progress_percentage || 0) >= 30 ? '#f59e0b' : '#ef4444'
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <StatusBadge status={goal.status} type="goal" />
                )}

                {/* Footer */}
                <div className="flex items-center justify-between mt-3">
                  <DaysRemainingBadge daysRemaining={goal.days_remaining || 0} small isOverdue={goal.is_overdue} />
                  {goal.status === 'active' && (
                    <span className="text-[10px] text-neutral-700 group-hover:text-indigo-500 transition-colors">
                      Tap to view →
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
