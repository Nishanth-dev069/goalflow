'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Search, ChevronDown, Check } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { useCreateDepartment, useUpdateDepartment } from '@/lib/queries/departments'
import { useUsers } from '@/lib/queries/users'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { RoleBadge } from '@/components/shared/RoleBadge'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const FormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  manager_id: z.string().nullable().optional(),
})

interface DepartmentFormProps {
  isOpen: boolean
  onClose: () => void
  department?: any
}

export function DepartmentForm({ isOpen, onClose, department }: DepartmentFormProps) {
  const isEditing = !!department
  
  const createMutation = useCreateDepartment()
  const updateMutation = useUpdateDepartment()
  const { data: users } = useUsers()

  const { register, handleSubmit, formState: { errors }, watch, setValue, reset } = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: department?.name || '',
      description: department?.description || '',
      manager_id: department?.manager_id || null,
    },
  })

  useEffect(() => {
    if (isOpen) {
      reset({
        name: department?.name || '',
        description: department?.description || '',
        manager_id: department?.manager_id || null,
      })
    }
  }, [isOpen, department, reset])

  const selectedManagerId = watch('manager_id')
  
  // Custom Searchable Select State
  const [isSelectOpen, setIsSelectOpen] = useState(false)
  const [search, setSearch] = useState('')
  const selectRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(e.target as Node)) {
        setIsSelectOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const eligibleManagers = (users || []).filter(u => u.role === 'admin' || u.role === 'manager')
  const filteredManagers = eligibleManagers.filter(u => u.full_name.toLowerCase().includes(search.toLowerCase()))
  const selectedManager = eligibleManagers.find(u => u.id === selectedManagerId)

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    if (isEditing) {
      updateMutation.mutate({ id: department.id, data }, {
        onSuccess: () => {
          toast.success('Department updated')
          onClose()
        },
        onError: (err) => toast.error(err.message)
      })
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          toast.success('Department created')
          onClose()
        },
        onError: (err) => toast.error(err.message)
      })
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-[400px] bg-[#0a0a0a] border-l-[#2a2a2a] p-0 flex flex-col">
        <div className="p-6 pb-2">
          <SheetHeader>
            <SheetTitle className="text-white">{isEditing ? 'Edit Department' : 'Add Department'}</SheetTitle>
            <SheetDescription className="text-neutral-400">
              {isEditing ? 'Update department details.' : 'Create a new department for your team.'}
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="flex-1 overflow-y-auto p-6 pt-2">
          <form id="dept-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Name</label>
              <input
                {...register('name')}
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg h-10 px-3 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors"
                placeholder="e.g. Engineering"
              />
              {errors.name && <p className="text-xs text-rose-400 mt-1">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Description</label>
              <textarea
                {...register('description')}
                rows={3}
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-3 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors resize-none"
                placeholder="Optional description"
              />
            </div>

            <div className="space-y-2" ref={selectRef}>
              <label className="text-sm font-medium text-white">Manager</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsSelectOpen(!isSelectOpen)}
                  className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg h-12 px-3 flex items-center justify-between text-left focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors"
                >
                  {selectedManager ? (
                    <div className="flex items-center gap-3">
                      <UserAvatar user={selectedManager} className="w-6 h-6" />
                      <div>
                        <div className="text-sm text-white font-medium">{selectedManager.full_name}</div>
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-neutral-500">Select a manager...</span>
                  )}
                  <ChevronDown size={16} className="text-neutral-500" />
                </button>

                {isSelectOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[#111111] border border-[#2a2a2a] rounded-lg shadow-xl z-50 overflow-hidden">
                    <div className="p-2 border-b border-[#2a2a2a]">
                      <div className="relative">
                        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                        <input
                          type="text"
                          value={search}
                          onChange={e => setSearch(e.target.value)}
                          placeholder="Search managers..."
                          className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-md h-8 pl-8 pr-2 text-xs text-white outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                    <div className="max-h-[240px] overflow-y-auto p-1">
                      <div
                        onClick={() => { setValue('manager_id', null); setIsSelectOpen(false) }}
                        className={cn(
                          "flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-[#1a1a1a] transition-colors",
                          !selectedManagerId && "bg-indigo-500/10"
                        )}
                      >
                        <span className="text-sm text-white pl-9">No Manager</span>
                        {!selectedManagerId && <Check size={14} className="text-indigo-400" />}
                      </div>
                      
                      {filteredManagers.map(user => (
                        <div
                          key={user.id}
                          onClick={() => { setValue('manager_id', user.id); setIsSelectOpen(false) }}
                          className={cn(
                            "flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-[#1a1a1a] transition-colors mt-1",
                            selectedManagerId === user.id && "bg-indigo-500/10"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <UserAvatar user={user} className="w-6 h-6" />
                            <div>
                              <div className="text-sm text-white font-medium">{user.full_name}</div>
                            </div>
                            <RoleBadge role={user.role} className="scale-75 origin-left" />
                          </div>
                          {selectedManagerId === user.id && <Check size={14} className="text-indigo-400" />}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

          </form>
        </div>

        <div className="p-6 border-t border-[#1a1a1a] flex justify-end gap-3 bg-[#0a0a0a]">
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-white hover:bg-[#1a1a1a] h-9 px-3 rounded-lg transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            form="dept-form"
            type="submit"
            disabled={isPending}
            className="bg-indigo-600 hover:bg-indigo-500 text-white h-9 px-4 text-sm font-medium rounded-lg transition-colors flex items-center justify-center min-w-[120px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? <Loader2 size={16} className="animate-spin" /> : (isEditing ? 'Save Changes' : 'Create Department')}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
