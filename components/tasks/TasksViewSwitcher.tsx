'use client'

import React from 'react'
import { useQueryState } from 'nuqs'
import { List, Columns, CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ViewButtonProps {
  view: string
  current: string | null
  icon: React.ElementType
  label: string
  onClick: (value: string) => void
}

function ViewButton({ view, current, icon: Icon, label, onClick }: ViewButtonProps) {
  const isActive = current === view || (!current && view === 'list')
  return (
    <button
      onClick={() => onClick(view)}
      className={cn(
        "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 cursor-pointer transition-colors",
        isActive 
          ? "bg-[#1a1a1a] text-white rounded-md" 
          : "text-neutral-500 hover:text-neutral-300 rounded-md"
      )}
    >
      <Icon size={14} />
      {label}
    </button>
  )
}

export function TasksViewSwitcher() {
  const [view, setView] = useQueryState('view', { defaultValue: 'list' })

  return (
    <div className="flex items-center gap-1 bg-[#111111] border border-[#2a2a2a] rounded-lg p-1 w-fit">
      <ViewButton view="list" current={view} icon={List} label="List" onClick={setView} />
      <ViewButton view="board" current={view} icon={Columns} label="Board" onClick={setView} />
      <ViewButton view="calendar" current={view} icon={CalendarDays} label="Calendar" onClick={setView} />
    </div>
  )
}
