'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Play, Square, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { TimeEntry } from '@/types'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { format } from 'date-fns'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useForm } from 'react-hook-form'

function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback)
  useEffect(() => { savedCallback.current = callback }, [callback])
  useEffect(() => {
    if (delay !== null) {
      const id = setInterval(() => savedCallback.current(), delay)
      return () => clearInterval(id)
    }
  }, [delay])
}

const formatDuration = (seconds: number) => {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return `${h}h ${m}m`
}

const formatTimer = (seconds: number) => {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0')
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0')
  const s = Math.floor(seconds % 60).toString().padStart(2, '0')
  return `${h}:${m}:${s}`
}

export function TimeTracker({ taskId, currentUser }: { taskId: string, currentUser: any }) {
  const queryClient = useQueryClient()
  const [elapsed, setElapsed] = useState(0)
  const [manualOpen, setManualOpen] = useState(false)

  const { data: activeTimer, isLoading: loadingActive } = useQuery({
    queryKey: ['time', 'active'],
    queryFn: async () => {
      const res = await fetch('/api/time/active')
      if (!res.ok) throw new Error('Failed to fetch active timer')
      const json = await res.json()
      return json.data as TimeEntry | null
    },
    refetchInterval: 30000 // Poll every 30s to stay synced if started elsewhere
  })

  const { data: taskEntries = [], isLoading: loadingEntries } = useQuery({
    queryKey: ['time', 'task', taskId],
    queryFn: async () => {
      const res = await fetch(`/api/time?task_id=${taskId}`)
      if (!res.ok) throw new Error('Failed to fetch time entries')
      const json = await res.json()
      return json.data as TimeEntry[]
    }
  })

  const isTimerRunningOnThisTask = activeTimer && activeTimer.task_id === taskId

  useEffect(() => {
    if (isTimerRunningOnThisTask && activeTimer) {
      setElapsed(Math.floor((Date.now() - new Date(activeTimer.started_at).getTime()) / 1000))
    }
  }, [isTimerRunningOnThisTask, activeTimer])

  useInterval(() => {
    if (isTimerRunningOnThisTask) setElapsed(e => e + 1)
  }, isTimerRunningOnThisTask ? 1000 : null)

  const startMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/time/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_id: taskId })
      })
      if (!res.ok) throw new Error('Failed to start timer')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time'] })
      toast.success('Timer started')
    },
    onError: (err: any) => toast.error(err.message)
  })

  const stopMutation = useMutation({
    mutationFn: async () => {
      if (!activeTimer) return
      const res = await fetch('/api/time/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entry_id: activeTimer.id })
      })
      if (!res.ok) throw new Error('Failed to stop timer')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time'] })
      toast.success('Timer stopped')
    },
    onError: (err: any) => toast.error(err.message)
  })

  const totalTime = taskEntries.reduce((acc, curr) => acc + (curr.duration_seconds || 0), 0)

  const { register, handleSubmit, reset } = useForm()
  const onManualSubmit = async (data: any) => {
    try {
      const start = new Date(`${data.date}T${data.startTime}`)
      const end = new Date(`${data.date}T${data.endTime}`)
      
      const res = await fetch('/api/time/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: taskId,
          started_at: start.toISOString(),
          ended_at: end.toISOString(),
          note: data.note
        })
      })

      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || 'Failed to log time')
        return
      }

      toast.success('Time logged successfully')
      setManualOpen(false)
      reset()
      queryClient.invalidateQueries({ queryKey: ['time'] })
    } catch (err) {
      toast.error('Failed to log time')
    }
  }

  if (loadingActive || loadingEntries) {
    return <div className="animate-pulse h-32 bg-[#111111] border border-[#2a2a2a] rounded-xl" />
  }

  return (
    <div className="space-y-4">
      {isTimerRunningOnThisTask ? (
        <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <p className="text-xs text-green-400 font-medium">Timer running</p>
          </div>
          <p className="text-3xl font-mono font-bold text-white text-center mb-3">
            {formatTimer(elapsed)}
          </p>
          <button 
            onClick={() => stopMutation.mutate()} 
            disabled={stopMutation.isPending}
            className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white h-9 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {stopMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Square size={14} />} Stop
          </button>
        </div>
      ) : (
        <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-4">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-3">Time Tracking</p>
          
          {activeTimer && !isTimerRunningOnThisTask && (
            <div className="mb-3 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-400 text-center">
              You have a running timer on another task. Starting here will stop it.
            </div>
          )}

          <button 
            onClick={() => startMutation.mutate()} 
            disabled={startMutation.isPending}
            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white h-9 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {startMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
            Start Timer
          </button>
          
          <button 
            onClick={() => setManualOpen(true)} 
            className="w-full text-xs text-neutral-500 hover:text-neutral-300 mt-2 text-center outline-none"
          >
            + Log time manually
          </button>
          
          {totalTime > 0 && <p className="text-xs text-neutral-600 mt-3 text-center">Total: {formatDuration(totalTime)}</p>}
        </div>
      )}

      {taskEntries.length > 0 && (
        <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl overflow-hidden divide-y divide-[#1a1a1a]">
          {taskEntries.map(entry => (
            <div key={entry.id} className="p-3 hover:bg-[#1a1a1a] transition-colors">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <UserAvatar user={entry.user as any} className="w-5 h-5" />
                  <span className="text-xs font-medium text-neutral-300">{entry.user?.full_name}</span>
                </div>
                <span className="text-xs font-bold text-white">{formatDuration(entry.duration_seconds || 0)}</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] text-neutral-500">{format(new Date(entry.started_at), 'MMM d, yyyy')}</span>
                {entry.is_manual && <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-1 rounded uppercase font-bold tracking-wider">Manual</span>}
              </div>
              {entry.note && (
                <p className="text-xs text-neutral-400 mt-1">{entry.note}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={manualOpen} onOpenChange={setManualOpen}>
        <DialogContent className="bg-[#111111] border-[#2a2a2a] text-white">
          <DialogHeader>
            <DialogTitle>Log Time Manually</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onManualSubmit)} className="space-y-4 pt-4">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Date</label>
              <input type="date" {...register('date', { required: true })} className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg h-9 px-3 text-sm [color-scheme:dark]" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Start Time</label>
                <input type="time" {...register('startTime', { required: true })} className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg h-9 px-3 text-sm [color-scheme:dark]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">End Time</label>
                <input type="time" {...register('endTime', { required: true })} className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg h-9 px-3 text-sm [color-scheme:dark]" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Note (Optional)</label>
              <input type="text" {...register('note')} className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg h-9 px-3 text-sm" placeholder="What did you work on?" />
            </div>
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg h-9 text-sm font-medium transition-colors">
              Save Entry
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
