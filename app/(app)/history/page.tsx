'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { ActivityLog, User } from '@/types'
import { CheckCircle, Target, MessageCircle, Plus, Trophy, Activity, Download, Loader2, Filter } from 'lucide-react'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { format, isToday, isYesterday, formatDistanceToNow, subDays } from 'date-fns'
import Link from 'next/link'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

type Entry = ActivityLog & { user: User }

const ACTION_TYPES = [
  { id: 'task_created', label: 'Task Assigned' },
  { id: 'task_updated', label: 'Task Updated' },
  { id: 'task_completed', label: 'Task Completed' },
  { id: 'goal_created', label: 'Goal Created' },
  { id: 'goal_updated', label: 'Goal Updated' },
  { id: 'goal_completed', label: 'Goal Completed' },
  { id: 'comment_added', label: 'Comments' },
]

const PRESETS = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
  { label: 'All Time', days: null }
]

function actionToReadable(action: string) {
  const map: Record<string, string> = {
    goal_created: 'created a new goal',
    goal_updated: 'updated goal progress on',
    goal_completed: 'completed the goal',
    task_created: 'assigned a task',
    task_completed: 'completed task',
    task_updated: 'updated task',
    comment_added: 'commented on',
  }
  return map[action] || 'updated'
}

function getActionIcon(action: string) {
  if (action.includes('completed') && action.includes('task')) return <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0"><CheckCircle size={16} className="text-emerald-500" /></div>
  if (action.includes('completed') && action.includes('goal')) return <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0"><Trophy size={16} className="text-emerald-500" /></div>
  if (action.includes('progress') || action.includes('updated') && action.includes('goal')) return <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0"><Target size={16} className="text-indigo-400" /></div>
  if (action.includes('comment')) return <div className="w-8 h-8 rounded-full bg-sky-500/10 flex items-center justify-center shrink-0"><MessageCircle size={16} className="text-sky-400" /></div>
  if (action.includes('created')) return <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center shrink-0"><Plus size={16} className="text-neutral-400" /></div>
  return <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center shrink-0"><Activity size={16} className="text-neutral-400" /></div>
}

export default function HistoryPage() {
  const [preset, setPreset] = useState<number | null>(7)
  const [dateFrom, setDateFrom] = useState<string>(format(subDays(new Date(), 7), 'yyyy-MM-dd'))
  const [dateTo, setDateTo] = useState<string>('')
  
  const [selectedActions, setSelectedActions] = useState<string[]>([])
  
  // Update dates when preset changes
  useEffect(() => {
    if (preset === null) {
      setDateFrom('')
      setDateTo('')
    } else {
      setDateFrom(format(subDays(new Date(), preset), 'yyyy-MM-dd'))
      setDateTo('')
    }
  }, [preset])

  const fetchLogs = async ({ pageParam = 1 }) => {
    const params = new URLSearchParams()
    params.set('page', String(pageParam))
    if (dateFrom) params.set('date_from', dateFrom)
    if (dateTo) params.set('date_to', dateTo)
    if (selectedActions.length > 0) params.set('action_types', selectedActions.join(','))

    const res = await fetch(`/api/activity?${params.toString()}`)
    if (!res.ok) throw new Error('Failed to fetch activity')
    return res.json()
  }

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ['activity', dateFrom, dateTo, selectedActions],
    queryFn: fetchLogs,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.has_more ? lastPage.page + 1 : undefined,
  })

  // Intersection Observer for infinite scroll
  const observerTarget = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { threshold: 0.1 }
    )
    if (observerTarget.current) observer.observe(observerTarget.current)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const exportCSV = () => {
    const params = new URLSearchParams()
    params.set('format', 'csv')
    if (dateFrom) params.set('date_from', dateFrom)
    if (dateTo) params.set('date_to', dateTo)
    if (selectedActions.length > 0) params.set('action_types', selectedActions.join(','))
    
    window.location.href = `/api/activity?${params.toString()}`
  }

  const allEntries: Entry[] = useMemo(() => {
    if (!data) return []
    return data.pages.flatMap(page => page.data)
  }, [data])

  const totalResults = data?.pages[0]?.total || 0

  // Group by date
  const grouped = useMemo(() => {
    const map = new Map<string, Entry[]>()
    allEntries.forEach(entry => {
      const d = new Date(entry.created_at)
      let key = ''
      if (isToday(d)) key = 'Today'
      else if (isYesterday(d)) key = 'Yesterday'
      else key = format(d, 'MMMM d, yyyy')
      
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(entry)
    })
    return map
  }, [allEntries])

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 min-h-screen pb-32">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Work History</h1>
        <p className="text-neutral-400 mt-1">A complete record of everything done across the platform.</p>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-4 flex flex-wrap gap-4 items-center">
        
        <div className="flex items-center gap-1 bg-[#0a0a0a] p-1 rounded-lg border border-[#2a2a2a]">
          {PRESETS.map(p => (
            <button
              key={p.label}
              onClick={() => setPreset(p.days)}
              className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
                preset === p.days ? 'bg-[#1a1a1a] text-white' : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <Popover>
          <PopoverTrigger className="flex items-center gap-2 bg-[#0a0a0a] border border-[#2a2a2a] hover:border-[#3a3a3a] text-neutral-300 text-sm px-3 py-2 rounded-lg transition-colors">
            <Filter size={14} />
            Action Types {selectedActions.length > 0 && `(${selectedActions.length})`}
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2 bg-[#111111] border-[#2a2a2a]" align="start">
            <div className="space-y-1">
              {ACTION_TYPES.map(type => {
                const checked = selectedActions.includes(type.id)
                return (
                  <label key={type.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-[#1a1a1a] rounded-md cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded border-[#3a3a3a] bg-[#0a0a0a] checked:bg-indigo-500 checked:border-indigo-500"
                      checked={checked}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedActions(prev => [...prev, type.id])
                        else setSelectedActions(prev => prev.filter(id => id !== type.id))
                      }}
                    />
                    <span className="text-sm text-neutral-300">{type.label}</span>
                  </label>
                )
              })}
            </div>
            {selectedActions.length > 0 && (
              <button 
                onClick={() => setSelectedActions([])}
                className="w-full mt-2 text-xs text-neutral-500 hover:text-neutral-300 py-1"
              >
                Clear Filters
              </button>
            )}
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-neutral-500">
          {isLoading ? 'Loading...' : `Showing ${totalResults} results`}
        </span>
        <button 
          onClick={exportCSV}
          className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors"
        >
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* List */}
      <div className="space-y-8">
        {Array.from(grouped.entries()).map(([dateLabel, entries]) => (
          <div key={dateLabel}>
            <div className="sticky top-0 bg-[#0a0a0a]/90 backdrop-blur-md py-3 z-10 flex items-center gap-3 mb-2">
              <span className="text-xs font-semibold text-neutral-500 uppercase tracking-widest">{dateLabel}</span>
              <div className="flex-1 h-px bg-[#1a1a1a]" />
              <span className="text-xs text-neutral-600">{entries.length} actions</span>
            </div>

            <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl overflow-hidden">
              {entries.map(entry => {
                const entityUrl = entry.entity_type === 'task' ? `/tasks/${entry.entity_id}` 
                                : entry.entity_type === 'goal' ? `/goals/${entry.entity_id}` 
                                : '#'
                
                return (
                  <div key={entry.id} className="flex items-start gap-4 px-5 py-4 hover:bg-[#1a1a1a] transition-colors border-b border-[#1a1a1a] last:border-0">
                    {getActionIcon(entry.action)}
                    <UserAvatar user={entry.user} className="w-8 h-8 mt-0.5" />
                    
                    <div className="flex-1 min-w-0 pt-1">
                      <p className="text-sm text-neutral-300 leading-snug">
                        <span className="font-medium text-white">{entry.user?.full_name}</span>
                        {' '}{actionToReadable(entry.action)}{' '}
                        {entry.entity_id && (
                          <Link href={entityUrl} className="text-indigo-400 hover:text-indigo-300 font-medium ml-1">
                            {entry.entity_title || 'item'}
                          </Link>
                        )}
                      </p>
                      {entry.metadata?.note && (
                        <p className="text-sm text-neutral-500 mt-1 italic border-l-2 border-[#2a2a2a] pl-3">
                          "{entry.metadata.note}"
                        </p>
                      )}
                    </div>

                    <time className="text-xs text-neutral-600 whitespace-nowrap pt-1" title={format(new Date(entry.created_at), 'PPpp')}>
                      {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                    </time>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        <div ref={observerTarget} className="h-10 flex items-center justify-center">
          {isFetchingNextPage && <Loader2 className="animate-spin text-neutral-600" />}
          {!hasNextPage && allEntries.length > 0 && (
            <span className="text-sm text-neutral-600">All caught up â€” no more history</span>
          )}
        </div>
      </div>
    </div>
  )
}
