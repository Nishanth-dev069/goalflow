'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Task } from '@/types'
import { format, isPast, isToday } from 'date-fns'
import { CheckCircle, ChevronRight, Check } from 'lucide-react'
import { PriorityBadge } from '@/components/shared/PriorityBadge'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function TodaysTasks({ initialData }: { initialData: Task[] }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const supabase = createClient()
  const [isLive, setIsLive] = useState(false)

  const { data: tasks = initialData } = useQuery({
    queryKey: ['dashboard', 'today_tasks'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard')
      if (!res.ok) throw new Error('Failed to fetch tasks')
      const json = await res.json()
      return json.today_tasks as Task[]
    },
    initialData,
    staleTime: 1000 * 60 * 5,
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Failed to update task')
      return res.json()
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['dashboard', 'today_tasks'] })
      const previous = queryClient.getQueryData<Task[]>(['dashboard', 'today_tasks'])
      
      queryClient.setQueryData<Task[]>(['dashboard', 'today_tasks'], old => {
        if (!old) return old
        // Optimistically remove from today if done, or update status
        return old.map(t => t.id === id ? { ...t, status: status as any } : t)
      })
      
      return { previous }
    },
    onError: (err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['dashboard', 'today_tasks'], context.previous)
      }
      toast.error(err.message)
    },
    onSuccess: () => {
      toast.success('Task completed', { icon: <CheckCircle className="text-emerald-500" size={16} /> })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    }
  })

  // Set up realtime subscription
  useEffect(() => {
    let mounted = true
    
    const initRealtime = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const channel = supabase.channel('dashboard-tasks')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'tasks', filter: `assigned_to=eq.${session.user.id}` },
          (payload) => {
            console.log('Realtime task update received!', payload)
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'today_tasks'] })
            queryClient.invalidateQueries({ queryKey: ['dashboard'] })
          }
        )
        .subscribe((status) => {
          if (mounted) {
            setIsLive(status === 'SUBSCRIBED')
          }
        })

      return () => {
        supabase.removeChannel(channel)
      }
    }

    const cleanup = initRealtime()
    return () => {
      mounted = false
      cleanup.then(fn => fn?.())
    }
  }, [supabase, queryClient])

  const overdueTasks = tasks.filter(t => t.is_overdue)
  const todayTasks = tasks.filter(t => !t.is_overdue)

  const renderTask = (task: Task, isOverdue: boolean) => {
    const isCompletedOptimistic = task.status === 'done'
    const pColor = {
      urgent: 'bg-rose-500',
      high: 'bg-orange-500',
      medium: 'bg-amber-500',
      low: 'bg-emerald-500'
    }[task.priority]

    return (
      <div key={task.id} className="relative flex items-center gap-3 py-3 group hover:bg-[#1a1a1a] rounded-lg transition-colors -mx-2 px-2 border-b border-[#1a1a1a] last:border-0">
        <div className={cn("w-[3px] h-3/4 rounded-full absolute left-0", isOverdue ? "bg-rose-500" : pColor)} />
        
        <div 
          onClick={() => {
            if (!isCompletedOptimistic) updateMutation.mutate({ id: task.id, status: 'done' })
          }}
          className={cn(
            "w-5 h-5 rounded-full flex items-center justify-center cursor-pointer transition-colors shrink-0",
            isCompletedOptimistic 
              ? "bg-emerald-500" 
              : "border-2 border-[#3a3a3a] hover:border-indigo-500"
          )}
        >
          {isCompletedOptimistic && <Check size={12} className="text-white" />}
        </div>

        <div className="flex-1 min-w-0 flex items-center gap-2">
          <span className={cn(
            "text-sm truncate transition-all",
            isCompletedOptimistic ? "line-through text-neutral-500" : "text-white"
          )}>
            {task.title}
          </span>
          {isOverdue && !isCompletedOptimistic && (
            <span className="shrink-0 bg-rose-500/10 text-rose-400 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded">
              Overdue
            </span>
          )}
        </div>

        <div className="hidden group-hover:flex items-center gap-2 shrink-0 animate-in fade-in slide-in-from-right-2">
          <PriorityBadge priority={task.priority} className="text-[10px] py-0 border-0" />
          <button 
            onClick={(e) => { e.stopPropagation(); router.push(`/tasks/${task.id}`) }}
            className="text-neutral-600 hover:text-neutral-400 transition-colors p-1"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <h2 className="text-base font-semibold text-white">Today</h2>
          <span className="text-sm text-neutral-500 ml-2">{format(new Date(), 'EEEE, MMM d')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-[#1a1a1a] text-xs text-neutral-400 px-2 py-0.5 rounded-md font-medium">
            {tasks.length} tasks
          </div>
          {isLive && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="Live updates active" />
          )}
        </div>
      </div>

      <div className="space-y-1">
        {overdueTasks.length > 0 && (
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-rose-400 uppercase tracking-widest mb-2 mt-1">Overdue</h3>
            {overdueTasks.map(t => renderTask(t, true))}
          </div>
        )}

        {todayTasks.length > 0 ? (
          <div>
            {todayTasks.map(t => renderTask(t, false))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center py-12">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
              <CheckCircle className="text-emerald-500" size={24} />
            </div>
            <p className="text-sm font-medium text-white">You're all caught up</p>
            <p className="text-xs text-neutral-500 mt-1">No tasks due today</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
