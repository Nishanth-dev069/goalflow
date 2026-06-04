'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { TallyExportButton } from '@/components/admin/TallyExportButton'

const FILTERS = [
  { id: 'this_week', label: 'This Week' },
  { id: 'next_week', label: 'Next Week' },
  { id: 'this_month', label: 'This Month' },
]

function WorkloadBadge({ load }: { load: number }) {
  if (load >= 10) {
    return (
      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/30 animate-pulse">
        Overloaded
      </span>
    )
  }
  if (load >= 7) {
    return (
      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-orange-500/10 text-orange-400">
        Heavy
      </span>
    )
  }
  if (load >= 3) {
    return (
      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-amber-500/10 text-amber-400">
        Moderate
      </span>
    )
  }
  return (
    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-green-500/10 text-green-400">
      Light
    </span>
  )
}

function StatChip({ label, value, color }: { label: string, value: number | string, color: string }) {
  const colorStyles: Record<string, string> = {
    blue: 'bg-blue-500/5 border-blue-500/10 text-blue-400',
    red: 'bg-red-500/5 border-red-500/10 text-red-400',
    green: 'bg-green-500/5 border-green-500/10 text-green-400',
    indigo: 'bg-indigo-500/5 border-indigo-500/10 text-indigo-400',
  }
  
  return (
    <div className={cn("flex flex-col items-center justify-center py-2 px-1 rounded-lg border", colorStyles[color] || colorStyles.blue)}>
      <span className="text-lg font-bold">{value}</span>
      <span className="text-[9px] uppercase font-medium mt-0.5 text-center px-1 leading-tight text-neutral-500">
        {label}
      </span>
    </div>
  )
}

export default function WorkloadPage() {
  const [filter, setFilter] = useState('this_week')

  const { data: workloadData, isLoading } = useQuery({
    queryKey: ['analytics', 'workload', filter],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/workload?filter=${filter}`)
      if (!res.ok) throw new Error('Failed to fetch workload data')
      const json = await res.json()
      return json.data
    }
  })

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 min-h-screen pb-32">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Workload</h1>
          <p className="text-neutral-400 mt-1">See who has capacity and who needs help</p>
        </div>

        <div className="flex items-center gap-3">
          <TallyExportButton />
          <div className="flex items-center gap-1 bg-[#111111] p-1 border border-[#2a2a2a] rounded-lg">
            {FILTERS.map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  "text-xs font-semibold px-4 py-2 rounded-md transition-all",
                  filter === f.id ? "bg-[#1a1a1a] border border-[#3a3a3a] text-white shadow-sm" : "text-neutral-500 hover:text-white hover:bg-[#1a1a1a]"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-5 flex flex-col h-[280px]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#1a1a1a] animate-pulse" />
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-[#1a1a1a] rounded animate-pulse" />
                  <div className="h-3 w-16 bg-[#1a1a1a] rounded animate-pulse" />
                </div>
                <div className="ml-auto h-6 w-16 bg-[#1a1a1a] rounded animate-pulse" />
              </div>
              <div className="space-y-2 mb-5 mt-2">
                <div className="flex justify-between">
                  <div className="h-3 w-20 bg-[#1a1a1a] rounded animate-pulse" />
                  <div className="h-3 w-12 bg-[#1a1a1a] rounded animate-pulse" />
                </div>
                <div className="h-2 w-full bg-[#1a1a1a] rounded-full animate-pulse" />
              </div>
              <div className="grid grid-cols-3 gap-2 mt-auto">
                <div className="h-16 bg-[#1a1a1a] rounded-lg animate-pulse" />
                <div className="h-16 bg-[#1a1a1a] rounded-lg animate-pulse" />
                <div className="h-16 bg-[#1a1a1a] rounded-lg animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {(workloadData || []).map((member: any) => {
            const totalTasks = member.totalTasks || 0
            
            return (
              <div key={member.id} className="bg-[#111111] border border-[#2a2a2a] hover:border-[#3a3a3a] transition-colors rounded-xl p-5 flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <UserAvatar user={member} className="w-10 h-10" />
                  <div>
                    <p className="text-sm font-semibold text-white">{member.full_name}</p>
                    <p className="text-xs text-neutral-500">{member.department?.name || 'No Department'}</p>
                  </div>
                  <div className="ml-auto">
                    <WorkloadBadge load={totalTasks} />
                  </div>
                </div>

                {/* Workload bar */}
                <div className="space-y-2 mb-5">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-neutral-500">Active Task Load</span>
                    <span className="text-white font-medium">{totalTasks} tasks</span>
                  </div>
                  <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden border border-[#2a2a2a]">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min((totalTasks / 10) * 100, 100)}%`,
                        backgroundColor: totalTasks > 8 ? '#ef4444' : totalTasks > 5 ? '#f59e0b' : '#22c55e'
                      }}
                    />
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2 mt-auto">
                  <StatChip label="Due Target" value={member.dueThisPeriod} color="blue" />
                  <StatChip label="Overdue" value={member.overdue} color={member.overdue > 0 ? "red" : "green"} />
                  <StatChip label="In Progress" value={member.inProgress} color="indigo" />
                </div>

                {/* Overdue task list — expandable */}
                {member.overdue > 0 && (
                  <div className="mt-4 pt-3 border-t border-[#1a1a1a]">
                    <p className="text-[10px] text-red-400 font-semibold uppercase mb-2 tracking-widest">Overdue Tasks</p>
                    <div className="space-y-1">
                      {member.overdue_tasks.slice(0, 3).map((task: any) => (
                        <Link key={task.id} href={`/tasks/${task.id}`} className="flex items-center gap-2 py-1.5 px-2 -mx-2 rounded hover:bg-[#1a1a1a] hover:text-indigo-400 transition-colors group">
                          <div className="w-1 h-1 rounded-full bg-red-500 shrink-0" />
                          <span className="text-xs text-neutral-400 group-hover:text-white truncate">{task.title}</span>
                          <span className="text-[10px] font-medium text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded ml-auto shrink-0">
                            {task.days_overdue}d
                          </span>
                        </Link>
                      ))}
                      {member.overdue > 3 && (
                        <p className="text-[10px] text-neutral-500 text-center mt-2 pt-1 border-t border-dashed border-[#2a2a2a]">
                          + {member.overdue - 3} more overdue
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
