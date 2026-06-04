'use client'

import React, { useState, useMemo } from 'react'
import { PageHeader } from '@/components/shared/PageHeader'
import { RoleBadge } from '@/components/shared/RoleBadge'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { EmptyState } from '@/components/shared/EmptyState'
import { UserForm } from '@/components/admin/UserForm'
import { CsvImport } from '@/components/admin/CsvImport'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { useUsers, useUpdateUser } from '@/lib/queries/users'
import { Search, MoreVertical, Users, Plus, Upload, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useParams } from 'next/navigation'

export default function UsersManagementPage() {
  const routeParams = useParams()
  // Ensure workspace is correctly typed and defaults to admin
  const workspace = (routeParams?.workspace as string) || 'admin'
  const { data: users, isLoading, isError } = useUsers()
  const updateMutation = useUpdateUser()
  const supabase = createClient()

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isCsvOpen, setIsCsvOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    action: () => void;
    destructive: boolean;
  }>({
    isOpen: false,
    title: '',
    description: '',
    action: () => {},
    destructive: false,
  })

  // Client-side filtering
  const filteredUsers = useMemo(() => {
    if (!users) return []
    let result = users

    if (search) {
      const lowerSearch = search.toLowerCase()
      result = result.filter(u => 
        u.full_name.toLowerCase().includes(lowerSearch) || 
        u.email.toLowerCase().includes(lowerSearch)
      )
    }

    if (roleFilter !== 'all') {
      result = result.filter(u => u.role === roleFilter)
    }

    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active'
      result = result.filter(u => u.is_active === isActive)
    }

    return result
  }, [users, search, roleFilter, statusFilter])

  const handleEdit = (user: any) => {
    setEditingUser(user)
    setIsFormOpen(true)
  }

  const handleResetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) {
      toast.error('Failed to send reset link')
    } else {
      toast.success(`Password reset link sent to ${email}`)
    }
  }

  const handleToggleStatus = (user: any) => {
    if (user.is_active) {
      setConfirmDialog({
        isOpen: true,
        title: 'Deactivate Member',
        description: `Are you sure you want to deactivate ${user.full_name}? They will lose access immediately.`,
        destructive: true,
        action: () => {
          updateMutation.mutate({ id: user.id, data: { is_active: false } }, {
            onSuccess: () => toast.success('User deactivated'),
            onError: (err) => toast.error(err.message)
          })
          setConfirmDialog(prev => ({ ...prev, isOpen: false }))
        }
      })
    } else {
      updateMutation.mutate({ id: user.id, data: { is_active: true } }, {
        onSuccess: () => toast.success('User reactivated'),
        onError: (err) => toast.error(err.message)
      })
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Team Members</h1>
          <p className="text-neutral-400 mt-1">Manage your team's accounts</p>
        </div>
        <div className="flex items-center gap-3">
          {workspace === 'admin' && (
            <button
              onClick={() => setIsCsvOpen(true)}
              className="text-neutral-400 hover:text-white hover:bg-[#1a1a1a] h-9 px-3 rounded-lg transition-colors text-sm font-medium flex items-center gap-2 border border-[#2a2a2a] bg-[#111111]"
            >
              <Upload size={16} />
              Import CSV
            </button>
          )}
          <button
            onClick={() => { setEditingUser(null); setIsFormOpen(true) }}
            className="bg-indigo-600 hover:bg-indigo-500 text-white h-9 px-4 text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus size={16} />
            Add Member
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative w-full sm:w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={16} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg h-10 pl-9 pr-3 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="w-full sm:w-[160px] bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg h-10 px-3 text-sm text-white focus:border-indigo-500 outline-none appearance-none"
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
          <option value="employee">Employee</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-[160px] bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg h-10 px-3 text-sm text-white focus:border-indigo-500 outline-none appearance-none"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="border-b border-[#2a2a2a] bg-[#1a1a1a]">
              <th className="text-xs font-medium text-neutral-500 uppercase tracking-wide py-3 px-4 w-[30%]">Member</th>
              <th className="text-xs font-medium text-neutral-500 uppercase tracking-wide py-3 px-4">Role</th>
              <th className="text-xs font-medium text-neutral-500 uppercase tracking-wide py-3 px-4">Department</th>
              <th className="text-xs font-medium text-neutral-500 uppercase tracking-wide py-3 px-4">Status</th>
              <th className="text-xs font-medium text-neutral-500 uppercase tracking-wide py-3 px-4">Joined</th>
              <th className="text-xs font-medium text-neutral-500 uppercase tracking-wide py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              // Skeleton Rows
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-[#1a1a1a] last:border-0">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#1a1a1a] animate-pulse" />
                      <div className="space-y-2">
                        <div className="h-4 w-24 bg-[#1a1a1a] rounded animate-pulse" />
                        <div className="h-3 w-32 bg-[#1a1a1a] rounded animate-pulse" />
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4"><div className="h-6 w-16 bg-[#1a1a1a] rounded-md animate-pulse" /></td>
                  <td className="py-4 px-4"><div className="h-4 w-20 bg-[#1a1a1a] rounded animate-pulse" /></td>
                  <td className="py-4 px-4"><div className="h-4 w-16 bg-[#1a1a1a] rounded animate-pulse" /></td>
                  <td className="py-4 px-4"><div className="h-4 w-24 bg-[#1a1a1a] rounded animate-pulse" /></td>
                  <td className="py-4 px-4 flex justify-end"><div className="h-8 w-8 bg-[#1a1a1a] rounded animate-pulse" /></td>
                </tr>
              ))
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12">
                  <EmptyState 
                    icon={Users}
                    title="No team members found"
                    description="Try adjusting your filters or add a new member."
                  />
                </td>
              </tr>
            ) : (
              filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-[#1a1a1a] transition-colors border-b border-[#1a1a1a] last:border-0">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <UserAvatar user={user} className="w-8 h-8" />
                      <div>
                        <div className="text-sm text-white font-medium">{user.full_name}</div>
                        <div className="text-xs text-neutral-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <RoleBadge role={user.role} />
                  </td>
                  <td className="py-3 px-4 text-sm text-neutral-400">
                    {(user as any).department?.name || 'â€”'}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-1.5 h-1.5 rounded-full", user.is_active ? "bg-emerald-500" : "bg-neutral-500")} />
                      <span className={cn("text-sm", user.is_active ? "text-neutral-300" : "text-neutral-500")}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-neutral-500">
                    {format(new Date(user.created_at), 'MMM d, yyyy')}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="text-neutral-500 hover:text-white p-1 rounded transition-colors outline-none">
                        <MoreVertical size={18} />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => handleEdit(user)}>Edit Member</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleResetPassword(user.email)}>Reset Password</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {user.is_active ? (
                          <DropdownMenuItem onClick={() => handleToggleStatus(user)} className="text-rose-400 focus:text-rose-400 focus:bg-rose-500/10">
                            Deactivate
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleToggleStatus(user)}>
                            Reactivate
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <UserForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} user={editingUser} workspace={workspace} />
      <CsvImport isOpen={isCsvOpen} onClose={() => setIsCsvOpen(false)} />
      
      <ConfirmDialog
        open={confirmDialog.isOpen}
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, isOpen: open }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.action}
        confirmVariant={confirmDialog.destructive ? 'destructive' : 'default'}
      />
    </div>
  )
}
