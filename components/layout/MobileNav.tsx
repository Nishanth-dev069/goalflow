'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Target, CheckSquare, History, Shield } from 'lucide-react'
import { User } from '@/types'
import { cn } from '@/lib/utils'

export function MobileNav({ user }: { user: User | null }) {
  const pathname = usePathname()
  
  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Goals', href: '/goals', icon: Target },
    { name: 'Tasks', href: '/tasks', icon: CheckSquare },
    { name: 'History', href: '/history', icon: History },
  ]

  if (user?.role === 'admin' || user?.role === 'manager') {
    navItems.push({ name: 'Admin', href: '/admin', icon: Shield })
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#111111]/95 backdrop-blur-md border-t border-[#2a2a2a] z-50 flex items-center justify-around px-2 pb-safe">
      {navItems.map(item => {
        const isActive = pathname.startsWith(item.href)
        return (
          <Link 
            key={item.href} 
            href={item.href}
            className="flex flex-col items-center justify-center w-full h-full gap-1"
          >
            <item.icon size={20} className={cn("transition-colors", isActive ? "text-indigo-400" : "text-neutral-500")} />
            <span className={cn("text-[10px] font-medium transition-colors", isActive ? "text-indigo-400" : "text-neutral-500")}>
              {item.name}
            </span>
          </Link>
        )
      })}
    </div>
  )
}
