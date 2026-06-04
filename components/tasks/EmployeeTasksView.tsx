'use client'

import React, { useState, useEffect } from 'react'
import { Task } from '@/types'
import { TaskCard } from '@/components/tasks/TaskCard'
import { useInfiniteTasks } from '@/lib/queries/tasks'
import { isPast, isToday, isThisWeek } from 'date-fns'
import { Loader2 } from 'lucide-react'
import { useQueryState } from 'nuqs'
import { TasksViewSwitcher } from './TasksViewSwitcher'
import { KanbanBoardView } from './KanbanBoardView'
import { CalendarView } from './CalendarView'
import { useInView } from 'react-intersection-observer'

import { SkeletonTaskCard } from '@/components/shared/SkeletonTaskCard'

export function EmployeeTasksView() {
  const [view] = useQueryState('view', { defaultValue: 'list' })
  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } = useInfiniteTasks()
  const { ref, inView } = useInView()

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  const tasks: Task[] = data?.pages.flatMap(page => page.data) || []
  
  const [showCompleted, setShowCompleted] = useState(false)

  if (isLoading && tasks.length === 0) {
    return (
      <div className="pb-32 space-y-6">
        <TasksViewSwitcher />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-8">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonTaskCard key={i} />)}
        </div>
      </div>
    )
  }

  // Grouping
  const overdue: Task[] = []
  const today: Task[] = []
  const thisWeek: Task[] = []
  const later: Task[] = []
  const completed: Task[] = []

  tasks.forEach(task => {
    if (task.status === 'done' || task.status === 'cancelled') {
      completed.push(task)
      return
    }

    if (!task.due_date) {
      later.push(task)
      return
    }

    const date = new Date(task.due_date)
    if (isPast(date) && !isToday(date)) {
      overdue.push(task)
    } else if (isToday(date)) {
      today.push(task)
    } else if (isThisWeek(date)) {
      thisWeek.push(task)
    } else {
      later.push(task)
    }
  })

  const renderGroup = (title: string, groupTasks: Task[], isOverdueGroup = false) => {
    if (groupTasks.length === 0) return null

    return (
      <div className="mb-8">
        <div className="sticky top-[72px] bg-[#0a0a0a]/90 backdrop-blur-md py-3 z-10 flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-widest">{title}</span>
          <span className={isOverdueGroup ? "text-xs text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded font-medium" : "text-xs text-neutral-400 bg-[#1a1a1a] px-1.5 py-0.5 rounded font-medium"}>
            {groupTasks.length}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {groupTasks.map(t => <TaskCard key={t.id} task={t} />)}
        </div>
      </div>
    )
  }

  return (
    <div className="pb-32 space-y-6">
      <TasksViewSwitcher />

      {view === 'board' && <KanbanBoardView tasks={tasks} />}
      
      {view === 'calendar' && <CalendarView tasks={tasks} />}
      
      {(view === 'list' || !view) && (
        <div>
          {renderGroup('Overdue', overdue, true)}
          {renderGroup('Today', today)}
          {renderGroup('This Week', thisWeek)}
          {renderGroup('Later', later)}

          <div className="mt-8 border-t border-[#1a1a1a] pt-6">
            <button 
              onClick={() => setShowCompleted(!showCompleted)}
              className="text-sm font-medium text-neutral-400 hover:text-white transition-colors"
            >
              {showCompleted ? 'Hide' : 'Show'} completed tasks ({completed.length})
            </button>

            {showCompleted && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {completed.map(t => <TaskCard key={t.id} task={t} />)}
              </div>
            )}
          </div>
          
          <div ref={ref} className="h-10 mt-8 flex justify-center">
            {isFetchingNextPage && <Loader2 className="animate-spin text-neutral-500" size={24} />}
          </div>
        </div>
      )}
    </div>
  )
}
