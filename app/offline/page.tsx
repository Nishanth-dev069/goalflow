'use client'

import { WifiOff } from 'lucide-react'
import Image from 'next/image'

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl">
        <div className="w-20 h-20 rounded-2xl bg-zinc-800 mx-auto mb-8 relative overflow-hidden flex items-center justify-center">
          <Image src="/icons/icon-192x192.png" alt="GoalFlow Logo" fill className="object-cover" />
        </div>
        
        <div className="mb-6 flex justify-center">
          <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center text-zinc-400">
            <WifiOff size={32} />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white mb-3">You're offline</h1>
        
        <p className="text-zinc-400 mb-8">
          Check your connection and try again. GoalFlow needs an active internet connection to sync your data.
        </p>

        <button
          onClick={() => window.location.reload()}
          className="w-full bg-white text-black hover:bg-zinc-200 font-medium h-12 rounded-xl transition-colors active:scale-[0.98]"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}
