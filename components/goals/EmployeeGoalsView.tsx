'use client'

import React, { useState, useMemo } from 'react'
import { Goal } from '@/types'
import { useGoals } from '@/lib/queries/goals'
import { GoalCard } from '@/components/goals/GoalCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { Target, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PrivateGoalsSection } from '@/components/goals/PrivateGoalsSection'
import Link from 'next/link'

export default function EmployeeGoalsView({ userRole }: { userRole?: string }) {
  const [activeType, setActiveType] = useState('all')
  const [activeStatus, setActiveStatus] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const { data: goalsResponse, isLoading } = useGoals()
  const goals: Goal[] = goalsResponse?.data || []

  const filteredGoals = useMemo(() => {
    let result = goals

    if (activeType !== 'all') result = result.filter(g => g.type === activeType)
    if (activeStatus !== 'all') result = result.filter(g => g.status === activeStatus)
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(g => g.title.toLowerCase().includes(q) || g.description?.toLowerCase().includes(q))
    }

    return result
  }, [goals, activeType, activeStatus, searchQuery])

  const typeTabs = [
    { id: 'all', label: 'ALL' },
    { id: 'weekly', label: 'WEEKLY' },
    { id: 'monthly', label: 'MONTHLY' },
    { id: 'yearly', label: 'YEARLY' },
    { id: 'long_term', label: 'LONG-TERM' },
  ]

  const statusTabs = [
    { id: 'all', label: 'All' },
    { id: 'active', label: 'Active' },
    { id: 'completed', label: 'Completed' },
    { id: 'paused', label: 'Paused' },
    { id: 'draft', label: 'Draft' },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 min-h-screen pb-32">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Goals</h1>
          <p className="text-neutral-400 mt-1">Track company, department, and personal objectives.</p>
        </div>
        {(userRole === 'admin' || userRole === 'manager') && (
          <Link 
            href={`/${userRole}/goals`}
            className="inline-flex items-center justify-center h-10 px-4 bg-[#2a2a2a] hover:bg-[#3a3a3a] border border-[#3a3a3a] hover:border-[#4a4a4a] text-white rounded-lg text-sm font-medium transition-colors"
          >
            Manage Goals
          </Link>
        )}
      </div>

      <div className="space-y-4">
        {/* Top Type Filter (Pill Tabs) */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 w-full md:w-auto">
            {typeTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveType(tab.id)}
                className={cn(
                  "text-xs px-4 py-2 rounded-full cursor-pointer transition-colors whitespace-nowrap font-semibold tracking-wider",
                  activeType === tab.id 
                    ? "bg-indigo-600 text-white" 
                    : "bg-[#111111] text-neutral-400 hover:text-white border border-[#2a2a2a] hover:border-[#3a3a3a]"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={14} />
            <input
              type="text"
              placeholder="Search goals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#111111] border border-[#2a2a2a] rounded-full h-10 pl-9 pr-4 text-sm text-white focus:border-indigo-500 outline-none transition-colors"
            />
          </div>
        </div>

        {/* Status Filter Row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-neutral-500 mr-2">Status:</span>
          {statusTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveStatus(tab.id)}
              className={cn(
                "text-xs px-3 py-1 rounded-md transition-colors",
                activeStatus === tab.id
                  ? "bg-[#2a2a2a] text-white"
                  : "text-neutral-500 hover:text-neutral-300 hover:bg-[#1a1a1a]"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 bg-[#111111] border border-[#2a2a2a] rounded-xl animate-pulse p-5" />
          ))}
        </div>
      ) : filteredGoals.length === 0 ? (
        <div className="py-20 border border-dashed border-[#2a2a2a] rounded-xl">
          <EmptyState 
            icon={Target}
            title="No goals found"
            description="Adjust your filters or create a new goal from the Admin panel."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGoals.map(goal => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      )}

      <PrivateGoalsSection />
    </div>
  )
}
