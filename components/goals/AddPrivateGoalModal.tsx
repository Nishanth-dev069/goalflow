'use client'

import React, { useState } from 'react'
import { X, Lock, Loader2 } from 'lucide-react'
import { useCreatePrivateGoal } from '@/lib/queries/goals'
import { toast } from 'sonner'

export function AddPrivateGoalModal({ onClose }: { onClose: () => void }) {
  const { mutateAsync: createGoal, isPending } = useCreatePrivateGoal()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'monthly',
    target_value: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createGoal({
        ...formData,
        target_value: formData.target_value ? parseFloat(formData.target_value) : null,
      })
      toast.success('Private goal created successfully')
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Failed to create goal')
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-[#2a2a2a] bg-[#161616]">
          <div className="flex items-center gap-2">
            <Lock size={16} className="text-indigo-400" />
            <h3 className="font-semibold text-white">New Private Goal</h3>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">Title</label>
            <input
              required
              type="text"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg px-3 py-2 text-white focus:border-indigo-500 outline-none"
              placeholder="E.g., Read 5 books this month"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">Description (Optional)</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg px-3 py-2 text-white focus:border-indigo-500 outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">Goal Type</label>
              <select
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value })}
                className="w-full bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg px-3 py-2 text-white focus:border-indigo-500 outline-none"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="long_term">Long Term</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">Target Value (Optional)</label>
              <input
                type="number"
                value={formData.target_value}
                onChange={e => setFormData({ ...formData, target_value: e.target.value })}
                className="w-full bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg px-3 py-2 text-white focus:border-indigo-500 outline-none"
                placeholder="E.g., 5"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">Start Date</label>
              <input
                required
                type="date"
                value={formData.start_date}
                onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg px-3 py-2 text-white focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">End Date</label>
              <input
                required
                type="date"
                value={formData.end_date}
                onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg px-3 py-2 text-white focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-neutral-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
            >
              {isPending && <Loader2 size={16} className="animate-spin" />}
              Create Private Goal
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
