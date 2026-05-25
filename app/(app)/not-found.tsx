import { Compass } from 'lucide-react'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <Compass className="w-12 h-12 text-neutral-500 mb-4" />
      <h2 className="text-xl font-bold text-white mb-2">Page not found</h2>
      <p className="text-sm text-neutral-500 mb-6 max-w-md">
        We couldn't find the page you were looking for.
      </p>
      <Link 
        href="/dashboard"
        className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
      >
        Return to Dashboard
      </Link>
    </div>
  )
}
