import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { UpdateTaskSchema } from '@/lib/validations/task.schemas'
import { logActivity, computeTaskFields, createNotification } from '@/lib/api-helpers'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: task, error } = await supabase
    .from('tasks')
    .select(`
      *,
      assignee:users!tasks_assigned_to_fkey(id, full_name, avatar_url),
      assigner:users!tasks_assigned_by_fkey(id, full_name, avatar_url),
      subtasks(*),
      task_comments(count),
      task_dependencies(depends_on:tasks!task_dependencies_depends_on_id_fkey(status))
    `)
    .eq('id', id)
    .single()

  if (error || !task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

  const comments_count = task.task_comments?.[0]?.count || 0
  const is_blocked = (task.task_dependencies || []).some((d: any) => d.depends_on?.status !== 'done' && d.depends_on?.status !== 'cancelled')
  delete task.task_comments
  delete task.task_dependencies

  // In a real scenario we'd also check authorization based on role here

  return NextResponse.json({ data: computeTaskFields({ ...task, comments_count, is_blocked }) })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: currentUser } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single()

  if (!currentUser || !currentUser.is_active) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: task } = await supabase.from('tasks').select('*').eq('id', id).single()
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

  const isAssignee = task.assigned_to === currentUser.id
  const isManagerOrAdmin = currentUser.role === 'admin' || currentUser.role === 'manager'

  if (!isAssignee && !isManagerOrAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const json = await request.json()
    let body = UpdateTaskSchema.parse(json)

    // Employee restriction: only status
    if (currentUser.role === 'employee' && !isManagerOrAdmin) {
      if (Object.keys(body).some(key => key !== 'status')) {
        // Strip everything else
        body = { status: body.status } as any
      }
    }

    if (Object.keys(body).length === 0) return NextResponse.json({ data: task })

    const adminClientForUpdate = await createAdminClient()
    const { data: updatedTask, error } = await adminClientForUpdate
      .from('tasks')
      .update(body)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    const adminClient = await createAdminClient()

    // History tracking
    for (const [key, value] of Object.entries(body)) {
      if (task[key as keyof typeof task] !== value) {
        await adminClient.from('task_history').insert({
          task_id: id,
          changed_by: currentUser.id,
          field_changed: key,
          old_value: String(task[key as keyof typeof task] || ''),
          new_value: String(value || ''),
        })
      }
    }

    if (body.status && body.status !== task.status) {
      await logActivity({
        userId: currentUser.id,
        action: 'task_status_changed',
        entityType: 'task',
        entityId: id,
        entityTitle: task.title,
        metadata: { old_status: task.status, new_status: body.status }
      })

      if (body.status === 'done') {
        await logActivity({
          userId: currentUser.id,
          action: 'task_completed',
          entityType: 'task',
          entityId: id,
          entityTitle: task.title,
          metadata: { completed_at: new Date().toISOString() }
        })
      }
      
      if (body.status === 'cancelled') {
        await logActivity({
          userId: currentUser.id,
          action: 'task_cancelled',
          entityType: 'task',
          entityId: id,
          entityTitle: task.title,
        })
      }

      // Handle Recurring Task Logic
      if (body.status === 'done' && task.recurrence) {
        const currentDate = task.due_date ? new Date(task.due_date) : new Date()
        let nextDate = new Date(currentDate)
        
        switch (task.recurrence) {
          case 'daily': nextDate.setDate(nextDate.getDate() + 1); break;
          case 'weekly': nextDate.setDate(nextDate.getDate() + 7); break;
          case 'biweekly': nextDate.setDate(nextDate.getDate() + 14); break;
          case 'monthly': nextDate.setMonth(nextDate.getMonth() + 1); break;
        }

        const { data: newRecurringTask, error: recurError } = await adminClient.from('tasks').insert({
          title: task.title,
          description: task.description,
          status: 'todo',
          priority: task.priority,
          assigned_to: task.assigned_to,
          assigned_by: task.assigned_by,
          goal_id: task.goal_id,
          due_date: nextDate.toISOString().split('T')[0],
          recurrence: task.recurrence,
          recurrence_parent_id: task.recurrence_parent_id || task.id,
          tags: task.tags
        }).select().single()

        if (!recurError && newRecurringTask) {
          await createNotification({
            userId: task.assigned_to,
            type: 'task_assigned',
            title: `New recurring task: ${task.title}`,
            body: `Due on ${nextDate.toISOString().split('T')[0]}`,
            entityId: newRecurringTask.id
          })
        }
      }
    }

    if (body.assigned_to && body.assigned_to !== task.assigned_to) {
      await createNotification({
        userId: body.assigned_to,
        type: 'task_assigned',
        title: 'Task reassigned to you',
        body: task.title,
        entityId: id
      })
    }

    return NextResponse.json({ data: computeTaskFields(updatedTask) })
  } catch (error: any) {
    console.error('PATCH /api/tasks/[id] Error:', error)
    if (error.name === 'ZodError') return NextResponse.json({ error: error.errors.map((e: any) => e.message).join(', ') }, { status: 400 })
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: currentUser } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single()

  if (!currentUser || !currentUser.is_active || currentUser.role === 'employee') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const adminClientForDelete = await createAdminClient()
  const { error } = await adminClientForDelete
    .from('tasks')
    .update({ is_archived: true, status: 'cancelled' })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logActivity({
    userId: currentUser.id,
    action: 'task_cancelled',
    entityType: 'task',
    entityId: id,
  })

  return NextResponse.json({ success: true })
}
