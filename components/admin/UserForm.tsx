'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { CreateUserSchema, UpdateUserSchema } from '@/lib/validations/user.schemas'
import { useCreateUser, useUpdateUser } from '@/lib/queries/users'
import { useDepartments } from '@/lib/queries/departments'
import { UserRole } from '@/types'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// Merged schema for the form
const FormSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address').optional(),
  password: z.string().optional(),
  role: z.enum(['admin', 'manager', 'employee']),
  department_id: z.string().nullable().optional(),
})

interface UserFormProps {
  isOpen: boolean
  onClose: () => void
  user?: any // If provided, we are editing
}

export function UserForm({ isOpen, onClose, user }: UserFormProps) {
  const isEditing = !!user
  const [showPassword, setShowPassword] = useState(false)

  const { data: departments } = useDepartments()
  const createMutation = useCreateUser()
  const updateMutation = useUpdateUser()

  const { register, handleSubmit, formState: { errors }, watch, setValue, reset } = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      full_name: user?.full_name || '',
      email: user?.email || '',
      password: '',
      role: user?.role || 'employee',
      department_id: user?.department_id || null,
    },
  })

  // Reset form when user changes or sheet opens
  React.useEffect(() => {
    if (isOpen) {
      reset({
        full_name: user?.full_name || '',
        email: user?.email || '',
        password: '',
        role: user?.role || 'employee',
        department_id: user?.department_id || null,
      })
    }
  }, [isOpen, user, reset])

  const selectedRole = watch('role')

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    if (isEditing) {
      const updateData = {
        full_name: data.full_name,
        role: data.role,
        department_id: data.department_id || null
      }
      updateMutation.mutate({ id: user.id, data: updateData }, {
        onSuccess: () => {
          toast.success('User updated successfully')
          onClose()
        },
        onError: (err) => toast.error(err.message)
      })
    } else {
      const createData = {
        email: data.email!,
        full_name: data.full_name,
        password: data.password || undefined,
        role: data.role,
        department_id: data.department_id || null
      }
      createMutation.mutate(createData, {
        onSuccess: () => {
          toast.success('User created successfully')
          onClose()
        },
        onError: (err) => toast.error(err.message)
      })
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-[480px] bg-[#0a0a0a] border-l-[#2a2a2a] p-0 flex flex-col">
        <div className="p-6 pb-2">
          <SheetHeader>
            <SheetTitle className="text-white">{isEditing ? `Edit ${user?.full_name}` : 'Add Team Member'}</SheetTitle>
            <SheetDescription className="text-neutral-400">
              {isEditing ? 'Update the details for this member.' : 'Create a new account for your team.'}
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="flex-1 overflow-y-auto p-6 pt-2">
          <form id="user-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Full Name</label>
              <input
                {...register('full_name')}
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg h-10 px-3 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors"
                placeholder="Jane Doe"
              />
              {errors.full_name && <p className="text-xs text-rose-400 mt-1">{errors.full_name.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Email Address</label>
              <input
                {...register('email')}
                disabled={isEditing}
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg h-10 px-3 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="jane@example.com"
              />
              {errors.email && <p className="text-xs text-rose-400 mt-1">{errors.email.message}</p>}
            </div>

            {!isEditing && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Password</label>
                <div className="relative">
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg h-10 pl-3 pr-10 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors"
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-xs text-neutral-500">Must be at least 8 characters</p>
                {errors.password && <p className="text-xs text-rose-400 mt-1">{errors.password.message}</p>}
              </div>
            )}

            <div className="space-y-3">
              <label className="text-sm font-medium text-white">Role</label>
              <div className="space-y-2">
                {[
                  { id: 'admin', label: 'Admin', desc: 'Full system access, manages team' },
                  { id: 'manager', label: 'Manager', desc: 'Manages department tasks and goals' },
                  { id: 'employee', label: 'Employee', desc: 'Views and updates assigned work' },
                ].map((role) => (
                  <div
                    key={role.id}
                    onClick={() => setValue('role', role.id as any)}
                    className={cn(
                      "bg-[#0a0a0a] border rounded-lg p-3 cursor-pointer transition-colors",
                      selectedRole === role.id ? "border-indigo-500 bg-indigo-500/5" : "border-[#2a2a2a] hover:border-[#3a3a3a]"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn("w-4 h-4 rounded-full border flex items-center justify-center", selectedRole === role.id ? "border-indigo-500" : "border-neutral-600")}>
                        {selectedRole === role.id && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
                      </div>
                      <span className="text-sm font-medium text-white">{role.label}</span>
                    </div>
                    <p className="text-xs text-neutral-500 ml-6 mt-1">{role.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Department</label>
              <select
                {...register('department_id')}
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg h-10 px-3 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors appearance-none"
              >
                <option value="">No Department</option>
                {departments?.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
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
            form="user-form"
            type="submit"
            disabled={isPending}
            className="bg-indigo-600 hover:bg-indigo-500 text-white h-9 px-4 text-sm font-medium rounded-lg transition-colors flex items-center justify-center min-w-[120px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? <Loader2 size={16} className="animate-spin" /> : (isEditing ? 'Save Changes' : 'Create Member')}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
