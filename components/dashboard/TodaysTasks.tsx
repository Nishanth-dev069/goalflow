'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Task } from '@/types'
import { format } from 'date-fns'
import { CheckSquare, CheckCircle, ChevronRight, Check } from 'lucide-react'
import { PriorityBadge } from '@/components/shared/PriorityBadge'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { useTranslation } from '@/lib/utils/i18n'
import { formatDateIST } from '@/lib/utils/dates'

export function TodaysTasks({ initialData, lang = 'en' }: { initialData: Task[], lang?: 'en' | 'hi' }) {
  const router = useRouter()
  const t = useTranslation(lang)
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
    staleTime: 30 * 1000,
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

  return (
    <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2">
            <CheckSquare size={15} className="text-indigo-400" />
            <h2 className="text-sm font-semibold text-white">{t('todays_tasks')}</h2>
            <span className="bg-[#1a1a1a] text-xs text-neutral-500 px-1.5 py-0.5 rounded-md">{tasks.length}</span>
            {isLive && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" title="Live updates" />}
          </div>
          <p className="text-xs text-neutral-600 mt-0.5">{formatDateIST(new Date(), 'EEEE, MMM d')}</p>
        </div>
        <Link href="/tasks" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">All tasks →</Link>
      </div>

      {overdueTasks.length > 0 && (
        <div className="mb-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-red-400 mb-2">
            Overdue · {overdueTasks.length}
          </p>
          <div className="bg-red-500/5 border border-red-500/10 rounded-xl overflow-hidden">
            {overdueTasks.map(task => (
              <TaskCheckRow 
                key={task.id} 
                task={task} 
                onToggleDone={(id) => updateMutation.mutate({ id, status: task.status === 'done' ? 'todo' : 'done' })}
                router={router}
              />
            ))}
          </div>
        </div>
      )}

      {todayTasks.length > 0 ? (
        <div className="divide-y divide-[#1a1a1a]">
          {todayTasks.map(task => (
            <TaskCheckRow 
              key={task.id} 
              task={task} 
              onToggleDone={(id) => updateMutation.mutate({ id, status: task.status === 'done' ? 'todo' : 'done' })}
              router={router}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center py-10">
          <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-3">
            <CheckCircle size={24} className="text-green-500" />
          </div>
          <p className="text-sm font-semibold text-white">All clear!</p>
          <p className="text-xs text-neutral-600 mt-1">No tasks due today</p>
        </div>
      )}
    </div>
  )
}

function TaskCheckRow({ task, onToggleDone, router }: { task: Task, onToggleDone: (id: string) => void, router: any }) {
  const isDone = task.status === 'done'
  return (
    <div 
      className="flex items-center gap-3 py-3 px-1 group"
      onMouseEnter={() => router.prefetch(`/tasks/${task.id}`)}
    >
      <div className={cn("w-0.5 h-8 rounded-full flex-shrink-0", {
        'bg-red-500': task.priority === 'urgent',
        'bg-orange-500': task.priority === 'high',
        'bg-amber-500': task.priority === 'medium',
        'bg-green-500': task.priority === 'low',
      })} />

      <button
        onClick={() => onToggleDone(task.id)}
        className={cn(
          "w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all",
          isDone ? "bg-green-500 border-green-500" : "border-[#3a3a3a] hover:border-indigo-500"
        )}
      >
        {isDone && <Check size={10} className="text-white" />}
      </button>

      <Link href={`/tasks/${task.id}`} className="flex-1 min-w-0">
        <span className={cn(
          "text-sm text-white truncate block transition-all",
          isDone && "line-through text-neutral-600"
        )}>
          {task.title}
        </span>
        {task.subtasks && task.subtasks.length > 0 && (
          <span className="text-[10px] text-neutral-600">
            {task.subtasks.filter(s => s.is_done).length}/{task.subtasks.length} subtasks
          </span>
        )}
      </Link>

      <PriorityBadge priority={task.priority} className="opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block" />

      <ChevronRight size={12} className="text-neutral-700 group-hover:text-neutral-500 flex-shrink-0" />
    </div>
  )
}
