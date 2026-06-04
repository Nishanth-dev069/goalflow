'use client'

import { ReactNode, useState, useEffect } from 'react'
import { User } from '@/types'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { useAppStore } from '@/store/useAppStore'
import { cn } from '@/lib/utils'
import { useCommandSearch } from '@/hooks/useCommandSearch'
import { CommandSearch } from '@/components/shared/CommandSearch'

import { MobileNav } from './MobileNav'
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
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            {children}
          </div>
        </main>
      </div>
      <CommandSearch {...search} />
      <MobileNav user={user} />
    </div>
  )
}
