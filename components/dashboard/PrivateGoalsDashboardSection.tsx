'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Goal } from '@/types'
import { Lock, Plus } from 'lucide-react'
import { TypeBadge } from '@/components/shared/TypeBadge'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { DaysRemainingBadge } from '@/components/shared/DaysRemainingBadge'
import { AddPrivateGoalModal } from '@/components/goals/AddPrivateGoalModal'
import { GoalUpdateModal } from '@/components/goals/GoalUpdateModal'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { toast } from 'sonner'

export function PrivateGoalsDashboardSection({ userId }: { userId: string }) {
  const queryClient = useQueryClient()
  const [addOpen, setAddOpen] = useState(false)
  const [updateGoal, setUpdateGoal] = useState<Goal | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: goals = [] } = useQuery({
    queryKey: ['dashboard', 'private_goals'],
    queryFn: async () => {
      const res = await fetch('/api/goals/private')
      if (!res.ok) throw new Error('Failed to fetch private goals')
      const json = await res.json()
      return json.data as Goal[]
    },
    staleTime: 30 * 1000,
  })

  const markCompleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/goals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' })
      })
      if (!res.ok) throw new Error('Failed to complete goal')
      return res.json()
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['dashboard', 'private_goals'] })
      const prev = queryClient.getQueryData(['dashboard', 'private_goals'])
      queryClient.setQueryData(['dashboard', 'private_goals'], (old: any) => 
        old?.map((g: any) => g.id === id ? { ...g, status: 'completed' } : g)
      )
      return { prev }
    },
    onError: (err, id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['dashboard', 'private_goals'], ctx.prev)
      toast.error(err.message)
    },
    onSuccess: () => {
      toast.success('Goal completed! 🎉')
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/goals/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete goal')
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['dashboard', 'private_goals'] })
      const prev = queryClient.getQueryData(['dashboard', 'private_goals'])
      queryClient.setQueryData(['dashboard', 'private_goals'], (old: any) => 
        old?.filter((g: any) => g.id !== id)
      )
      setDeleteId(null)
      return { prev }
    },
    onError: (err, id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['dashboard', 'private_goals'], ctx.prev)
      toast.error(err.message)
    },
    onSuccess: () => {
      toast.success('Goal deleted')
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    }
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lock size={14} className="text-neutral-500" />
          <h2 className="text-sm font-semibold text-white">Private Goals</h2>
          <span className="text-[10px] text-neutral-600 bg-[#1a1a1a] border border-[#2a2a2a] px-2 py-0.5 rounded-full hidden sm:inline">Only you can see these</span>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          <Plus size={12} />
          Add goal
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="border border-dashed border-[#2a2a2a] rounded-xl p-8 text-center hover:border-indigo-500/30 transition-colors cursor-pointer" onClick={() => setAddOpen(true)}>
          <Lock size={24} className="mx-auto text-neutral-700 mb-2" />
          <p className="text-sm text-neutral-500">No private goals yet</p>
          <p className="text-xs text-neutral-700 mt-1">Set personal goals only you can see</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {goals.map(goal => (
            <PrivateGoalCard 
              key={goal.id} 
              goal={goal} 
              onUpdate={() => setUpdateGoal(goal)} 
              onDelete={() => setDeleteId(goal.id)} 
              onMarkComplete={() => markCompleteMutation.mutate(goal.id)}
            />
          ))}
          <button
            onClick={() => setAddOpen(true)}
            className="border border-dashed border-[#2a2a2a] rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:border-indigo-500/30 hover:bg-indigo-500/3 transition-all group min-h-[120px]"
          >
            <Plus size={18} className="text-neutral-700 group-hover:text-indigo-400 transition-colors" />
            <span className="text-xs text-neutral-600 group-hover:text-indigo-400 transition-colors">New private goal</span>
          </button>
        </div>
      )}

      {addOpen && (
        <AddPrivateGoalModal 
          onClose={() => setAddOpen(false)} 
        />
      )}

      {updateGoal && (
        <GoalUpdateModal 
          goal={updateGoal} 
          isOpen={!!updateGoal} 
          onClose={() => setUpdateGoal(null)} 
        />
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Delete Private Goal"
        description="Are you sure you want to delete this goal? It cannot be undone."
        confirmLabel="Delete Goal"
        confirmVariant="destructive"
      />
    </div>
  )
}

function PrivateGoalCard({ goal, onUpdate, onDelete, onMarkComplete }: { goal: Goal, onUpdate: () => void, onDelete: () => void, onMarkComplete: () => void }) {
  return (
    <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-4 hover:border-[#3a3a3a] transition-all group relative">
      <Lock size={10} className="absolute top-3 right-3 text-neutral-700" />

      <TypeBadge type={goal.type} className="mb-2" />
      
      <h4 className="text-sm font-semibold text-white leading-snug mb-3 pr-4 line-clamp-2">
        {goal.title}
      </h4>

      {goal.target_value ? (
        <div className="mb-3">
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-neutral-600">{goal.current_value}/{goal.target_value} {goal.unit}</span>
            <span className="text-white font-medium">{goal.progress_percentage || 0}%</span>
          </div>
          <div className="h-1.5 bg-[#2a2a2a] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${goal.progress_percentage || 0}%`, backgroundColor: '#6366f1' }}
            />
          </div>
        </div>
      ) : (
        <StatusBadge status={goal.status} type="goal" className="mb-3" />
      )}

      <div className="flex items-center justify-between">
        <DaysRemainingBadge daysRemaining={goal.days_remaining || 0} small isOverdue={goal.is_overdue} />
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onUpdate} className="text-[10px] text-neutral-500 hover:text-white px-2 py-1 rounded hover:bg-[#1a1a1a]">
            Update
          </button>
          {goal.status === 'active' && (
            <button onClick={onMarkComplete} className="text-[10px] text-green-500 hover:text-green-400 px-2 py-1 rounded hover:bg-green-500/10">
              Done ✓
            </button>
          )}
          <button onClick={onDelete} className="text-[10px] text-red-500 hover:text-red-400 px-2 py-1 rounded hover:bg-red-500/10">
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
