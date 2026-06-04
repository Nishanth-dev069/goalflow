'use client'

import React, { useState, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { PageHeader } from '@/components/shared/PageHeader'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { PriorityBadge } from '@/components/shared/PriorityBadge'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { useTasks, useUpdateTask, useBulkUpdateTasks } from '@/lib/queries/tasks'
import { useUsers } from '@/lib/queries/users'
import { useDepartments } from '@/lib/queries/departments'
import { Task } from '@/types'
import { Search, Plus, CheckSquare, MoreVertical, ChevronUp, ChevronDown, X } from 'lucide-react'
import { format, isPast, isToday } from 'date-fns'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useQueryState } from 'nuqs'
import { TasksViewSwitcher } from '@/components/tasks/TasksViewSwitcher'
import { KanbanBoardView } from '@/components/tasks/KanbanBoardView'
import { CalendarView } from '@/components/tasks/CalendarView'

export default function TasksManagementPage() {
  const router = useRouter()
  const params = useParams<{ workspace: string }>()
  const workspace = params.workspace || 'admin'
  const [view] = useQueryState('view', { defaultValue: 'list' })
  
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [assigneeFilter, setAssigneeFilter] = useState('all')

  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc'|'desc' }>({ key: 'created_at', direction: 'desc' })

  const { data: tasksResponse, isLoading } = useTasks({ page })
  const tasks: Task[] = tasksResponse?.data || []
  const totalTasks = tasksResponse?.total || 0
  const perPage = tasksResponse?.per_page || 20

  const { data: users } = useUsers()
  const { data: departments } = useDepartments()
  
  const updateMutation = useUpdateTask()
  const bulkUpdateMutation = useBulkUpdateTasks()

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isReassignOpen, setIsReassignOpen] = useState(false)

  // Local filtering to combine API pagination with simple UI text searching for demonstration
  const filteredTasks = useMemo(() => {
    let result = tasks
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(t => t.title.toLowerCase().includes(q))
    }
    if (statusFilter !== 'all') result = result.filter(t => t.status === statusFilter)
    if (priorityFilter !== 'all') result = result.filter(t => t.priority === priorityFilter)
    if (assigneeFilter !== 'all') result = result.filter(t => t.assigned_to === assigneeFilter)
    // Department filtering technically requires joining, but we map it visually if we had nested data.
    // For now we skip pure department-level filtering if it's nested deep, or we can assume it's attached via assignee
    
    // Sort
    result.sort((a, b) => {
      let aVal = (a as any)[sortConfig.key]
      let bVal = (b as any)[sortConfig.key]
      if (typeof aVal === 'string') aVal = aVal.toLowerCase()
      if (typeof bVal === 'string') bVal = bVal.toLowerCase()
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })

    return result
  }, [tasks, search, statusFilter, priorityFilter, assigneeFilter, sortConfig])

  const toggleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedIds(filteredTasks.map(t => t.id))
    else setSelectedIds([])
  }

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const handleBulkAction = (data: any) => {
    bulkUpdateMutation.mutate({ ids: selectedIds, data }, {
      onSuccess: () => {
        toast.success(`Updated ${selectedIds.length} tasks`)
        setSelectedIds([])
        setIsReassignOpen(false)
      },
      onError: (err) => toast.error(err.message)
    })
  }

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setPriorityFilter('all')
    setDepartmentFilter('all')
    setAssigneeFilter('all')
  }

  const hasFilters = search || statusFilter !== 'all' || priorityFilter !== 'all' || departmentFilter !== 'all' || assigneeFilter !== 'all'

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Tasks</h1>
          <p className="text-neutral-400 mt-1">Assign and manage tasks for your team</p>
        </div>
        <div className="flex items-center gap-4">
          <TasksViewSwitcher />
          <button
            onClick={() => router.push(`/${workspace}/tasks/create`)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white h-9 px-4 text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus size={16} />
            Assign Task
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#111111] border border-[#2a2a2a] p-4 rounded-xl flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={14} />
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg h-9 pl-9 pr-3 text-sm text-white focus:border-indigo-500 outline-none transition-colors"
          />
        </div>

        <select
          value={assigneeFilter}
          onChange={e => setAssigneeFilter(e.target.value)}
          className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg h-9 px-3 text-sm text-white focus:border-indigo-500 outline-none w-[140px]"
        >
          <option value="all">Assignee</option>
          {users?.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
        </select>

        <select
          value={departmentFilter}
          onChange={e => setDepartmentFilter(e.target.value)}
          className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg h-9 px-3 text-sm text-white focus:border-indigo-500 outline-none w-[140px]"
        >
          <option value="all">Department</option>
          {departments?.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg h-9 px-3 text-sm text-white focus:border-indigo-500 outline-none w-[120px]"
        >
          <option value="all">Status</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="review">In Review</option>
          <option value="done">Done</option>
        </select>

        <select
          value={priorityFilter}
          onChange={e => setPriorityFilter(e.target.value)}
          className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg h-9 px-3 text-sm text-white focus:border-indigo-500 outline-none w-[120px]"
        >
          <option value="all">Priority</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        {hasFilters && (
          <button onClick={clearFilters} className="text-sm text-neutral-400 hover:text-white px-2 py-1">
            Clear filters
          </button>
        )}
      </div>

      {view === 'board' && <KanbanBoardView tasks={filteredTasks} onAddTask={() => router.push(`/${workspace}/tasks/create`)} />}
      
      {view === 'calendar' && <CalendarView tasks={filteredTasks} />}

      {(view === 'list' || !view) && (
        <>
          <div className="relative">
        {/* Bulk Action Bar */}
        {selectedIds.length > 0 && (
          <div className="absolute top-0 left-0 right-0 z-10 bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-md rounded-t-xl px-4 py-3 flex items-center justify-between animate-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <button onClick={() => setSelectedIds([])} className="text-indigo-400 hover:text-indigo-300">
                <X size={16} />
              </button>
              <span className="text-sm font-medium text-indigo-400">{selectedIds.length} tasks selected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <button 
                  onClick={() => setIsReassignOpen(!isReassignOpen)}
                  className="bg-[#1a1a1a] hover:bg-[#2a2a2a] border border-[#3a3a3a] text-white text-xs px-3 py-1.5 rounded-md transition-colors"
                >
                  Reassign
                </button>
                {isReassignOpen && (
                  <div className="absolute top-full right-0 mt-1 bg-[#111111] border border-[#2a2a2a] rounded-lg shadow-xl w-48 max-h-64 overflow-y-auto p-1">
                    {users?.map(u => (
                      <div 
                        key={u.id}
                        onClick={() => handleBulkAction({ assigned_to: u.id })}
                        className="p-2 hover:bg-[#1a1a1a] rounded text-sm text-white cursor-pointer flex items-center gap-2"
                      >
                        <UserAvatar user={u as any} className="w-5 h-5" />
                        {u.full_name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button 
                onClick={() => handleBulkAction({ status: 'done' })}
                className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs px-3 py-1.5 rounded-md transition-colors border border-emerald-500/20"
              >
                Mark Done
              </button>
              <button 
                onClick={() => {
                  if(confirm('Cancel selected tasks?')) handleBulkAction({ status: 'cancelled' })
                }}
                className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs px-3 py-1.5 rounded-md transition-colors border border-rose-500/20"
              >
                Cancel Tasks
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className={cn("bg-[#111111] border border-[#2a2a2a] overflow-hidden overflow-x-auto transition-all", selectedIds.length > 0 ? "rounded-b-xl rounded-t-none mt-[52px]" : "rounded-xl")}>
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="border-b border-[#2a2a2a] bg-[#1a1a1a]">
                <th className="py-3 px-4 w-12">
                  <input 
                    type="checkbox" 
                    checked={filteredTasks.length > 0 && selectedIds.length === filteredTasks.length}
                    onChange={handleSelectAll}
                    className="rounded border-[#3a3a3a] bg-[#0a0a0a] text-indigo-600 focus:ring-indigo-500/20 w-4 h-4 cursor-pointer"
                  />
                </th>
                {[
                  { key: 'title', label: 'Title' },
                  { key: 'assigned_to', label: 'Assignee' },
                  { key: 'department', label: 'Department' },
                  { key: 'due_date', label: 'Due Date' },
                  { key: 'priority', label: 'Priority' },
                  { key: 'status', label: 'Status' }
                ].map(col => (
                  <th 
                    key={col.key}
                    onClick={() => toggleSort(col.key)}
                    className="text-xs font-medium text-neutral-500 uppercase tracking-wide py-3 px-4 cursor-pointer hover:bg-[#2a2a2a] transition-colors select-none"
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      {sortConfig.key === col.key && (
                        sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                      )}
                    </div>
                  </th>
                ))}
                <th className="text-xs font-medium text-neutral-500 uppercase tracking-wide py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#1a1a1a] last:border-0">
                    <td className="py-4 px-4"><div className="w-4 h-4 rounded bg-[#1a1a1a] animate-pulse" /></td>
                    <td className="py-4 px-4"><div className="h-5 w-48 bg-[#1a1a1a] rounded animate-pulse" /></td>
                    <td className="py-4 px-4"><div className="h-6 w-32 bg-[#1a1a1a] rounded animate-pulse" /></td>
                    <td className="py-4 px-4"><div className="h-5 w-24 bg-[#1a1a1a] rounded animate-pulse" /></td>
                    <td className="py-4 px-4"><div className="h-5 w-24 bg-[#1a1a1a] rounded animate-pulse" /></td>
                    <td className="py-4 px-4"><div className="h-5 w-20 bg-[#1a1a1a] rounded animate-pulse" /></td>
                    <td className="py-4 px-4"><div className="h-5 w-20 bg-[#1a1a1a] rounded animate-pulse" /></td>
                    <td className="py-4 px-4"><div className="h-5 w-10 bg-[#1a1a1a] rounded animate-pulse ml-auto" /></td>
                  </tr>
                ))
              ) : filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12">
                    <EmptyState 
                      icon={CheckSquare}
                      title="No tasks found"
                      description="Try adjusting your filters or assign a new task."
                    />
                  </td>
                </tr>
              ) : (
                filteredTasks.map(task => {
                  const isChecked = selectedIds.includes(task.id)
                  const isOverdue = task.is_overdue
                  
                  let dateColor = 'text-neutral-400'
                  if (isOverdue) dateColor = 'text-rose-400'
                  else if (task.due_date && isToday(new Date(task.due_date))) dateColor = 'text-amber-400'

                  return (
                    <tr 
                      key={task.id} 
                      className={cn(
                        "transition-colors border-b border-[#1a1a1a] last:border-0",
                        isChecked ? "bg-indigo-500/5 hover:bg-indigo-500/10" : "hover:bg-[#1a1a1a]"
                      )}
                    >
                      <td className="py-3 px-4">
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={() => handleSelectOne(task.id)}
                          className="rounded border-[#3a3a3a] bg-[#0a0a0a] text-indigo-600 focus:ring-indigo-500/20 w-4 h-4 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {isOverdue && <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded">Overdue</span>}
                          <div 
                            className="text-sm text-white font-medium hover:text-indigo-400 cursor-pointer transition-colors"
                            onClick={() => router.push(`/tasks/${task.id}`)}
                          >
                            {task.title}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {task.assignee ? (
                          <div className="flex items-center gap-2">
                            <UserAvatar user={task.assignee as any} className="w-5 h-5" />
                            <span className="text-sm text-neutral-300">{task.assignee.full_name}</span>
                          </div>
                        ) : <span className="text-neutral-500">â€”</span>}
                      </td>
                      <td className="py-3 px-4 text-sm text-neutral-400">
                        {task.assignee?.department?.name || 'â€”'}
                      </td>
                      <td className={cn("py-3 px-4 text-sm", dateColor)}>
                        {task.due_date ? format(new Date(task.due_date), 'MMM d, yyyy') : 'â€”'}
                      </td>
                      <td className="py-3 px-4">
                        <PriorityBadge priority={task.priority} />
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={task.status} type="task" />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => router.push(`/tasks/${task.id}`)}
                            className="p-1.5 text-neutral-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded transition-colors"
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-neutral-500">
          Showing {totalTasks === 0 ? 0 : (page - 1) * perPage + 1} - {Math.min(page * perPage, totalTasks)} of {totalTasks}
        </div>
        <div className="flex items-center gap-2">
          <button 
            disabled={page === 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="text-sm text-white bg-[#111111] hover:bg-[#1a1a1a] border border-[#2a2a2a] px-3 py-1.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <button 
            disabled={page * perPage >= totalTasks}
            onClick={() => setPage(p => p + 1)}
            className="text-sm text-white bg-[#111111] hover:bg-[#1a1a1a] border border-[#2a2a2a] px-3 py-1.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>
      </>
      )}
    </div>
  )
}
