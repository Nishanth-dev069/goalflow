'use client'

import React, { useState } from 'react'
import { Goal } from '@/types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { X, Loader2, Target } from 'lucide-react'

export function GoalUpdateModal({ 
  goal, 
  isOpen, 
  onClose 
}: { 
  goal: Goal
  isOpen: boolean
  onClose: () => void 
}) {
  const [newValue, setNewValue] = useState<number>(goal.current_value)
  const [note, setNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const queryClient = useQueryClient()

  if (!isOpen) return null

  const mutation = useMutation({
    mutationFn: async (data: { new_value: number, note: string }) => {
      const res = await fetch(`/api/goals/${goal.id}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to update progress')
      }
      return res.json()
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['goals', goal.id] })
      await queryClient.cancelQueries({ queryKey: ['dashboard'] })
      
      const prevGoal = queryClient.getQueryData(['goals', goal.id])
      const prevDashboard = queryClient.getQueryData(['dashboard'])
      
      queryClient.setQueryData(['goals', goal.id], (old: any) => {
        if (!old || !old.data) return old
        const progress_percentage = old.data.target_value 
          ? Math.min(100, Math.max(0, Math.round((variables.new_value / old.data.target_value) * 100))) 
          : 0
        return {
          ...old,
          data: { ...old.data, current_value: variables.new_value, progress_percentage }
        }
      })
      
      return { prevGoal, prevDashboard }
    },
    onError: (err, variables, context) => {
      if (context?.prevGoal) queryClient.setQueryData(['goals', goal.id], context.prevGoal)
      if (context?.prevDashboard) queryClient.setQueryData(['dashboard'], context.prevDashboard)
      toast.error(err.message)
    },
    onSuccess: (data, variables) => {
      toast.success('Progress saved', { description: `Now at ${variables.new_value} ${goal.unit || ''}` })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['goals', goal.id] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newValue === goal.current_value) return
    mutation.mutate({ new_value: newValue, note })
    onClose()
  }

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in"
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#111111] border-l border-[#2a2a2a] z-50 flex flex-col animate-in slide-in-from-right shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-[#2a2a2a]">
          <h2 className="text-lg font-semibold text-white">Log Progress Update</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-white p-1 rounded-md transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            
            <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl p-6 text-center">
              <div className="text-xs text-neutral-500 uppercase tracking-widest mb-2">Current Target</div>
              <div className="flex items-end justify-center gap-3">
                <div className="text-4xl font-bold text-neutral-400">{goal.current_value}</div>
                <div className="text-sm text-neutral-600 mb-1.5">/ {goal.target_value}</div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">New Progress Value</label>
              <div className="relative">
                <Target className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={20} />
                <input
                  type="number"
                  required
                  value={newValue}
                  onChange={e => setNewValue(Number(e.target.value))}
                  className="w-full bg-[#1a1a1a] border border-[#3a3a3a] rounded-xl h-14 pl-12 pr-4 text-2xl font-bold text-white focus:border-indigo-500 outline-none transition-colors"
                />
              </div>
              {newValue !== goal.current_value && (
                <div className="mt-2 text-sm text-indigo-400 flex items-center gap-2">
                  <span>→ Updates to {newValue}</span>
                  <span className="text-neutral-500">
                    ({newValue > goal.current_value ? '+' : ''}{newValue - goal.current_value})
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Update Note (Optional)</label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="What did you accomplish?"
                rows={4}
                className="w-full bg-[#1a1a1a] border border-[#3a3a3a] rounded-xl p-4 text-sm text-white focus:border-indigo-500 outline-none transition-colors resize-none"
              />
            </div>
          </div>

          <div className="mt-auto p-6 border-t border-[#2a2a2a] bg-[#0a0a0a]">
            <button
              type="submit"
              disabled={mutation.isPending || newValue === goal.current_value}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white h-12 text-sm font-medium rounded-xl transition-colors flex items-center justify-center"
            >
              {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : 'Save Update'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
