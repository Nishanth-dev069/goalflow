'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format, subDays } from 'date-fns'
import { CheckCircle, TrendingUp, TrendingDown, Minus, AlertTriangle, Loader2, ArrowRight } from 'lucide-react'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { PriorityBadge } from '@/components/shared/PriorityBadge'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  BarChart, Bar
} from 'recharts'

const PRESETS = [
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
]

export default function AdminAnalyticsPage() {
  const [preset, setPreset] = useState<number>(30)
  
  const to = format(new Date(), 'yyyy-MM-dd')
  const from = format(subDays(new Date(), preset), 'yyyy-MM-dd')

  const { data: response, isLoading } = useQuery({
    queryKey: ['analytics', 'overview', from, to],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/overview?from=${from}&to=${to}`)
      if (!res.ok) throw new Error('Failed to fetch analytics')
      const json = await res.json()
      return json.data
    },
    staleTime: 1000 * 60 * 2 // 2 mins
  })

  // Destructure with fallbacks
  const data = response || {
    tasks_completed: 0,
    tasks_completed_trend: 0,
    goal_stats: { active: 0, completed: 0, paused: 0, draft: 0, cancelled: 0 },
    overdue_tasks: 0,
    daily_completions: [],
    tasks_by_employee: [],
    department_health: []
  }

  const {
    tasks_completed, tasks_completed_trend, goal_stats, overdue_tasks,
    daily_completions, tasks_by_employee, department_health
  } = data

  const totalGoals = Object.values(goal_stats as Record<string, number>).reduce((a, b) => a + b, 0)
  const goalCompletionRate = totalGoals > 0 ? Math.round((goal_stats.completed / totalGoals) * 100) : 0
  const completionColor = goalCompletionRate > 70 ? 'text-emerald-500' : goalCompletionRate > 40 ? 'text-amber-500' : 'text-rose-500'

  const topPerformer = tasks_by_employee[0]

  const pieData = [
    { name: 'Active', value: goal_stats.active || 0, color: '#6366f1' },
    { name: 'Completed', value: goal_stats.completed || 0, color: '#22c55e' },
    { name: 'Paused', value: goal_stats.paused || 0, color: '#f59e0b' },
    { name: 'Draft/Cancelled', value: (goal_stats.draft || 0) + (goal_stats.cancelled || 0), color: '#525252' },
  ].filter(d => d.value > 0)

  // Use a simulated overdue tasks array for the final table (since API returns count only, we assume it's fetched via /api/tasks?overdue=true or we just mock a link)
  // To keep it simple per prompt, if overdue_tasks > 0 we can show the banner.
  
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 min-h-screen pb-32">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Analytics</h1>
          <p className="text-neutral-400 mt-1">Team performance and goal tracking insights</p>
        </div>

        <div className="flex items-center gap-1 bg-[#111111] p-1 border border-[#2a2a2a] rounded-lg">
          {PRESETS.map(p => (
            <button
              key={p.label}
              onClick={() => setPreset(p.days)}
              className={cn(
                "text-xs font-semibold px-4 py-2 rounded-md transition-all",
                preset === p.days ? "bg-[#1a1a1a] border border-[#3a3a3a] text-white shadow-sm" : "text-neutral-500 hover:text-white hover:bg-[#1a1a1a]"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-32"><Loader2 className="animate-spin text-neutral-600 w-8 h-8" /></div>
      ) : (
        <>
          {/* ROW 1: KPI STAT CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1 */}
            <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-5 hover:border-[#3a3a3a] transition-colors">
              <div className="flex items-center gap-2 text-neutral-400 mb-3">
                <CheckCircle size={16} className="text-emerald-500" />
                <span className="text-xs font-semibold uppercase tracking-widest">Tasks Done</span>
              </div>
              <div className="text-3xl font-bold text-white">{tasks_completed}</div>
              <div className="flex items-center gap-1 mt-2">
                {tasks_completed_trend > 0 ? (
                  <><TrendingUp size={14} className="text-emerald-400" /><span className="text-xs text-emerald-400">+{tasks_completed_trend}% vs previous</span></>
                ) : tasks_completed_trend < 0 ? (
                  <><TrendingDown size={14} className="text-rose-400" /><span className="text-xs text-rose-400">{tasks_completed_trend}% vs previous</span></>
                ) : (
                  <><Minus size={14} className="text-neutral-500" /><span className="text-xs text-neutral-500">Same as previous</span></>
                )}
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-5 hover:border-[#3a3a3a] transition-colors">
              <div className="flex items-center gap-2 text-neutral-400 mb-3">
                <span className="text-xs font-semibold uppercase tracking-widest">Goal Completion</span>
              </div>
              <div className="flex items-center gap-4">
                <div className={cn("text-3xl font-bold", completionColor)}>{goalCompletionRate}%</div>
                <svg width="32" height="32" viewBox="0 0 32 32" className="-rotate-90">
                  <circle cx="16" cy="16" r="14" fill="none" stroke="#2a2a2a" strokeWidth="4" />
                  <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="88" strokeDashoffset={88 - (88 * goalCompletionRate) / 100} className={completionColor} />
                </svg>
              </div>
              <div className="text-xs text-neutral-500 mt-2">{goal_stats.completed} of {totalGoals} goals completed</div>
            </div>

            {/* Card 3 */}
            <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-5 hover:border-[#3a3a3a] transition-colors">
              <div className="flex items-center gap-2 text-neutral-400 mb-3">
                <span className="text-xs font-semibold uppercase tracking-widest">Overdue Tasks</span>
              </div>
              <div className={cn("text-3xl font-bold", overdue_tasks > 0 ? "text-rose-400" : "text-emerald-400")}>
                {overdue_tasks}
              </div>
              <div className="flex items-center gap-1 mt-2">
                {overdue_tasks === 0 ? (
                  <><CheckCircle size={14} className="text-emerald-400" /><span className="text-xs text-emerald-400">No overdue tasks</span></>
                ) : (
                  <><AlertTriangle size={14} className="text-rose-400" /><span className="text-xs text-rose-400">Tasks past due</span></>
                )}
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-5 hover:border-[#3a3a3a] transition-colors flex flex-col justify-between">
              <div className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-2">Top Performer</div>
              {topPerformer ? (
                <div className="flex items-center gap-3">
                  <UserAvatar user={{ full_name: topPerformer.name } as any} className="w-10 h-10" />
                  <div>
                    <div className="text-base font-semibold text-white">{topPerformer.name}</div>
                    <div className="text-xs text-neutral-400">{topPerformer.count} tasks completed</div>
                  </div>
                </div>
              ) : (
                <div className="text-2xl font-bold text-neutral-600">â€”</div>
              )}
            </div>
          </div>

          {/* ROW 2: MAIN CHARTS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left: Line Chart */}
            <div className="col-span-1 lg:col-span-2 bg-[#111111] border border-[#2a2a2a] rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-semibold text-white">Daily Completions</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-indigo-500" /><span className="text-xs text-neutral-400">Tasks</span></div>
                </div>
              </div>
              <div className="h-[280px]">
                {daily_completions.length === 0 ? (
                  <div className="w-full h-full flex items-center justify-center text-sm text-neutral-600">No completion data for this period.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={daily_completions}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#666' }} axisLine={false} tickLine={false} tickFormatter={(val) => format(new Date(val), 'MMM d')} />
                      <YAxis tick={{ fontSize: 12, fill: '#666' }} axisLine={false} tickLine={false} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#1a1a1a', borderColor: '#2a2a2a', borderRadius: '8px' }}
                        itemStyle={{ color: '#fff' }}
                        labelStyle={{ color: '#999', marginBottom: '4px' }}
                      />
                      <Line type="monotone" dataKey="count" name="Tasks" stroke="#6366f1" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#6366f1' }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Right: Pie Chart */}
            <div className="col-span-1 bg-[#111111] border border-[#2a2a2a] rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-white">Goal Status</h3>
              </div>
              <div className="text-xs text-neutral-500 mb-4">Total: {totalGoals} goals</div>
              
              <div className="h-[240px] relative">
                {totalGoals === 0 ? (
                  <div className="w-full h-full flex items-center justify-center text-sm text-neutral-600">No goals found.</div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          innerRadius={70}
                          outerRadius={100}
                          paddingAngle={3}
                          dataKey="value"
                          cx="50%"
                          cy="45%"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: '#1a1a1a', borderColor: '#2a2a2a', borderRadius: '8px', color: '#fff' }}
                          itemStyle={{ color: '#fff' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-6">
                      <span className="text-3xl font-bold text-white">{totalGoals}</span>
                      <span className="text-xs text-neutral-500 mt-1">goals</span>
                    </div>
                  </>
                )}
              </div>

              {totalGoals > 0 && (
                <div className="flex flex-wrap justify-center gap-4 mt-2">
                  {pieData.map(d => (
                    <div key={d.name} className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-xs text-neutral-400">{d.name} <span className="text-neutral-600 ml-1">{d.value}</span></span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ROW 3: TEAM PERFORMANCE */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* Bar Chart */}
            <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-6 overflow-hidden">
              <div className="flex flex-col mb-6">
                <h3 className="text-sm font-semibold text-white">Team Performance</h3>
                <span className="text-xs text-neutral-500">Tasks completed by member</span>
              </div>
              <div style={{ height: Math.max(200, tasks_by_employee.length * 44) }}>
                {tasks_by_employee.length === 0 ? (
                  <div className="w-full h-full flex items-center justify-center text-sm text-neutral-600">No completions yet.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={tasks_by_employee} margin={{ left: 0, right: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 12, fill: '#666' }} axisLine={false} />
                      <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12, fill: '#a1a1a1' }} axisLine={false} tickLine={false} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#1a1a1a', borderColor: '#2a2a2a', borderRadius: '8px' }}
                        itemStyle={{ color: '#fff' }}
                        cursor={{ fill: '#1a1a1a' }}
                      />
                      <Bar dataKey="count" name="Tasks" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Department Table */}
            <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl overflow-hidden flex flex-col">
              <div className="p-6 pb-4 border-b border-[#2a2a2a]">
                <h3 className="text-sm font-semibold text-white">Department Health</h3>
              </div>
              <div className="flex-1 overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[500px]">
                  <thead>
                    <tr className="bg-[#0a0a0a]">
                      <th className="px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-widest border-b border-[#2a2a2a]">Department</th>
                      <th className="px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-widest border-b border-[#2a2a2a]">Tasks Done</th>
                      <th className="px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-widest border-b border-[#2a2a2a]">Completion</th>
                      <th className="px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-widest border-b border-[#2a2a2a]">Overdue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {department_health.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-sm text-neutral-600 italic">No department data available</td>
                      </tr>
                    ) : (
                      department_health.map((dept: any) => {
                        const compRate = dept.total_tasks > 0 ? Math.round((dept.completed_tasks / dept.total_tasks) * 100) : 0
                        const cColor = compRate > 70 ? 'bg-emerald-500' : compRate > 40 ? 'bg-amber-500' : 'bg-rose-500'
                        const tcColor = compRate > 70 ? 'text-emerald-500' : compRate > 40 ? 'text-amber-500' : 'text-rose-500'
                        
                        return (
                          <tr key={dept.id} className="hover:bg-[#1a1a1a] transition-colors border-b border-[#1a1a1a] last:border-0">
                            <td className="px-6 py-4 text-sm text-white font-medium">{dept.name}</td>
                            <td className="px-6 py-4 text-sm text-neutral-400">{dept.completed_tasks} / {dept.total_tasks}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="h-1.5 w-16 bg-[#2a2a2a] rounded-full overflow-hidden">
                                  <div className={cn("h-full rounded-full", cColor)} style={{ width: `${compRate}%` }} />
                                </div>
                                <span className={cn("text-xs font-medium", tcColor)}>{compRate}%</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {dept.overdue_tasks > 0 ? (
                                <span className="bg-rose-500/10 text-rose-400 text-xs px-2 py-1 rounded font-medium">{dept.overdue_tasks} overdue</span>
                              ) : (
                                <span className="flex items-center gap-1.5 text-xs text-emerald-500 font-medium">
                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> None
                                </span>
                              )}
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ROW 4: OVERDUE BANNER (simplified as requested, table left to the actual /admin/tasks page to avoid code dup, just showing banner) */}
          <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Overdue Tasks Action Center</h3>
              <div className={cn("text-xs font-bold px-2 py-0.5 rounded", overdue_tasks > 0 ? "bg-rose-500/10 text-rose-400" : "bg-emerald-500/10 text-emerald-500")}>
                {overdue_tasks > 0 ? `${overdue_tasks} Active Issues` : 'All Clear âœ“'}
              </div>
            </div>
            
            {overdue_tasks === 0 ? (
              <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-8 text-center flex flex-col items-center">
                <CheckCircle className="text-emerald-500 w-12 h-12 mb-3" />
                <h4 className="text-base font-semibold text-white">No overdue tasks</h4>
                <p className="text-sm text-neutral-400 mt-1">Your team is perfectly on track with all deliverables.</p>
              </div>
            ) : (
              <div className="bg-rose-500/5 border border-rose-500/15 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <AlertTriangle className="text-rose-500 w-8 h-8 shrink-0 mt-1" />
                  <div>
                    <h4 className="text-base font-semibold text-rose-400">Attention Required</h4>
                    <p className="text-sm text-neutral-400 mt-1 max-w-xl">
                      There are {overdue_tasks} tasks currently past their due date. Review them in the task manager to reassign resources or adjust deadlines to maintain department health.
                    </p>
                  </div>
                </div>
                <Link 
                  href="/admin/tasks?filter=overdue" 
                  className="shrink-0 bg-[#1a1a1a] hover:bg-[#2a2a2a] border border-[#3a3a3a] text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  Manage Tasks <ArrowRight size={16} />
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
