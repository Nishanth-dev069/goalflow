'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
      <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
      {process.env.NODE_ENV === 'development' && (
        <p className="text-sm text-neutral-500 mb-6 max-w-md break-words">{error.message}</p>
      )}
      <div className="flex items-center gap-4">
        <button
          onClick={() => reset()}
          className="bg-[#1a1a1a] hover:bg-[#2a2a2a] border border-[#3a3a3a] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Try again
        </button>
        <Link 
          href="/dashboard"
          className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Go home
        </Link>
      </div>
    </div>
  )
}
