'use client'

import React, { useMemo } from 'react'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { enUS } from 'date-fns/locale/en-US'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import './calendar.css'
import { Task } from '@/types'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

const locales = {
  'en-US': enUS,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

interface CalendarViewProps {
  tasks: Task[]
}

const PRIORITY_STYLES: Record<string, string> = {
  urgent: 'bg-red-500/20 border-red-500/30 text-red-300',
  high: 'bg-orange-500/20 border-orange-500/30 text-orange-300',
  medium: 'bg-amber-500/20 border-amber-500/30 text-amber-300',
  low: 'bg-green-500/20 border-green-500/30 text-green-300'
}

const PRIORITY_DOT_COLORS: Record<string, string> = {
  urgent: 'bg-red-400',
  high: 'bg-orange-400',
  medium: 'bg-amber-400',
  low: 'bg-green-400'
}

export function CalendarView({ tasks }: CalendarViewProps) {
  const router = useRouter()

  const events = useMemo(() => {
    return tasks
      .filter(t => t.due_date) // Only tasks with due dates can be shown on calendar
      .map(task => {
        const start = new Date(task.due_date!)
        const end = new Date(task.due_date!)
        return {
          id: task.id,
          title: task.title,
          start,
          end,
          resource: task
        }
      })
  }, [tasks])

  const EventComponent = ({ event }: any) => {
    const task = event.resource as Task
    const style = PRIORITY_STYLES[task.priority || 'medium'] || PRIORITY_STYLES.medium
    const dot = PRIORITY_DOT_COLORS[task.priority || 'medium'] || PRIORITY_DOT_COLORS.medium

    return (
      <div className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium border truncate flex items-center gap-1.5 h-full", style)}>
        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dot)} />
        <span className="truncate">{event.title}</span>
      </div>
    )
  }

  return (
    <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl p-4 h-[calc(100vh-220px)] min-h-[600px] overflow-hidden calendar-dark-override">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        views={['month', 'week', 'day']}
        defaultView="month"
        onSelectEvent={(event: any) => router.push(`/tasks/${event.id}`)}
        components={{
          event: EventComponent,
        }}
      />
    </div>
  )
}
