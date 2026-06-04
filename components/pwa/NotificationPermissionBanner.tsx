'use client'

import { useState, useEffect } from 'react'
import { Bell, X } from 'lucide-react'
import { usePushNotifications } from '@/hooks/usePushNotifications'

export function NotificationPermissionBanner() {
  const { permission, subscribe } = usePushNotifications()
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Check if dismissed recently (7 days = 604800000ms)
    const dismissedAt = localStorage.getItem('goalflow_push_dismissed_at')
    const hasDismissedRecently = dismissedAt && (Date.now() - parseInt(dismissedAt, 10) < 604800000)

    if (permission === 'default' && !hasDismissedRecently) {
      // Delay showing the banner so it's not overwhelming immediately on login
      const timer = setTimeout(() => setShow(true), 3000)
      return () => clearTimeout(timer)
    }
  }, [permission])

  const handleEnable = async () => {
    setLoading(true)
    const result = await subscribe()
    if (result && result.success) {
      setShow(false)
    }
    setLoading(false)
  }

  const handleDismiss = () => {
    setShow(false)
    localStorage.setItem('goalflow_push_dismissed_at', Date.now().toString())
  }

  if (!show) return null

  return (
    <div className="fixed top-20 left-0 right-0 mx-auto max-w-2xl w-[calc(100%-2rem)] z-50 animate-in slide-in-from-top-4 fade-in">
      <div className="bg-violet-900/90 backdrop-blur-md border border-violet-500/30 rounded-xl shadow-lg p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-violet-600/30 flex items-center justify-center shrink-0">
            <Bell size={20} className="text-violet-200" />
          </div>
          <div>
            <h4 className="text-white font-medium text-sm sm:text-base leading-tight mb-1">
              Enable push notifications
            </h4>
            <p className="text-violet-200 text-xs sm:text-sm leading-tight">
              Get instant alerts for new tasks, deadlines, and team updates.
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleDismiss}
            className="hidden sm:block px-3 py-1.5 text-sm font-medium text-violet-200 hover:text-white transition-colors"
          >
            Not now
          </button>
          <button
            onClick={handleEnable}
            disabled={loading}
            className="px-4 py-1.5 bg-white text-violet-900 hover:bg-zinc-100 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {loading ? 'Enabling...' : 'Enable'}
          </button>
          <button
            onClick={handleDismiss}
            className="sm:hidden text-violet-300 hover:text-white ml-2"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}
