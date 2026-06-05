import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { headers } from 'next/headers'
import { TypeBadge } from '@/components/shared/TypeBadge'
import { ScopeBadge } from '@/components/shared/ScopeBadge'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { GoalProgressRing } from '@/components/goals/GoalProgressRing'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { ArrowRight, ArrowLeft } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'

// Client components wrapper needed for the modal
import GoalDetailClientActions from '@/components/goals/GoalDetailClientActions'

async function getGoalData(id: string) {
  const supabase = await createClient()
  const { data: { user: sessionUser } } = await supabase.auth.getUser()
  const session = sessionUser ? { user: sessionUser } : null
  
  if (!session) {
    redirect('/login')
  }

  const { data: goal, error } = await supabase
    .from('goals')
    .select(`
      *,
      assigned_user:users!goals_assigned_to_user_id_fkey(id, full_name, avatar_url),
      assigned_dept:departments!goals_assigned_to_dept_id_fkey(id, name),
      creator:users!goals_created_by_fkey(id, full_name),
      goal_updates(
        id, previous_value, new_value, note, created_at,
        updater:users!goal_updates_created_by_fkey(id, full_name, avatar_url)
      )
    `)
    .eq('id', id)
    .single()

  if (error || !goal) {
    return null
  }

  const { computeGoalFields } = await import('@/lib/api-helpers')
  const computedGoal = computeGoalFields(goal)

  return { goal: computedGoal, user: session.user }
}

function RelativeTime({ date, className }: { date: string, className?: string }) {
  return (
    <span className={className}>
      {formatDistanceToNow(new Date(date), { addSuffix: true })}
    </span>
  )
}

export default async function GoalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await getGoalData(id)

  if (!data) {
    redirect('/goals')
  }

  const { goal, user } = data

  const isAssignee = goal.assigned_to_user_id === user.id
  // We can also allow managers and admins, but for now we'll pass a boolean
  // based on the data we have. We'll let the API handle strict auth on submission.
  const canLogProgress = isAssignee || goal.created_by === user.id

  const progress = goal.progress_percentage || 0

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-8 min-h-screen pb-32">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-neutral-500">
        <Link href="/goals" className="hover:text-white transition-colors flex items-center gap-1"><ArrowLeft size={14}/> Goals</Link>
        <span>/</span>
        <span className="text-white truncate max-w-[300px]">{goal.title}</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* MAIN COLUMN */}
        <div className="w-full lg:w-[65%] space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-4 leading-tight">{goal.title}</h1>
            <div className="flex flex-wrap gap-2">
              <TypeBadge type={goal.type} />
              <ScopeBadge 
                scope={goal.scope} 
                entityName={goal.scope === 'department' ? goal.assigned_dept?.name : goal.scope === 'personal' ? goal.assigned_user?.full_name : undefined}
              />
              <StatusBadge status={goal.status} type="goal" />
            </div>
            {goal.description && (
              <div className="text-neutral-400 mt-6 leading-relaxed whitespace-pre-wrap">
                {goal.description}
              </div>
            )}
          </div>

          {goal.target_value && (
            <div className="border-y border-[#2a2a2a] py-12 my-8 flex flex-col items-center justify-center bg-gradient-to-b from-[#111111]/0 via-[#111111] to-[#111111]/0">
              <GoalProgressRing progress={progress} unit="progress" />
              <p className="text-sm text-neutral-500 mt-6">
                <strong className="text-white">{goal.current_value}</strong> completed out of <strong className="text-white">{goal.target_value}</strong> target
              </p>
              
              {canLogProgress && goal.status === 'active' && (
                <div className="mt-6">
                  <GoalDetailClientActions goal={goal} />
                </div>
              )}
            </div>
          )}

          {/* Progress Timeline */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-widest mb-6">Progress History</h3>
            
            {(!goal.goal_updates || goal.goal_updates.length === 0) ? (
              <div className="text-sm text-neutral-600 py-8 text-center bg-[#111111] rounded-xl border border-[#2a2a2a]">
                No updates logged yet
              </div>
            ) : (
              <div className="space-y-6">
                {[...(goal.goal_updates || [])].reverse().map((update: any) => (
                  <div key={update.id} className="flex items-start gap-4 pb-6 border-b border-[#1a1a1a] last:border-0 last:pb-0">
                    <UserAvatar user={update.updater as any} className="w-8 h-8" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-white font-medium">{update.updater?.full_name}</span>
                        <span className="text-xs text-neutral-500">updated progress</span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="text-sm text-neutral-500 line-through">{update.previous_value}</span>
                        <ArrowRight size={12} className="text-neutral-600" />
                        <span className="text-sm font-semibold text-indigo-400">{update.new_value}</span>
                      </div>
                      {update.note && (
                        <div className="mt-3 text-sm text-neutral-300 bg-[#111111] rounded-xl px-4 py-3 italic border-l-2 border-[#3a3a3a]">
                          "{update.note}"
                        </div>
                      )}
                      <RelativeTime date={update.created_at} className="text-xs text-neutral-600 mt-2 block" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* SIDEBAR */}
        <div className="w-full lg:w-[35%] space-y-4 lg:sticky lg:top-6">
          <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-5">
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-4">Goal Details</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-neutral-500 mb-1">Created By</div>
                  <div className="text-sm text-white">{goal.creator?.full_name}</div>
                </div>
                <div>
                  <div className="text-xs text-neutral-500 mb-1">Assigned To</div>
                  <div className="text-sm text-white">
                    {goal.scope === 'personal' ? goal.assigned_user?.full_name : goal.scope === 'department' ? goal.assigned_dept?.name : 'Company'}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-neutral-500 mb-1">Start Date</div>
                  <div className="text-sm text-white">{format(new Date(goal.start_date), 'MMM d, yyyy')}</div>
                </div>
                <div>
                  <div className="text-xs text-neutral-500 mb-1">End Date</div>
                  <div className="text-sm text-white">{format(new Date(goal.end_date), 'MMM d, yyyy')}</div>
                </div>
              </div>
            </div>

            {/* Visual Timeline Bar */}
            <div className="mt-8 pt-6 border-t border-[#1a1a1a]">
              <div className="text-xs text-neutral-500 mb-3 flex justify-between">
                <span>Start</span>
                <span className={goal.is_overdue ? "text-rose-400" : ""}>{goal.is_overdue ? 'Overdue' : 'Due'}</span>
              </div>
              <div className="h-2 bg-[#2a2a2a] rounded-full relative overflow-hidden">
                <div 
                  className="absolute top-0 bottom-0 left-0 bg-neutral-600 rounded-full" 
                  style={{ width: `${Math.min(100, Math.max(0, 100 - (goal.days_remaining! / 30) * 100))}%` }} 
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
