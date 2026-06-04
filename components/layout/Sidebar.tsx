'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Target,
  CheckSquare,
  Clock,
  LayoutGrid,
  Users,
  Building2,
  Flag,
  ListTodo,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Activity,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { User } from '@/types'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { createClient } from '@/lib/supabase/client'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface SidebarProps {
  user: User | null
  isOpen: boolean
  onToggle: () => void
}

const mainNavItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/goals', icon: Target, label: 'Goals', hideForAdminAndManager: true },
  { href: '/tasks', icon: CheckSquare, label: 'Tasks', hideForAdminAndManager: true },
  { href: '/history', icon: Clock, label: 'History' },
]

// Removed adminNavItems from module scope

export function Sidebar({ user, isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const role = user?.role || 'employee'
  const isAdmin = role === 'admin'
  const isManager = role === 'manager'
  const showAdminNav = isAdmin || isManager

  const workspacePath = isManager ? '/manager' : '/admin'
  
  const allWorkspaceNavItems = [
    { href: workspacePath, icon: LayoutGrid, label: 'Overview' },
    { href: `${workspacePath}/goals`, icon: Flag, label: 'Manage Goals' },
    { href: `${workspacePath}/tasks`, icon: ListTodo, label: 'Manage Tasks' },
    { href: `${workspacePath}/attendance`, icon: Clock, label: 'Attendance' },
    { href: `${workspacePath}/users`, icon: Users, label: 'Team' },
    { href: `${workspacePath}/workload`, icon: Activity, label: 'Workload' },
    { href: `${workspacePath}/analytics`, icon: BarChart3, label: 'Analytics' },
    { href: `${workspacePath}/departments`, icon: Building2, label: 'Departments' },
  ]

  const sectionLabel = isAdmin ? 'ADMIN' : isManager ? 'MANAGER' : null
  
  const filteredWorkspaceNavItems = isManager
    ? allWorkspaceNavItems.filter(item => !item.href.includes('/departments'))
    : allWorkspaceNavItems

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const NavItem = ({ href, icon: Icon, label }: { href: string; icon: any; label: string }) => {
    const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
    const content = (
      <Link
        href={href}
        onMouseEnter={() => router.prefetch(href)}
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer w-full',
          isActive
            ? 'text-white bg-[#1a1a1a] font-medium'
            : 'text-neutral-400 hover:text-white hover:bg-[#1a1a1a]',
          !isOpen && 'justify-center px-0'
        )}
      >
        <Icon className="w-4 h-4 shrink-0" />
        {isOpen && <span>{label}</span>}
      </Link>
    )

    if (isOpen) return content

    return (
      <TooltipProvider delay={0}>
        <Tooltip>
          <TooltipTrigger>{content}</TooltipTrigger>
          <TooltipContent side="right" className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
            {label}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-30 md:hidden" 
          onClick={onToggle}
        />
      )}
      <div
        className={cn(
          'flex flex-col h-[100dvh] fixed left-0 top-0 z-40 bg-black/40 backdrop-blur-2xl border-r border-[#1a1a1a] shadow-[inset_-1px_0_0_0_rgba(255,255,255,0.02)] transition-all duration-200 ease-in-out',
          isOpen ? 'w-[240px] translate-x-0' : 'w-[60px] -translate-x-full md:translate-x-0'
        )}
      >
      <div className="flex items-center justify-between px-4 py-4 border-b border-[#1a1a1a] h-12">
        {isOpen && (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-xs tracking-tighter">GF</span>
              </div>
              <span className="text-sm font-bold text-white tracking-tight">GoalFlow</span>
            </div>
        )}
        <button
          onClick={onToggle}
          className={cn(
            'text-neutral-400 hover:text-white transition-colors',
            !isOpen && 'mx-auto'
          )}
        >
          {isOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {mainNavItems.map((item: any) => {
          if (showAdminNav && item.hideForAdminAndManager) return null
          return <NavItem key={item.href} {...item} />
        })}

        {showAdminNav && (
          <div className="mt-6">
            {isOpen && sectionLabel && (
              <h4 className="text-[10px] font-semibold text-neutral-600 uppercase tracking-widest px-4 mb-2">
                {sectionLabel}
              </h4>
            )}
            <div className="space-y-1 mt-2">
              {filteredWorkspaceNavItems.map((item) => (
                <NavItem key={item.href} {...item} />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-[#2a2a2a]">
        <div
          className={cn(
            'flex items-center',
            isOpen ? 'gap-3 px-2 py-2' : 'justify-center'
          )}
        >
          <UserAvatar user={user} size="sm" className="shrink-0" />
          {isOpen && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm text-white font-medium truncate">
                {user?.full_name ?? 'User'}
              </span>
              <div className="mt-1">
                <span
                  className={cn(
                    'text-[10px] uppercase px-1.5 py-0.5 rounded font-medium',
                    user?.role === 'admin' && 'bg-indigo-500/20 text-indigo-400',
                    user?.role === 'manager' && 'bg-amber-500/20 text-amber-400',
                    user?.role === 'employee' && 'bg-neutral-800 text-neutral-400'
                  )}
                >
                  {user?.role ?? 'employee'}
                </span>
              </div>
            </div>
          )}
        </div>
        <button
          onClick={handleSignOut}
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-colors mt-1',
            'text-neutral-600 hover:text-red-400 hover:bg-red-500/5',
            !isOpen && 'justify-center'
          )}
          title="Sign out"
        >
          <LogOut size={16} />
          {isOpen && <span>Sign out</span>}
        </button>
      </div>
      </div>
    </>
  )
}
