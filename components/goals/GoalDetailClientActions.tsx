'use client'

import React, { useState } from 'react'
import { Goal } from '@/types'
import { GoalUpdateModal } from '@/components/goals/GoalUpdateModal'

export default function GoalDetailClientActions({ goal }: { goal: Goal }) {
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)

  return (
    <>
      <div className="flex gap-3">
        <button 
        onClick={() => setIsUpdateModalOpen(true)}
        className="bg-indigo-600 hover:bg-indigo-500 text-white h-10 px-6 text-sm font-medium rounded-full transition-colors shadow-lg shadow-indigo-500/20"
      >
        Log Progress Update
      </button>
      
      <button 
        onClick={async () => {
          try {
            await fetch(`/api/goals/${goal.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'completed' }),
            });
            window.location.reload();
          } catch (e) {
            console.error('Failed to complete goal', e);
          }
        }}
        className="bg-emerald-600 hover:bg-emerald-500 text-white h-10 px-6 text-sm font-medium rounded-full transition-colors shadow-lg shadow-emerald-500/20"
      >
        Mark Completed
      </button>
    </div>
      
      <GoalUpdateModal 
        goal={goal} 
        isOpen={isUpdateModalOpen} 
        onClose={() => setIsUpdateModalOpen(false)} 
      />
    </>
  )
}
