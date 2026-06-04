'use client'

import { useState } from 'react'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { BellRing, X } from 'lucide-react'

export function PushNotificationPrompt() {
  const { isSupported, permission, subscribe } = usePushNotifications()
  const [dismissed, setDismissed] = useState(false)
  const [loading, setLoading] = useState(false)

  if (!isSupported || permission !== 'default' || dismissed) {
    return null
  }

  const handleSubscribe = async () => {
    setLoading(true)
    try {
      await subscribe()
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-[#1a1a1a] border-b border-[#2a2a2a] px-4 py-3 sm:px-6 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="bg-indigo-500/10 p-2 rounded-full hidden sm:block">
          <BellRing className="w-4 h-4 text-indigo-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-white">Enable push notifications</p>
          <p className="text-xs text-neutral-400">Get notified about goals, tasks, and important updates.</p>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="text-xs font-medium bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1.5 rounded-md transition-colors disabled:opacity-50"
        >
          {loading ? 'Enabling...' : 'Enable'}
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="text-neutral-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
