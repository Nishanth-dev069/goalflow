'use client'

import React, { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Clock, Calendar, CalendarRange, Target, Building2, Users, User as UserIcon, Loader2 } from 'lucide-react'
import { useCreateGoal } from '@/lib/queries/goals'
import { useUsers } from '@/lib/queries/users'
import { useDepartments } from '@/lib/queries/departments'
import { CreateGoalSchema } from '@/lib/validations/goal.schemas'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { TypeBadge } from '@/components/shared/TypeBadge'
import { ScopeBadge } from '@/components/shared/ScopeBadge'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { format, addDays, addMonths, addYears, endOfWeek, endOfMonth, endOfQuarter, endOfYear, parseISO } from 'date-fns'
import { BackButton } from '@/components/shared/BackButton'

// Shadcn Calendar/Popover placeholders. For actual impl, we would import Shadcn Calendar, but using standard inputs for speed and simplicity.
// In a full environment with Shadcn UI installed, we'd do:
// import { Calendar } from '@/components/ui/calendar'
// import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export default function CreateGoalPage() {
  const router = useRouter()
  const params = useParams<{ workspace: string }>()
  const workspace = params.workspace || 'admin'
  const createMutation = useCreateGoal()
  const { data: users } = useUsers()
  const { data: departments } = useDepartments()

  const [isTrackProgress, setIsTrackProgress] = useState(false)

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<z.infer<typeof CreateGoalSchema>>({
    resolver: zodResolver(CreateGoalSchema) as any,
    defaultValues: {
      status: 'active',
      scope: 'personal',
      type: 'monthly',
      start_date: format(new Date(), 'yyyy-MM-dd'),
      end_date: format(addMonths(new Date(), 1), 'yyyy-MM-dd'),
    } as any
  })

  const formValues = watch()

  const onSubmit = async (data: z.infer<typeof CreateGoalSchema>) => {
    // Clean up unneeded fields based on scope
    if (data.scope !== 'personal') data.assigned_to_user_id = null
    if (data.scope !== 'department') data.assigned_to_dept_id = null
    if (!isTrackProgress) data.target_value = null

    createMutation.mutate(data, {
      onSuccess: () => {
        toast.success('Goal created successfully')
        router.push(`/${workspace}/goals`)
      },
      onError: (err) => {
        toast.error(err.message)
      }
    })
  }

  const setQuickDate = (preset: string) => {
    const today = new Date()
    setValue('start_date', format(today, 'yyyy-MM-dd'))
    
    let end = today
    if (preset === 'This Week') end = endOfWeek(today)
    if (preset === 'This Month') end = endOfMonth(today)
    if (preset === 'This Quarter') end = endOfQuarter(today)
    if (preset === 'This Year') end = endOfYear(today)
    if (preset === '90 Days') end = addDays(today, 90)

    setValue('end_date', format(end, 'yyyy-MM-dd'))
  }

  // Live preview helpers
  const selectedUser = users?.find(u => u.id === formValues.assigned_to_user_id)
  const selectedDept = departments?.find(d => d.id === formValues.assigned_to_dept_id)

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto min-h-screen pb-32">
      <BackButton />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">Create Goal</h1>
        <p className="text-neutral-400 mt-1">Define a new objective and set its tracking parameters.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Main Form Area */}
        <form id="goal-form" onSubmit={handleSubmit(onSubmit)} className="w-full lg:w-[65%] bg-[#111111] border border-[#2a2a2a] rounded-xl overflow-hidden">
          
          {/* SECTION 1 - Basics */}
          <div className="p-8 border-b border-[#2a2a2a]">
            <input
              {...register('title')}
              placeholder="Goal title..."
              className="w-full bg-transparent text-2xl font-semibold text-white placeholder-neutral-700 outline-none border-b border-[#2a2a2a] pb-4 focus:border-indigo-500 transition-colors"
            />
            {errors.title && <p className="text-rose-400 text-xs mt-2">{errors.title.message}</p>}
            
            <textarea
              {...register('description')}
              placeholder="Add more context (optional)..."
              rows={3}
              className="w-full bg-transparent text-sm text-neutral-300 placeholder-neutral-600 outline-none resize-none mt-4"
            />
          </div>

          {/* SECTION 2 - Goal Type */}
          <div className="p-8 border-b border-[#2a2a2a]">
            <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-4">Goal Type</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { id: 'daily', icon: Clock, label: 'Daily', desc: '1-day task focus' },
                { id: 'weekly', icon: Clock, label: 'Weekly', desc: '7-day sprint target' },
                { id: 'monthly', icon: Calendar, label: 'Monthly', desc: '30-day milestone' },
                { id: 'yearly', icon: CalendarRange, label: 'Yearly', desc: 'Annual objective' },
                { id: 'long_term', icon: Target, label: 'Long-term', desc: 'Custom timeframe' },
              ].map(type => {
                const isSelected = formValues.type === type.id
                return (
                  <div
                    key={type.id}
                    onClick={() => setValue('type', type.id as any)}
                    className={cn(
                      "border rounded-xl p-4 cursor-pointer transition-all flex flex-col gap-2",
                      isSelected 
                        ? "border-indigo-500 bg-indigo-500/5" 
                        : "border-[#2a2a2a] bg-transparent hover:border-[#3a3a3a] hover:bg-[#1a1a1a]"
                    )}
                  >
                    <type.icon size={24} className={isSelected ? "text-indigo-400" : "text-neutral-600"} />
                    <div>
                      <div className="text-sm font-medium text-white">{type.label}</div>
                      <div className="text-xs text-neutral-500 mt-0.5">{type.desc}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* SECTION 3 - Scope & Assignment */}
          <div className="p-8 border-b border-[#2a2a2a]">
            <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-4">Who is this for?</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              {[
                { id: 'company', icon: Building2, label: 'Company', desc: 'Visible to all' },
                { id: 'department', icon: Users, label: 'Department', desc: 'For a team' },
                { id: 'personal', icon: UserIcon, label: 'Personal', desc: 'For a person' },
              ].map(scope => {
                const isSelected = formValues.scope === scope.id
                return (
                  <div
                    key={scope.id}
                    onClick={() => setValue('scope', scope.id as any)}
                    className={cn(
                      "border rounded-xl p-3 cursor-pointer transition-all flex items-center gap-3",
                      isSelected 
                        ? "border-indigo-500 bg-indigo-500/5" 
                        : "border-[#2a2a2a] bg-transparent hover:border-[#3a3a3a] hover:bg-[#1a1a1a]"
                    )}
                  >
                    <scope.icon size={18} className={isSelected ? "text-indigo-400" : "text-neutral-500"} />
                    <div>
                      <div className="text-sm font-medium text-white">{scope.label}</div>
                      <div className="text-xs text-neutral-500">{scope.desc}</div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Conditional Selectors */}
            {formValues.scope === 'department' && (
              <div className="animate-in slide-in-from-top-2 fade-in duration-200">
                <label className="text-sm text-neutral-400 mb-1.5 block">Select Department</label>
                <select
                  {...register('assigned_to_dept_id')}
                  className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg h-10 px-3 text-sm text-white focus:border-indigo-500 outline-none"
                >
                  <option value="">Choose a department...</option>
                  {departments?.filter(d => d.is_active).map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
                {errors.assigned_to_dept_id && <p className="text-rose-400 text-xs mt-1">{errors.assigned_to_dept_id.message}</p>}
              </div>
            )}

            {formValues.scope === 'personal' && (
              <div className="animate-in slide-in-from-top-2 fade-in duration-200">
                <label className="text-sm text-neutral-400 mb-1.5 block">Select Team Member</label>
                <select
                  {...register('assigned_to_user_id')}
                  className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg h-10 px-3 text-sm text-white focus:border-indigo-500 outline-none"
                >
                  <option value="">Choose a member...</option>
                  {users?.filter(u => u.is_active).map(u => (
                    <option key={u.id} value={u.id}>{u.full_name} ({(u as any).department?.name || 'No Dept'})</option>
                  ))}
                </select>
                {errors.assigned_to_user_id && <p className="text-rose-400 text-xs mt-1">{errors.assigned_to_user_id.message}</p>}
              </div>
            )}
          </div>

          {/* SECTION 4 - Target */}
          <div className="p-8 border-b border-[#2a2a2a]">
            <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-4">Progress Tracking</label>
            <div className="flex items-center gap-3 mb-4">
              <button
                type="button"
                onClick={() => setIsTrackProgress(!isTrackProgress)}
                className={cn("w-10 h-6 rounded-full transition-colors relative", isTrackProgress ? "bg-indigo-600" : "bg-[#2a2a2a]")}
              >
                <div className={cn("w-4 h-4 rounded-full bg-white absolute top-1 transition-all", isTrackProgress ? "left-5" : "left-1")} />
              </button>
              <div>
                <div className="text-sm text-white">Track numeric progress</div>
                <div className="text-xs text-neutral-500">Leave off to track this goal as done/not done only</div>
              </div>
            </div>

            {isTrackProgress && (
              <div className="flex gap-4 animate-in slide-in-from-top-2 fade-in">
                <div className="flex-1">
                  <label className="text-sm text-neutral-400 mb-1.5 block">Target Value</label>
                  <input
                    type="number"
                    {...register('target_value', { valueAsNumber: true })}
                    placeholder="e.g. 50"
                    className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg h-10 px-3 text-sm text-white focus:border-indigo-500 outline-none"
                  />
                  {errors.target_value && <p className="text-rose-400 text-xs mt-1">{errors.target_value.message}</p>}
                </div>
                <div className="flex-1">
                  <label className="text-sm text-neutral-400 mb-1.5 block">Unit</label>
                  <input
                    type="text"
                    placeholder="e.g. deals, %, $"
                    maxLength={30}
                    className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg h-10 px-3 text-sm text-white focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* SECTION 5 - Timeline */}
          <div className="p-8">
            <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-4">Timeline</label>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <label className="text-sm text-neutral-400 mb-1.5 block">Start Date</label>
                <input
                  type="date"
                  {...register('start_date')}
                  className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg h-10 px-3 text-sm text-white focus:border-indigo-500 outline-none [color-scheme:dark]"
                />
              </div>
              <div className="flex-1">
                <label className="text-sm text-neutral-400 mb-1.5 block">End Date</label>
                <input
                  type="date"
                  {...register('end_date')}
                  className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg h-10 px-3 text-sm text-white focus:border-indigo-500 outline-none [color-scheme:dark]"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {['This Week', 'This Month', 'This Quarter', 'This Year', '90 Days'].map(preset => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setQuickDate(preset)}
                  className="bg-[#1a1a1a] hover:bg-[#2a2a2a] text-neutral-300 border border-[#2a2a2a] rounded-full px-3 py-1 text-xs font-medium transition-colors"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        </form>

        {/* Right Preview Panel (Sticky) */}
        <div className="hidden lg:block w-[35%] sticky top-6">
          <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-widest mb-4">Live Preview</h3>
          <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-5 hover:border-[#3a3a3a] transition-colors flex flex-col">
            <div className="flex justify-between items-start mb-3">
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-white break-words">
                  {formValues.title || 'Goal title...'}
                </h3>
                <div className="flex gap-2">
                  <TypeBadge type={formValues.type as any} />
                  <ScopeBadge 
                    scope={formValues.scope as any} 
                    entityName={formValues.scope === 'department' ? selectedDept?.name : formValues.scope === 'personal' ? selectedUser?.full_name : undefined}
                  />
                </div>
              </div>
              <StatusBadge status="active" type="goal" />
            </div>
            
            <p className="text-sm text-neutral-400 mt-2 mb-4 line-clamp-2 min-h-[40px] break-words">
              {formValues.description || 'Add more context...'}
            </p>

            {formValues.scope === 'personal' && selectedUser && (
              <div className="mb-4">
                <div className="text-xs text-neutral-500 mb-1">Assigned to:</div>
                <div className="flex items-center gap-2 bg-[#0a0a0a] rounded border border-[#2a2a2a] p-1.5 w-max">
                  <UserAvatar user={selectedUser as any} className="w-5 h-5" />
                  <span className="text-xs text-neutral-300 font-medium pr-1">{selectedUser.full_name}</span>
                </div>
              </div>
            )}
            
            {isTrackProgress ? (
              <div className="mb-4 pt-2">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-neutral-400">Progress</span>
                  <span className="text-white font-medium">0 / {formValues.target_value || '0'}</span>
                </div>
                <div className="h-1.5 w-full bg-[#2a2a2a] rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 w-[5%]" />
                </div>
              </div>
            ) : (
              <div className="mb-4 pt-2 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-neutral-500" />
                <span className="text-xs text-neutral-500">Milestone</span>
              </div>
            )}

            <div className="pt-4 border-t border-[#1a1a1a] flex items-center justify-between">
              <div className="text-xs text-neutral-400">
                End: <span className="text-white font-medium">{formValues.end_date ? format(parseISO(formValues.end_date), 'MMM d') : 'â€”'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 lg:left-64 right-0 bg-[#0a0a0a]/80 backdrop-blur-md border-t border-[#2a2a2a] p-4 z-40">
        <div className="max-w-7xl mx-auto flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-neutral-400 hover:text-white hover:bg-[#1a1a1a] h-10 px-4 rounded-lg transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            form="goal-form"
            type="submit"
            disabled={isSubmitting}
            className="bg-indigo-600 hover:bg-indigo-500 text-white h-10 px-6 text-sm font-medium rounded-lg transition-colors flex items-center justify-center min-w-[140px]"
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Create Goal'}
          </button>
        </div>
      </div>
    </div>
  )
}
