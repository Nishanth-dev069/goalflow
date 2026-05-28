'use client'

import React, { useState } from 'react'
import { Goal } from '@/types'
import { GoalUpdateModal } from '@/components/goals/GoalUpdateModal'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { CheckCircle, Loader2 } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function GoalDetailClientActions({ goal }: { goal: Goal }) {
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)
  const [confirmCompleteOpen, setConfirmCompleteOpen] = useState(false)
  
  const queryClient = useQueryClient()
  const router = useRouter()

  const markCompleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/goals/${goal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' })
      })
      if (!res.ok) throw new Error('Failed to complete goal')
      return res.json()
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['goals', goal.id] })
      const prev = queryClient.getQueryData(['goals', goal.id])
      queryClient.setQueryData(['goals', goal.id], (old: any) => ({
        ...old,
        data: { ...old.data, status: 'completed' }
      }))
      setConfirmCompleteOpen(false)
      return { prev }
    },
    onError: (err, variables, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['goals', goal.id], ctx.prev)
      toast.error(err.message)
    },
    onSuccess: () => {
      toast.success('Goal completed! 🎉', { description: 'Admin has been notified', duration: 5000 })
      router.refresh()
    }
  })

  return (
    <div className="w-full flex flex-col items-center">
      <button 
        onClick={() => setIsUpdateModalOpen(true)}
        className="bg-indigo-600 hover:bg-indigo-500 text-white h-10 px-6 text-sm font-medium rounded-full transition-colors shadow-lg shadow-indigo-500/20"
      >
        Log Progress Update
      </button>

      <div className="w-full bg-green-500/5 border border-green-500/20 rounded-xl p-5 mt-6 text-left">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-white mb-1">Ready to complete this goal?</p>
            <p className="text-xs text-neutral-500">
              This will mark the goal as completed and notify your admin.
            </p>
          </div>
          <button
            onClick={() => setConfirmCompleteOpen(true)}
            disabled={markCompleteMutation.isPending}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white h-9 px-4 text-sm font-medium rounded-lg transition-colors flex-shrink-0 disabled:opacity-50"
          >
            {markCompleteMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
            Mark Complete
          </button>
        </div>
      </div>
      
      <GoalUpdateModal 
        goal={goal} 
        isOpen={isUpdateModalOpen} 
        onClose={() => setIsUpdateModalOpen(false)} 
      />

      <ConfirmDialog
        open={confirmCompleteOpen}
        onOpenChange={setConfirmCompleteOpen}
        onConfirm={() => markCompleteMutation.mutate()}
        title="Complete this goal?"
        description={`This will mark '${goal.title}' as completed. Your admin will be notified.`}
        confirmLabel="Yes, complete it"
        confirmVariant="default"
      />
    </div>
  )
}
