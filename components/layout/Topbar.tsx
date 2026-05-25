'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Menu, Search, LogOut } from 'lucide-react'
import { User } from '@/types'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'
import { NotificationBell } from '@/components/notifications/NotificationBell'

interface TopbarProps {
  user: User | null
  onMenuToggle: () => void
  onSearchToggle: () => void
}

const getPageTitle = (pathname: string) => {
  if (pathname.startsWith('/admin/users')) return 'Team Members'
  if (pathname.startsWith('/admin/departments')) return 'Departments'
  if (pathname.startsWith('/admin/goals')) return 'Goals (Admin)'
  if (pathname.startsWith('/admin/tasks')) return 'Tasks (Admin)'
  if (pathname.startsWith('/admin/analytics')) return 'Analytics'
  if (pathname.startsWith('/admin')) return 'Admin Overview'
  
  if (pathname.startsWith('/dashboard')) return 'Dashboard'
  if (pathname.startsWith('/goals')) {
    if (pathname !== '/goals') return 'Goal Detail'
    return 'Goals'
  }
  if (pathname.startsWith('/tasks')) {
    if (pathname !== '/tasks') return 'Task Detail'
    return 'Tasks'
  }
  if (pathname.startsWith('/history')) return 'History'
  
  return 'GoalFlow'
}

export function Topbar({ user, onMenuToggle, onSearchToggle }: TopbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const title = getPageTitle(pathname)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="flex items-center justify-between h-12 px-4 sm:px-6 bg-[#111111] border-b border-[#2a2a2a] z-20">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="md:hidden text-neutral-400 hover:text-white transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-sm font-semibold text-white">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <button 
          onClick={onSearchToggle}
          className="hidden md:flex items-center gap-2 h-8 px-3 rounded-md bg-[#1a1a1a] border border-[#2a2a2a] text-xs text-neutral-500 hover:border-[#3a3a3a] transition-colors"
        >
          <Search size={12} /> Search{' '}
          <kbd className="ml-2 text-[10px] bg-[#2a2a2a] px-1.5 py-0.5 rounded">⌘K</kbd>
        </button>

        {user && <NotificationBell userId={user.id} />}

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg hover:bg-[#1a1a1a] p-1.5 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
            <UserAvatar user={user} size="sm" />
            <span className="hidden md:block text-xs text-neutral-300 max-w-[120px] truncate">
              {user?.full_name ?? 'User'}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={8}
            className="w-56 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-1 shadow-2xl shadow-black/50"
          >
            <DropdownMenuLabel className="px-3 py-2">
              <p className="text-sm font-medium text-white truncate">{user?.full_name ?? 'User'}</p>
              <p className="text-xs text-neutral-500 truncate mt-0.5">{user?.email ?? ''}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-[#2a2a2a] mx-1" />
            <DropdownMenuItem
              onSelect={handleSignOut}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer transition-colors"
            >
              <LogOut size={14} />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
