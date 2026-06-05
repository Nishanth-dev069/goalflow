'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/shared/PageHeader'
import { DepartmentForm } from '@/components/admin/DepartmentForm'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { EmptyState } from '@/components/shared/EmptyState'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { useDepartments, useUpdateDepartment, DepartmentWithStats } from '@/lib/queries/departments'
import { Plus, Building2, Users as UsersIcon, CheckSquare } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { BackButton } from '@/components/shared/BackButton'

export default function DepartmentsManagementPage({ params }: { params: { workspace: string } }) {
  const workspace = params.workspace || 'admin'
  const router = useRouter()

  useEffect(() => {
    if (workspace !== 'admin') {
      router.push('/dashboard')
    }
  }, [workspace, router])

  const { data: departments, isLoading } = useDepartments()
  const updateMutation = useUpdateDepartment()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingDept, setEditingDept] = useState<DepartmentWithStats | null>(null)

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

  const handleEdit = (dept: DepartmentWithStats) => {
    setEditingDept(dept)
    setIsFormOpen(true)
  }

  const handleToggleStatus = (dept: DepartmentWithStats) => {
    if (dept.is_active) {
      setConfirmDialog({
        isOpen: true,
        title: 'Deactivate Department',
        description: `Are you sure you want to deactivate ${dept.name}? Users in this department will still have accounts, but they will not be associated with a department.`,
        destructive: true,
        action: () => {
          updateMutation.mutate({ id: dept.id, data: { is_active: false } }, {
            onSuccess: () => toast.success('Department deactivated'),
            onError: (err) => toast.error(err.message)
          })
          setConfirmDialog(prev => ({ ...prev, isOpen: false }))
        }
      })
    } else {
      updateMutation.mutate({ id: dept.id, data: { is_active: true } }, {
        onSuccess: () => toast.success('Department reactivated'),
        onError: (err) => toast.error(err.message)
      })
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <BackButton />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Departments</h1>
          <p className="text-neutral-400 mt-1">Organize your team into departments</p>
        </div>
        {workspace === 'admin' && (
          <button
            onClick={() => { setEditingDept(null); setIsFormOpen(true) }}
            className="bg-indigo-600 hover:bg-indigo-500 text-white h-9 px-4 text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus size={16} />
            Add Department
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-5 h-48 animate-pulse" />
          ))}
        </div>
      ) : (departments || []).length === 0 ? (
        <EmptyState 
          icon={Building2}
          title="No departments found"
          description="Create your first department to start organizing your team."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments?.map(dept => (
            <div key={dept.id} className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-5 hover:border-[#3a3a3a] transition-colors flex flex-col">
              <div className="flex justify-between items-start">
                <h3 className="text-base font-semibold text-white">{dept.name}</h3>
                <div className="flex items-center gap-1.5">
                  <div className={cn("w-1.5 h-1.5 rounded-full", dept.is_active ? "bg-emerald-500" : "bg-neutral-500")} />
                  <span className={cn("text-xs font-medium", dept.is_active ? "text-neutral-300" : "text-neutral-500")}>
                    {dept.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              
              <p className="text-sm text-neutral-400 mt-1 mb-4 line-clamp-2 min-h-[40px]">
                {dept.description || 'No description provided.'}
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                <div className="bg-[#1a1a1a] rounded-lg px-3 py-2 text-center flex flex-col items-center justify-center">
                  <span className="text-lg font-bold text-white">{dept.member_count || 0}</span>
                  <div className="flex items-center gap-1 text-xs text-neutral-500 mt-0.5">
                    <UsersIcon size={12} /> Members
                  </div>
                </div>
                <div className="bg-[#1a1a1a] rounded-lg px-3 py-2 text-center flex flex-col items-center justify-center">
                  <span className="text-lg font-bold text-white">{/* Replace with actual active tasks count from API if provided */}0</span>
                  <div className="flex items-center gap-1 text-xs text-neutral-500 mt-0.5">
                    <CheckSquare size={12} /> Active Tasks
                  </div>
                </div>
              </div>

              <div className="mb-4 flex-1">
                <div className="text-xs text-neutral-500 mb-2">Manager:</div>
                {dept.manager ? (
                  <div className="flex items-center gap-2">
                    <UserAvatar user={dept.manager as any} className="w-5 h-5" />
                    <span className="text-xs text-white font-medium">{dept.manager.full_name}</span>
                  </div>
                ) : (
                  <div className="text-xs text-neutral-600 italic">No manager assigned</div>
                )}
              </div>

              <div className="pt-4 border-t border-[#1a1a1a] flex items-center justify-between gap-2 mt-auto">
                <div className="flex items-center gap-2">
                  {workspace === 'admin' && (
                    <button 
                      onClick={() => handleEdit(dept)}
                      className="text-neutral-400 hover:text-white hover:bg-[#1a1a1a] h-8 px-3 rounded-lg transition-colors text-xs font-medium"
                    >
                      Edit
                    </button>
                  )}
                  <button 
                    className="text-neutral-400 hover:text-white hover:bg-[#1a1a1a] h-8 px-3 rounded-lg transition-colors text-xs font-medium"
                  >
                    View Members
                  </button>
                </div>
                {workspace === 'admin' && (
                  dept.is_active ? (
                    <button 
                      onClick={() => handleToggleStatus(dept)}
                      className="text-rose-400 hover:bg-rose-500/10 h-8 px-3 rounded-lg transition-colors text-xs font-medium"
                    >
                      Deactivate
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleToggleStatus(dept)}
                      className="text-indigo-400 hover:bg-indigo-500/10 h-8 px-3 rounded-lg transition-colors text-xs font-medium"
                    >
                      Reactivate
                    </button>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <DepartmentForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} department={editingDept} />

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
