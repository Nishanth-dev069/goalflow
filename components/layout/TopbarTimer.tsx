'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { TimeEntry } from '@/types'

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

const formatTimer = (seconds: number) => {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0')
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0')
  const s = Math.floor(seconds % 60).toString().padStart(2, '0')
  return `${h}:${m}:${s}`
}

export function TopbarTimer() {
  const router = useRouter()
  const [elapsed, setElapsed] = useState(0)

  const { data: activeTimer } = useQuery({
    queryKey: ['time', 'active'],
    queryFn: async () => {
      const res = await fetch('/api/time/active')
      if (!res.ok) return null
      const json = await res.json()
      return json.data as TimeEntry | null
    },
    refetchInterval: 30000
  })

  useEffect(() => {
    if (activeTimer) {
      setElapsed(Math.floor((Date.now() - new Date(activeTimer.started_at).getTime()) / 1000))
    }
  }, [activeTimer])

  useInterval(() => {
    if (activeTimer) setElapsed(e => e + 1)
  }, activeTimer ? 1000 : null)

  if (!activeTimer) return null

  return (
    <button 
      onClick={() => router.push(`/tasks/${activeTimer.task_id}`)}
      className="hidden md:flex items-center gap-2 h-8 px-3 rounded-md bg-green-500/10 border border-green-500/20 text-xs font-medium text-green-400 hover:bg-green-500/20 transition-colors"
      title={`Timer running on: ${activeTimer.task?.title || 'Unknown Task'}`}
    >
      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
      {formatTimer(elapsed)}
    </button>
  )
}
