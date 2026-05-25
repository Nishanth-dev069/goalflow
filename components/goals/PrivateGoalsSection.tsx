'use client'

import React, { useState } from 'react'
import { Plus, Lock } from 'lucide-react'
import { usePrivateGoals } from '@/lib/queries/goals'
import { GoalCard } from './GoalCard'
import { AddPrivateGoalModal } from './AddPrivateGoalModal'

export function PrivateGoalsSection() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { data: response, isLoading } = usePrivateGoals()
  const goals = response?.data || []

  return (
    <div className="space-y-4 my-8">
      <div className="flex items-center justify-between border-b border-[#2a2a2a] pb-4">
        <div className="flex items-center gap-2 text-indigo-400">
          <Lock size={18} />
          <h2 className="text-xl font-semibold tracking-tight text-white">Private Personal Goals</h2>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-[#1a1a1a] hover:bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg text-white transition-colors"
        >
          <Plus size={16} />
          Add Private Goal
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="h-64 bg-[#111111] border border-[#2a2a2a] rounded-xl animate-pulse p-5" />
        </div>
      ) : goals.length === 0 ? (
        <div className="py-12 px-6 bg-[#111111] border border-[#2a2a2a] rounded-xl flex flex-col items-center justify-center text-center">
          <Lock className="text-neutral-600 mb-3" size={32} />
          <h3 className="text-neutral-300 font-medium">No Private Goals</h3>
          <p className="text-sm text-neutral-500 mt-1 max-w-sm">
            Create goals that are only visible to you. Nobody else in the system can see them.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((goal: any) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      )}

      {isModalOpen && (
        <AddPrivateGoalModal onClose={() => setIsModalOpen(false)} />
      )}
    </div>
  )
}
