'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CreateTaskSchema } from '@/lib/validations/task.schemas'
import { useCreateTask } from '@/lib/queries/tasks'
import { useUsers } from '@/lib/queries/users'
import { useDepartments } from '@/lib/queries/departments'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { format, addDays, nextMonday } from 'date-fns'
import { getHolidayByDate } from '@/lib/utils/indianHolidays'
import { X, Search, Check, GripVertical, Loader2, ArrowDown, Minus, ArrowUp, Flame, Plus } from 'lucide-react'

// Simple safe markdown parser
const parseMarkdown = (text: string) => {
  let html = text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/_([^_]+)_/g, '<em>$1</em>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^- (.*)/gm, '<li>$1</li>')
    .replace(/\n/g, '<br/>')
  return `<p>${html}</p>`.replace(/<p><\/p>/g, '')
}

export default function CreateTaskPage() {
  const router = useRouter()
  const createMutation = useCreateTask()
  const { data: users } = useUsers()
  const { data: departments } = useDepartments()

  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [subtasks, setSubtasks] = useState<{ id: string, title: string, position: number }[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [isUserSearchOpen, setIsUserSearchOpen] = useState(false)

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<z.infer<typeof CreateTaskSchema>>({
    resolver: zodResolver(CreateTaskSchema) as any,
    defaultValues: {
      status: 'todo',
      priority: 'medium',
      due_date: format(new Date(), 'yyyy-MM-dd'),
    } as any
  })

  const formValues = watch()

  // Dynamic user matching
  const filteredUsers = (users || []).filter(u => u.full_name.toLowerCase().includes(userSearch.toLowerCase()))
  const selectedUser = users?.find(u => u.id === formValues.assigned_to)

  useEffect(() => {
    // Auto-populate department when user is selected
    if (selectedUser && selectedUser.department_id) {
      // In a real app we might have a department field on the task itself, but schema doesn't have it directly.
      // So we just use it for visual context.
    }
  }, [selectedUser])

  const onSubmit = async (data: z.infer<typeof CreateTaskSchema>) => {
    data.subtasks = subtasks.map(s => ({ title: s.title, position: s.position }))
    // Note: The schema doesn't have a tags field, so we just append them to description or ignore if not supported by API yet.
    if (tags.length > 0) {
      data.description = (data.description || '') + `\n\nTags: ${tags.join(', ')}`
    }

    createMutation.mutate(data, {
      onSuccess: () => {
        toast.success('Task created successfully')
        router.push('/admin/tasks')
      },
      onError: (err) => {
        toast.error(err.message)
      }
    })
  }

  // Native HTML5 Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id)
    e.currentTarget.classList.add('opacity-50')
  }
  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('opacity-50')
  }
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }
  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    const sourceId = e.dataTransfer.getData('text/plain')
    if (sourceId === targetId) return

    const newSubtasks = [...subtasks]
    const sourceIndex = newSubtasks.findIndex(s => s.id === sourceId)
    const targetIndex = newSubtasks.findIndex(s => s.id === targetId)

    const [removed] = newSubtasks.splice(sourceIndex, 1)
    if (removed) {
      newSubtasks.splice(targetIndex, 0, removed)
    }

    // Re-index
    setSubtasks(newSubtasks.map((s, i) => ({ ...s, position: i })))
  }

  const addSubtask = () => {
    setSubtasks([...subtasks, { id: Math.random().toString(), title: '', position: subtasks.length }])
  }
  
  const updateSubtask = (id: string, title: string) => {
    setSubtasks(subtasks.map(s => s.id === id ? { ...s, title } : s))
  }

  const removeSubtask = (id: string) => {
    setSubtasks(subtasks.filter(s => s.id !== id))
  }

  const handleTagKeydown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const val = tagInput.trim()
      if (val && tags.length < 10 && !tags.includes(val)) {
        setTags([...tags, val])
        setTagInput('')
      }
    }
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto min-h-screen pb-32">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">Assign Task</h1>
        <p className="text-neutral-400 mt-1">Create a detailed task and delegate it to a team member.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Main Form Area */}
        <form id="task-form" onSubmit={handleSubmit(onSubmit)} className="w-full lg:w-[65%] space-y-8">
          
          {/* SECTION 1 - Title */}
          <div>
            <input
              {...register('title')}
              className="w-full bg-transparent text-2xl font-semibold text-white placeholder-neutral-700 outline-none border-b border-[#2a2a2a] pb-4 focus:border-indigo-500 transition-colors"
              placeholder="What needs to be done?"
            />
            {errors.title && <p className="text-rose-400 text-xs mt-2">{errors.title.message}</p>}
          </div>

          {/* SECTION 2 - Description */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-neutral-300">Description</label>
              <div className="flex items-center bg-[#1a1a1a] rounded-md border border-[#2a2a2a] p-0.5">
                <button
                  type="button"
                  onClick={() => setIsPreviewMode(false)}
                  className={cn("px-3 py-1 text-xs font-medium rounded-sm transition-colors", !isPreviewMode ? "bg-[#2a2a2a] text-white" : "text-neutral-500")}
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setIsPreviewMode(true)}
                  className={cn("px-3 py-1 text-xs font-medium rounded-sm transition-colors", isPreviewMode ? "bg-[#2a2a2a] text-white" : "text-neutral-500")}
                >
                  Preview
                </button>
              </div>
            </div>
            
            {isPreviewMode ? (
              <div 
                className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-4 min-h-[120px] text-sm text-neutral-300 prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: parseMarkdown(formValues.description || '*No description provided*') }}
              />
            ) : (
              <textarea
                {...register('description')}
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-3 text-sm text-neutral-300 font-mono focus:border-indigo-500 outline-none min-h-[120px] resize-y"
                placeholder="Add markdown support text here..."
              />
            )}
          </div>

          {/* SECTION 3 - Assignment */}
          <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-6">
            <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-4">Assign To</label>
            
            {selectedUser ? (
              <div className="flex items-center justify-between bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <UserAvatar user={selectedUser as any} className="w-8 h-8" />
                  <div>
                    <div className="text-sm text-white font-medium">{selectedUser.full_name}</div>
                    <div className="text-xs text-neutral-500">{(selectedUser as any).department?.name || 'No Dept'}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setValue('assigned_to', '')}
                  className="text-neutral-500 hover:text-white p-1 rounded transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={16} />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={e => { setUserSearch(e.target.value); setIsUserSearchOpen(true) }}
                    onFocus={() => setIsUserSearchOpen(true)}
                    placeholder="Search users..."
                    className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg h-10 pl-9 pr-3 text-sm text-white focus:border-indigo-500 outline-none transition-colors"
                  />
                </div>
                {isUserSearchOpen && userSearch && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-xl max-h-[200px] overflow-y-auto z-10">
                    {filteredUsers.map(u => (
                      <div
                        key={u.id}
                        onClick={() => { setValue('assigned_to', u.id); setIsUserSearchOpen(false); setUserSearch('') }}
                        className="flex items-center gap-3 p-3 hover:bg-[#2a2a2a] cursor-pointer transition-colors"
                      >
                        <UserAvatar user={u as any} className="w-6 h-6" />
                        <div>
                          <div className="text-sm text-white">{u.full_name}</div>
                          <div className="text-xs text-neutral-500">{(u as any).department?.name || 'No Dept'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {errors.assigned_to && <p className="text-rose-400 text-xs mt-1">{errors.assigned_to.message}</p>}
              </div>
            )}
          </div>

          {/* SECTION 4 - Priority */}
          <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-6">
            <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-4">Priority</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: 'low', icon: ArrowDown, label: 'Low', desc: 'Can wait', color: 'text-emerald-400', bg: 'bg-emerald-500/5', border: 'border-emerald-500' },
                { id: 'medium', icon: Minus, label: 'Medium', desc: 'Normal priority', color: 'text-amber-400', bg: 'bg-amber-500/5', border: 'border-amber-500' },
                { id: 'high', icon: ArrowUp, label: 'High', desc: 'Important', color: 'text-orange-400', bg: 'bg-orange-500/5', border: 'border-orange-500' },
                { id: 'urgent', icon: Flame, label: 'Urgent', desc: 'Drop everything', color: 'text-rose-400', bg: 'bg-rose-500/5', border: 'border-rose-500' },
              ].map(p => {
                const isSelected = formValues.priority === p.id
                return (
                  <div
                    key={p.id}
                    onClick={() => setValue('priority', p.id as any)}
                    className={cn(
                      "border rounded-xl p-4 cursor-pointer transition-all flex flex-col gap-2",
                      isSelected 
                        ? cn(p.bg, p.border) 
                        : "border-[#2a2a2a] bg-transparent hover:border-[#3a3a3a] hover:bg-[#1a1a1a]"
                    )}
                  >
                    <p.icon size={20} className={isSelected ? p.color : "text-neutral-600"} />
                    <div>
                      <div className="text-sm font-medium text-white">{p.label}</div>
                      <div className="text-xs text-neutral-500 mt-0.5">{p.desc}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* SECTION 5 - Due Date & Recurrence */}
          <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-4">Due Date</label>
                <div className="flex flex-col gap-4">
                  <input
                    type="date"
                    {...register('due_date')}
                    className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg h-10 px-3 text-sm text-white focus:border-indigo-500 outline-none [color-scheme:dark]"
                  />
                  {formValues.due_date && getHolidayByDate(formValues.due_date) && (
                    <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-2 rounded-lg text-xs font-medium">
                      ⚠️ This is a public holiday ({getHolidayByDate(formValues.due_date)}). Your team may not be working.
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: 'Today', date: new Date() },
                      { label: 'Tomorrow', date: addDays(new Date(), 1) },
                      { label: 'Next Monday', date: nextMonday(new Date()) },
                    ].map(preset => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setValue('due_date', format(preset.date, 'yyyy-MM-dd'))}
                        className="bg-[#1a1a1a] hover:bg-[#2a2a2a] text-neutral-300 border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-4">Repeat</label>
                <select
                  {...register('recurrence')}
                  className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg h-10 px-3 text-sm text-white focus:border-indigo-500 outline-none appearance-none"
                >
                  <option value="">Never</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
                {formValues.recurrence && (formValues.recurrence as any) !== '' && (
                  <p className="text-xs text-indigo-400 mt-2">
                    A new task will be created automatically when this one is completed.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 6 - Subtasks */}
          <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-6">
            <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-4">Subtasks</label>
            <div className="space-y-2 mb-4">
              {subtasks.map((st) => (
                <div
                  key={st.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, st.id)}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, st.id)}
                  className="flex items-center gap-3 bg-[#0a0a0a] border border-[#2a2a2a] p-2 rounded-lg group"
                >
                  <GripVertical size={16} className="text-neutral-600 cursor-grab active:cursor-grabbing" />
                  <input type="checkbox" disabled className="rounded border-[#3a3a3a] bg-[#1a1a1a] w-4 h-4 cursor-not-allowed" />
                  <input
                    type="text"
                    value={st.title}
                    onChange={(e) => updateSubtask(st.id, e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSubtask() } }}
                    placeholder="Subtask..."
                    className="flex-1 bg-transparent text-sm text-white outline-none"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => removeSubtask(st.id)}
                    className="text-neutral-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addSubtask}
              className="text-neutral-400 hover:text-white hover:bg-[#1a1a1a] px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Plus size={16} />
              Add subtask
            </button>
          </div>

          {/* SECTION 7 - Tags */}
          <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-6">
            <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-4">Tags</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {tags.map(tag => (
                <div key={tag} className="bg-[#1a1a1a] border border-[#2a2a2a] text-xs text-neutral-300 px-2 py-1 rounded-md flex items-center gap-1.5">
                  {tag}
                  <button type="button" onClick={() => setTags(tags.filter(t => t !== tag))} className="text-neutral-500 hover:text-rose-400"><X size={12} /></button>
                </div>
              ))}
            </div>
            <input
              type="text"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={handleTagKeydown}
              placeholder="Type a tag and press Enter..."
              className="w-full sm:w-[300px] bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg h-9 px-3 text-sm text-white focus:border-indigo-500 outline-none transition-colors"
            />
          </div>

        </form>

        {/* Right Sidebar (Sticky) */}
        <div className="hidden lg:block w-[35%] sticky top-6 space-y-4">
          <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-widest mb-4">Task Details Preview</h3>
            
            <div className="space-y-4">
              <div>
                <div className="text-xs text-neutral-500 mb-1.5">Assignee</div>
                {selectedUser ? (
                  <div className="flex items-center gap-2">
                    <UserAvatar user={selectedUser as any} className="w-5 h-5" />
                    <span className="text-sm text-white">{selectedUser.full_name}</span>
                  </div>
                ) : <span className="text-sm text-neutral-600 italic">Not assigned</span>}
              </div>

              <div>
                <div className="text-xs text-neutral-500 mb-1.5">Due Date</div>
                <div className="text-sm text-white">
                  {formValues.due_date ? format(new Date(formValues.due_date), 'MMM d, yyyy') : 'No date'}
                </div>
              </div>

              <div>
                <div className="text-xs text-neutral-500 mb-1.5">Priority</div>
                <div className="text-sm text-white capitalize">{formValues.priority}</div>
              </div>
            </div>
          </div>

          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-indigo-400 mb-3">Tasks are best when...</h3>
            <ul className="text-sm text-indigo-300 space-y-2 list-disc list-inside">
              <li>They are actionable and clear.</li>
              <li>They have a defined due date.</li>
              <li>Subtasks break down complex work.</li>
            </ul>
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
            form="task-form"
            type="submit"
            disabled={isSubmitting}
            className="bg-indigo-600 hover:bg-indigo-500 text-white h-10 px-6 text-sm font-medium rounded-lg transition-colors flex items-center justify-center min-w-[140px]"
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Assign Task'}
          </button>
        </div>
      </div>
    </div>
  )
}
