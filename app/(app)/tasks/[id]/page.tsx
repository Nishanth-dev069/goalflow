import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { headers } from 'next/headers'
import { ArrowLeft } from 'lucide-react'
import { PriorityBadge } from '@/components/shared/PriorityBadge'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { format } from 'date-fns'

import { StatusSegmented } from '@/components/tasks/StatusSegmented'
import { TaskComments } from '@/components/tasks/TaskComments'
import { TaskHistory } from '@/components/tasks/TaskHistory'
import { SubtaskList } from '@/components/tasks/SubtaskList'
import { TaskAttachments } from '@/components/tasks/TaskAttachments'
import { TaskDependencies } from '@/components/tasks/TaskDependencies'
import { TimeTracker } from '@/components/tasks/TimeTracker'
import { Lock } from 'lucide-react'

async function getTaskData(id: string) {
  const supabase = await createClient()
  const { data: { user: sessionUser } } = await supabase.auth.getUser()
  const session = sessionUser ? { user: sessionUser } : null
  
  if (!session) redirect('/login')

  // Fetch the DB user record so we have the real role
  const { data: currentUser } = await supabase
    .from('users')
    .select('id, role, department_id')
    .eq('id', session.user.id)
    .single()

  const { data: task, error } = await supabase
    .from('tasks')
    .select(`
      *,
      assignee:users!tasks_assigned_to_fkey(id, full_name, email, avatar_url),
      assigner:users!tasks_assigned_by_fkey(id, full_name, email, avatar_url),
      subtasks(*),
      task_comments(count)
    `)
    .eq('id', id)
    .single()

  if (error || !task) return null

  const comments_count = task.task_comments?.[0]?.count || 0
  const is_blocked = false
  delete task.task_comments

  // In a real app we can use computeTaskFields from api-helpers, but for server component:
  // (We'll just mock it directly or import it if possible. We can import it since it's just a pure function)
  const { computeTaskFields } = await import('@/lib/api-helpers')
  const processedTask = computeTaskFields({ ...task, comments_count, is_blocked })

  return { task: processedTask, user: session.user, currentUser }
}

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await getTaskData(id)

  if (!data) redirect('/tasks')

  const { task, user, currentUser } = data

  const isAdminOrManager = currentUser?.role === 'admin' || currentUser?.role === 'manager'
  const isAssignee = task.assigned_to === user.id
  const canEditStatus = isAssignee || isAdminOrManager
  const isOverdue = task.is_overdue

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-8 min-h-screen pb-32">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-neutral-500">
        <Link href={isAdminOrManager ? "/admin/tasks" : "/tasks"} className="hover:text-white transition-colors flex items-center gap-1">
          <ArrowLeft size={14}/> Tasks
        </Link>
        <span>/</span>
        <span className="text-white truncate max-w-[300px]">{task.title}</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* LEFT COLUMN */}
        <div className="w-full lg:w-[65%] space-y-8">
          
          <div>
            <div className="flex items-center gap-3 mb-6">
              <h1 className="text-3xl font-bold text-white leading-tight">{task.title}</h1>
              {task.is_blocked && (
                <span className="flex items-center gap-1.5 bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2.5 py-1 rounded text-xs font-semibold uppercase tracking-widest shrink-0">
                  <Lock size={12} /> Blocked
                </span>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-4">
              <StatusSegmented taskId={task.id} currentStatus={task.status} canEdit={canEditStatus} />
              
              {/* Admins could have a priority select here, but sticking to read-only badge for now to save time */}
              <PriorityBadge priority={task.priority} className="h-10 px-4 text-sm" />
            </div>
          </div>

          <div className="pt-6 border-t border-[#1a1a1a]">
            {task.description ? (
              <div className="prose prose-invert max-w-none text-neutral-300">
                {/* Simplified markdown render for demo; real app would use remark/rehype */}
                <div dangerouslySetInnerHTML={{ __html: task.description.replace(/\n/g, '<br />') }} />
              </div>
            ) : (
              <div className="text-sm text-neutral-600 italic">No description provided.</div>
            )}
          </div>

          {/* Subtasks Section */}
          <SubtaskList taskId={task.id} subtasks={task.subtasks || []} canEdit={canEditStatus} />

          <div className="border-t border-[#1a1a1a]">
            <TaskComments taskId={task.id} currentUser={user as any} />
          </div>

          <div className="border-t border-[#1a1a1a] pt-6">
            <TaskAttachments taskId={task.id} currentUser={user as any} />
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="w-full lg:w-[35%] space-y-6">
          <TimeTracker taskId={task.id} currentUser={user as any} />
          
          <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-5 space-y-4">
            
            <div>
              <div className="text-xs text-neutral-500 mb-2">Assigned To</div>
              <div className="flex items-center gap-2">
                <UserAvatar user={task.assignee || null} className="w-8 h-8" />
                <div>
                  <div className="text-sm font-medium text-white">{task.assignee?.full_name}</div>
                  <div className="text-xs text-neutral-500">{task.assignee?.email}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-neutral-500 mb-1">Due Date</div>
                <div className={isOverdue ? "text-sm text-rose-400 font-semibold" : "text-sm text-white"}>
                  {task.due_date ? format(new Date(task.due_date), 'MMM d, yyyy') : 'No due date'}
                  {isOverdue && <span className="block text-xs mt-0.5">Overdue</span>}
                </div>
              </div>
              <div>
                <div className="text-xs text-neutral-500 mb-1">Created</div>
                <div className="text-sm text-neutral-300">{format(new Date(task.created_at), 'MMM d, yyyy')}</div>
              </div>
            </div>

            {task.tags && task.tags.length > 0 && (
              <div>
                <div className="text-xs text-neutral-500 mb-2">Tags</div>
                <div className="flex flex-wrap gap-2">
                  {task.tags.map((tag: string) => (
                    <span key={tag} className="text-xs bg-[#1a1a1a] text-neutral-300 px-2 py-1 rounded-md border border-[#3a3a3a]">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            <div>
              <div className="text-xs text-neutral-500 mb-2">Assigned By</div>
              <div className="flex items-center gap-2">
                <UserAvatar user={task.assigner || null} className="w-6 h-6" />
                <span className="text-sm text-neutral-300">{task.assigner?.full_name}</span>
              </div>
            </div>
            
          </div>

          <TaskDependencies taskId={task.id} currentUser={user as any} />
          <TaskHistory taskId={task.id} />
        </div>
      </div>
    </div>
  )
}
