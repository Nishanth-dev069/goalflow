import React from 'react'
import Link from 'next/link'
import { CheckSquare } from 'lucide-react'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <CheckSquare className="text-indigo-500 w-6 h-6" />
            <span className="font-bold text-lg tracking-tight">GoalFlow</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-sm font-medium text-neutral-400 hover:text-white transition-colors">Features</Link>
            <Link href="/pricing" className="text-sm font-medium text-neutral-400 hover:text-white transition-colors">Pricing</Link>
            <Link href="/login" className="text-sm font-medium text-white hover:text-indigo-400 transition-colors">Log in</Link>
            <Link href="/login" className="bg-white text-black px-4 py-2 rounded-full text-sm font-semibold hover:bg-neutral-200 transition-colors">
              Get Started
            </Link>
          </nav>
        </div>
      </header>
      
      <main className="flex-1">
        {children}
      </main>
      
      <footer className="border-t border-white/10 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <CheckSquare className="text-indigo-500 w-5 h-5" />
            <span className="font-bold tracking-tight">GoalFlow</span>
          </div>
          <p className="text-neutral-500 text-sm">
            Made with ❤️ in India
          </p>
        </div>
      </footer>
    </div>
  )
}
