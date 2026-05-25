'use client'

import { ReactNode } from 'react'
import { User } from '@/types'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { useAppStore } from '@/store/useAppStore'
import { cn } from '@/lib/utils'
import { useCommandSearch } from '@/hooks/useCommandSearch'
import { CommandSearch } from '@/components/shared/CommandSearch'

import { MobileNav } from './MobileNav'

interface ClientLayoutProps {
  children: ReactNode
  user: User | null
}

export function ClientLayout({ children, user }: ClientLayoutProps) {
  const { sidebarOpen, toggleSidebar } = useAppStore()
  const search = useCommandSearch()

  return (
    <div className="flex h-[100dvh] bg-[#0a0a0a] overflow-hidden">
      <Sidebar user={user} isOpen={sidebarOpen} onToggle={toggleSidebar} />
      <div 
        className={cn(
          "flex flex-col flex-1 min-w-0 overflow-hidden transition-all duration-200 ease-in-out pb-16 md:pb-0",
          sidebarOpen ? "md:ml-[240px]" : "md:ml-[60px]"
        )}
      >
        <Topbar user={user} onMenuToggle={toggleSidebar} onSearchToggle={() => search.setOpen(true)} />
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
