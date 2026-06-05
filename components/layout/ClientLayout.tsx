'use client'

import { ReactNode, useState, useEffect } from 'react'
import { User } from '@/types'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { useAppStore } from '@/store/useAppStore'
import { cn } from '@/lib/utils'
import { useCommandSearch } from '@/hooks/useCommandSearch'
import { CommandSearch } from '@/components/shared/CommandSearch'

import { MobileNav } from './BottomNav'
import { PushNotificationPrompt } from '@/components/notifications/PushNotificationPrompt'
import { PWAInstallPrompt } from '@/components/notifications/PWAInstallPrompt'

interface ClientLayoutProps {
  children: ReactNode
  user: User | null
}

export function ClientLayout({ children, user }: ClientLayoutProps) {
  const { sidebarOpen, toggleSidebar } = useAppStore()
  const search = useCommandSearch()
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  // Force default state for SSR / initial hydration to match server output exactly
  const isSidebarOpen = mounted ? sidebarOpen : true

  return (
    <div className="flex h-[100dvh] bg-[#0a0a0a] overflow-hidden">
      <Sidebar user={user} isOpen={isSidebarOpen} onToggle={toggleSidebar} />
      <div 
        className={cn(
          "flex flex-col flex-1 min-w-0 overflow-hidden transition-all duration-200 ease-in-out pb-16 md:pb-0",
          isSidebarOpen ? "md:ml-[240px]" : "md:ml-[60px]"
        )}
      >
        <Topbar user={user} onMenuToggle={toggleSidebar} onSearchToggle={() => search.setOpen(true)} />
        <PWAInstallPrompt />
        <PushNotificationPrompt />
        <main className="flex-1 overflow-y-auto flex flex-col">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
            {children}
          </div>
          <footer className="w-full py-8 mt-auto border-t border-[#1a1a1a]">
            <div className="flex flex-col items-center justify-center gap-1">
              <span className="text-[10px] text-neutral-500 font-medium tracking-wide uppercase">Developed by</span>
              <a href="https://zyxen.in" target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-white tracking-widest hover:text-indigo-400 transition-colors">
                ZYXEN
              </a>
              <span className="text-[10px] text-neutral-500 font-medium mt-1">
                Made with <span className="text-red-500">❤️</span> in India
              </span>
            </div>
          </footer>
        </main>
      </div>
      <CommandSearch {...search} />
      <MobileNav user={user} />
    </div>
  )
}
