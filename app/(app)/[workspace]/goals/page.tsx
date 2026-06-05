'use client'

import React, { useState, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { PageHeader } from '@/components/shared/PageHeader'
import { TypeBadge } from '@/components/shared/TypeBadge'
import { ScopeBadge } from '@/components/shared/ScopeBadge'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { EmptyState } from '@/components/shared/EmptyState'
import { BackButton } from '@/components/shared/BackButton'
import { useGoals, useUpdateGoal, useDeleteGoal } from '@/lib/queries/goals'
import { Goal } from '@/types'
import { Search, MoreVertical, Plus, Target, CheckCircle2, Clock } from 'lucide-react'
import { format, formatDistanceToNow, isPast } from 'date-fns'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function GoalsManagementPage() {
  const router = useRouter()
  const params = useParams<{ workspace: string }>()
  const workspace = params.workspace || 'admin'
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [scopeFilter, setScopeFilter] = useState('all')

  const { data: goalsResponse, isLoading } = useGoals()
  const goals: Goal[] = goalsResponse?.data || []
  
  const updateMutation = useUpdateGoal()
  const deleteMutation = useDeleteGoal()

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'weekly', label: 'Weekly' },
    { id: 'monthly', label: 'Monthly' },
    { id: 'yearly', label: 'Yearly' },
    { id: 'long_term', label: 'Long-term' },
  ]

  // Client-side filtering (we fetch all and filter client side for smooth UI, or we could pass params to useGoals)
  const filteredGoals = useMemo(() => {
    let result = goals

    if (activeTab !== 'all') result = result.filter(g => g.type === activeTab)
    if (statusFilter !== 'all') result = result.filter(g => g.status === statusFilter)
    if (scopeFilter !== 'all') result = result.filter(g => g.scope === scopeFilter)
    
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(g => g.title.toLowerCase().includes(q) || g.description?.toLowerCase().includes(q))
    }

    return result
  }, [goals, search, activeTab, statusFilter, scopeFilter])

  // Quick stats
  const activeGoals = goals.filter(g => g.status === 'active').length
  const completedGoals = goals.filter(g => g.status === 'completed').length
  const overdueGoals = goals.filter(g => g.is_overdue).length

  const handleStatusChange = (id: string, newStatus: any) => {
    updateMutation.mutate({ id, data: { status: newStatus } }, {
      onSuccess: () => toast.success(`Goal marked as ${newStatus}`),
      onError: (err) => toast.error(err.message)
    })
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this goal?')) {
      deleteMutation.mutate(id, {
        onSuccess: () => toast.success('Goal deleted'),
        onError: (err) => toast.error(err.message)
      })
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <BackButton />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Goals</h1>
          <p className="text-neutral-400 mt-1">Set and track company, department, and personal goals</p>
        </div>
        <button
          onClick={() => router.push(`/${workspace}/goals/create`)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white h-9 px-4 text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          <Plus size={16} />
          Create Goal
        </button>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
            <Target className="text-indigo-400" size={20} />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{activeGoals}</div>
            <div className="text-xs text-neutral-500 font-medium uppercase tracking-wider">Active Goals</div>
          </div>
        </div>
        <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle2 className="text-emerald-400" size={20} />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{completedGoals}</div>
            <div className="text-xs text-neutral-500 font-medium uppercase tracking-wider">Completed</div>
          </div>
        </div>
        <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center">
            <Clock className="text-rose-400" size={20} />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{overdueGoals}</div>
            <div className="text-xs text-neutral-500 font-medium uppercase tracking-wider">Overdue</div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col xl:flex-row gap-4 xl:items-center justify-between bg-[#111111] border border-[#2a2a2a] p-2 rounded-xl">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 xl:pb-0">
          {tabs.map(tab => (
            <div
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "text-sm px-3 py-1.5 rounded-lg cursor-pointer transition-colors whitespace-nowrap",
                activeTab === tab.id 
                  ? "bg-[#1a1a1a] text-white font-medium" 
                  : "text-neutral-500 hover:text-neutral-300 hover:bg-[#1a1a1a]/50"
              )}
            >
              {tab.label}
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-[140px] bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg h-9 px-3 text-sm text-white focus:border-indigo-500 outline-none appearance-none"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="paused">Paused</option>
            <option value="draft">Draft</option>
          </select>

          <select
            value={scopeFilter}
            onChange={(e) => setScopeFilter(e.target.value)}
            className="w-full sm:w-[140px] bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg h-9 px-3 text-sm text-white focus:border-indigo-500 outline-none appearance-none"
          >
            <option value="all">All Scopes</option>
            <option value="company">Company</option>
            <option value="department">Department</option>
            <option value="personal">Personal</option>
          </select>

          <div className="relative w-full sm:w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={14} />
            <input
              type="text"
              placeholder="Search goals..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg h-9 pl-9 pr-3 text-sm text-white focus:border-indigo-500 outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="border-b border-[#2a2a2a] bg-[#1a1a1a]">
              <th className="text-xs font-medium text-neutral-500 uppercase tracking-wide py-3 px-4 w-[30%]">Title</th>
              <th className="text-xs font-medium text-neutral-500 uppercase tracking-wide py-3 px-4">Type & Scope</th>
              <th className="text-xs font-medium text-neutral-500 uppercase tracking-wide py-3 px-4">Assigned To</th>
              <th className="text-xs font-medium text-neutral-500 uppercase tracking-wide py-3 px-4">Progress</th>
              <th className="text-xs font-medium text-neutral-500 uppercase tracking-wide py-3 px-4">End Date</th>
              <th className="text-xs font-medium text-neutral-500 uppercase tracking-wide py-3 px-4">Status</th>
              <th className="text-xs font-medium text-neutral-500 uppercase tracking-wide py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-[#1a1a1a] last:border-0">
                  <td className="py-4 px-4"><div className="h-5 w-48 bg-[#1a1a1a] rounded animate-pulse" /></td>
                  <td className="py-4 px-4"><div className="h-5 w-24 bg-[#1a1a1a] rounded animate-pulse" /></td>
                  <td className="py-4 px-4"><div className="h-8 w-8 rounded-full bg-[#1a1a1a] animate-pulse" /></td>
                  <td className="py-4 px-4"><div className="h-5 w-32 bg-[#1a1a1a] rounded animate-pulse" /></td>
                  <td className="py-4 px-4"><div className="h-5 w-20 bg-[#1a1a1a] rounded animate-pulse" /></td>
                  <td className="py-4 px-4"><div className="h-5 w-16 bg-[#1a1a1a] rounded animate-pulse" /></td>
                  <td className="py-4 px-4 flex justify-end"><div className="h-8 w-8 bg-[#1a1a1a] rounded animate-pulse" /></td>
                </tr>
              ))
            ) : filteredGoals.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12">
                  <EmptyState 
                    icon={Target}
                    title="No goals found"
                    description="Try adjusting your filters or create a new goal."
                  />
                </td>
              </tr>
            ) : (
              filteredGoals.map(goal => {
                const isGoalOverdue = goal.status === 'active' && isPast(new Date(goal.end_date))
                const prog = goal.progress_percentage || 0
                const progColor = prog < 30 ? 'bg-rose-500' : prog < 70 ? 'bg-amber-500' : prog < 100 ? 'bg-indigo-500' : 'bg-emerald-500'
                
                return (
                  <tr key={goal.id} className="hover:bg-[#1a1a1a] transition-colors border-b border-[#1a1a1a] last:border-0">
                    <td className="py-3 px-4">
                      <div 
                        className="text-sm text-white font-medium hover:text-indigo-400 cursor-pointer transition-colors"
                        onClick={() => router.push(`/goals/${goal.id}`)}
                      >
                        {goal.title}
                      </div>
                      {goal.description && (
                        <div className="text-xs text-neutral-500 line-clamp-1 mt-0.5">{goal.description}</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1.5 items-start">
                        <TypeBadge type={goal.type as any} />
                        <ScopeBadge 
                          scope={goal.scope} 
                          entityName={goal.scope === 'department' ? goal.assigned_dept?.name : goal.scope === 'personal' ? goal.assigned_user?.full_name : undefined}
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {goal.assigned_user ? (
                        <div className="flex items-center gap-2">
                          <UserAvatar user={goal.assigned_user as any} className="w-6 h-6" />
                          <span className="text-sm text-neutral-300">{goal.assigned_user.full_name}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-neutral-500">â€”</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {goal.target_value ? (
                        <div className="w-full max-w-[120px]">
                          <div className="h-1 w-full bg-[#2a2a2a] rounded-full overflow-hidden mb-1.5">
                            <div className={cn("h-full rounded-full", progColor)} style={{ width: `${prog}%` }} />
                          </div>
                          <div className="text-xs text-neutral-500">
                            {goal.current_value} / {goal.target_value}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className={cn("w-2 h-2 rounded-full", goal.status === 'completed' ? 'bg-emerald-500' : goal.status === 'active' ? 'bg-sky-500' : 'bg-neutral-500')} />
                          <span className="text-xs text-neutral-500">Milestone</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-neutral-300">{format(new Date(goal.end_date), 'MMM d, yyyy')}</div>
                      {goal.status !== 'completed' && goal.status !== 'cancelled' && (
                        <div className={cn("text-xs mt-0.5", isGoalOverdue ? "text-rose-400" : "text-neutral-500")}>
                          {isGoalOverdue ? `${Math.abs(goal.days_remaining || 0)} days ago` : `${goal.days_remaining} days left`}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={goal.status} type="goal" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="text-neutral-500 hover:text-white p-1 rounded transition-colors outline-none">
                          <MoreVertical size={18} />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => router.push(`/goals/${goal.id}`)}>Edit Goal</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {goal.status !== 'active' && <DropdownMenuItem onClick={() => handleStatusChange(goal.id, 'active')}>Mark Active</DropdownMenuItem>}
                          {goal.status !== 'completed' && <DropdownMenuItem onClick={() => handleStatusChange(goal.id, 'completed')}>Mark Completed</DropdownMenuItem>}
                          {(goal.status as string) !== 'paused' && <DropdownMenuItem onClick={() => handleStatusChange(goal.id, 'paused')}>Pause Goal</DropdownMenuItem>}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDelete(goal.id)} className="text-rose-400 focus:text-rose-400 focus:bg-rose-500/10">
                            Delete Goal
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
