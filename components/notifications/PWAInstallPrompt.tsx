'use client'

import { useState, useEffect } from 'react'
import { Download, X, Share } from 'lucide-react'
import Image from 'next/image'

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(true) // default true to avoid flash

  useEffect(() => {
    // Check if already in standalone mode
    const checkStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                          (window.navigator as any).standalone === true
    setIsStandalone(checkStandalone)

    if (checkStandalone) return

    // Check device type
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent) && !(window as any).MSStream
    setIsIOS(isIOSDevice)

    // Check if dismissed recently (3 days = 259200000ms)
    const dismissedAt = localStorage.getItem('goalflow_pwa_dismissed_at')
    if (dismissedAt && Date.now() - parseInt(dismissedAt, 10) < 259200000) {
      return
    }

    // iOS doesn't fire beforeinstallprompt
    if (isIOSDevice) {
      const timer = setTimeout(() => setShowPrompt(true), 2000)
      return () => clearTimeout(timer)
    }

    // Android/Desktop flow
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setTimeout(() => setShowPrompt(true), 2000)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      setShowPrompt(false)
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('goalflow_pwa_dismissed_at', Date.now().toString())
  }

  if (isStandalone || !showPrompt) return null

  return (
    <div 
      className="fixed bottom-4 left-0 right-0 sm:left-auto sm:right-4 z-[9999] 
                 max-w-sm w-[calc(100%-2rem)] mx-auto sm:mx-0
                 bg-zinc-900 border border-zinc-700/50 rounded-2xl 
                 shadow-2xl shadow-black/50 p-5
                 transition-all duration-300 ease-out animate-in slide-in-from-bottom-4 fade-in"
    >
      <button 
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-zinc-500 hover:text-white transition-colors"
        aria-label="Dismiss"
      >
        <X size={18} />
      </button>

      <div className="flex items-start gap-4 mb-4 mt-1">
        <div className="w-12 h-12 rounded-xl bg-zinc-800 shrink-0 overflow-hidden relative">
          <Image src="/icons/icon-96x96.png" alt="GoalFlow Logo" fill className="object-cover" />
        </div>
        <div>
          <h3 className="font-semibold text-white text-lg leading-tight">Install GoalFlow</h3>
          <p className="text-zinc-400 text-sm mt-1">
            Get the full app experience — faster, offline-ready, no browser UI
          </p>
        </div>
      </div>

      {!isIOS ? (
        <div className="flex flex-col gap-2">
          <button 
            onClick={handleInstall}
            className="w-full bg-gradient-to-r from-violet-600 to-purple-600 
                       hover:from-violet-500 hover:to-purple-500
                       text-white font-medium rounded-xl py-3 
                       flex items-center justify-center gap-2
                       transition-all active:scale-[0.98]"
          >
            <Download size={18} />
            Install App
          </button>
          <p className="text-xs text-zinc-500 text-center">
            Free • No account required to install
          </p>
        </div>
      ) : (
        <div className="bg-zinc-800 rounded-xl p-3 text-sm text-zinc-300 flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <span className="w-5 h-5 rounded-full bg-violet-600 text-white flex items-center justify-center text-xs font-bold shrink-0">1</span>
            <p className="flex items-center gap-1">Tap the Share button <Share size={14} className="text-blue-500" /> in Safari</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-5 h-5 rounded-full bg-violet-600 text-white flex items-center justify-center text-xs font-bold shrink-0">2</span>
            <p>Scroll down and tap <strong>"Add to Home Screen"</strong></p>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-5 h-5 rounded-full bg-violet-600 text-white flex items-center justify-center text-xs font-bold shrink-0">3</span>
            <p>Tap <strong>"Add"</strong> to confirm</p>
          </div>
        </div>
      )}
    </div>
  )
}
