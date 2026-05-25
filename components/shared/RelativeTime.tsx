'use client'

import { useEffect, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { formatDate } from '@/lib/utils/dates'

interface RelativeTimeProps {
  date: string | Date
  className?: string
}

export function RelativeTime({ date, className }: RelativeTimeProps) {
  const [relative, setRelative] = useState('')

  useEffect(() => {
    const updateTime = () => {
      if (date) {
        setRelative(formatDistanceToNow(new Date(date), { addSuffix: true }))
      }
    }

    updateTime()
    const interval = setInterval(updateTime, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [date])

  if (!date) return null

  // During SSR or first render before useEffect runs, render the basic formatted date 
  // or a placeholder to avoid hydration mismatch, though we just wait for mount here.
  if (!relative) return <span className={className}>...</span>

  return (
    <time dateTime={new Date(date).toISOString()} title={formatDate(date)} className={className}>
      {relative}
    </time>
  )
}
