'use client'

import { useState } from 'react'
import { BellRing, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function DeadlineTriggerButton() {
  const [isFiring, setIsFiring] = useState(false)

  const handleTrigger = async () => {
    setIsFiring(true)
    try {
      const res = await fetch('/api/cron/deadlines')
      if (!res.ok) throw new Error('Failed to run deadline check')
      const data = await res.json()
      toast.success(`Deadline check completed! Created ${data.created || 0} notifications.`)
    } catch (err: any) {
      toast.error(err.message || 'Error running deadline check')
    } finally {
      setIsFiring(false)
    }
  }

  return (
    <button
      onClick={handleTrigger}
      disabled={isFiring}
      className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-indigo-500 hover:bg-indigo-600 text-white rounded-md transition-colors disabled:opacity-50"
    >
      {isFiring ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BellRing className="w-3.5 h-3.5" />}
      Run Deadline Check
    </button>
  )
}
