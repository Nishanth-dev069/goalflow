import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { unauthorized, forbidden, serverError, apiError } from '@/lib/utils/errors'
import { CreateTaskSchema } from '@/lib/validations/task.schemas'
import { logActivity, computeTaskFields, createNotification } from '@/lib/api-helpers'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user: sessionUser }, error: sessionError } = await supabase.auth.getUser()
  const session = sessionUser ? { user: sessionUser } : null
    
    if (sessionError || !session) {
      return unauthorized()
    }

    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('id, role, department_id, is_active')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser || !currentUser.is_active) {
      return unauthorized()
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const assigned_to = searchParams.get('assigned_to')
    const department_id = searchParams.get('department_id')
    const due_from = searchParams.get('due_from')
    const due_to = searchParams.get('due_to')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const per_page = 20

    let query = supabase
      .from('tasks')
      .select(`
        id, title, status, priority, due_date, assigned_to, assigned_by, created_at, updated_at, description, tags, is_archived,
        assignee:users!tasks_assigned_to_fkey(id, full_name, avatar_url, department_id),
        assigner:users!tasks_assigned_by_fkey(id, full_name, avatar_url),
        subtasks(id, title, is_done, position),
        task_comments(count)
      `, { count: 'exact' })
      .eq('is_archived', false)

    if (status) query = query.eq('status', status)
    if (priority) query = query.eq('priority', priority)
    if (assigned_to) query = query.eq('assigned_to', assigned_to)
    if (due_from) query = query.gte('due_date', due_from)
    if (due_to) query = query.lte('due_date', due_to)

    if (department_id) {
      // Filter tasks where the assignee is in the given department
      const { data: deptUserIds } = await supabase
        .from('users')
        .select('id')
        .eq('department_id', department_id)
      const ids = (deptUserIds || []).map((u: any) => u.id)
      if (ids.length > 0) {
        query = query.in('assigned_to', ids)
      } else {
        query = query.eq('assigned_to', '00000000-0000-0000-0000-000000000000')
      }
    }

    if (currentUser.role !== 'admin') {
      if (currentUser.role === 'employee') {
        query = query.or(`assigned_to.eq.${currentUser.id},assigned_by.eq.${currentUser.id}`)
      } else if (currentUser.role === 'manager') {
        if (currentUser.department_id) {
          const { data: deptUsers } = await supabase
            .from('users')
            .select('id')
            .eq('department_id', currentUser.department_id)
          const deptUserIds = (deptUsers || []).map((u: any) => u.id)
          if (deptUserIds.length > 0) {
            query = query.or(`assigned_to.in.(${deptUserIds.join(',')}),assigned_by.in.(${deptUserIds.join(',')})`)
          } else {
            query = query.eq('assigned_to', '00000000-0000-0000-0000-000000000000')
          }
        } else {
          query = query.or(`assigned_to.eq.${currentUser.id},assigned_by.eq.${currentUser.id}`)
        }
      }
    }

    const from = (page - 1) * per_page
    const to = from + per_page - 1
    query = query.order('created_at', { ascending: false }).range(from, to)

    const { data, error, count } = await query
    
    if (error) {
      console.error(`[API ERROR] ${request.method} ${request.url}`, {
        error,
        userId: currentUser?.id,
      })
      return apiError(error.message, 500, error.code)
    }

    const processedData = data.map(t => {
      const comments_count = t.task_comments?.[0]?.count || 0
      const is_blocked = false
      delete (t as any).task_comments
      return computeTaskFields({ ...t, comments_count, is_blocked })
    })

    return NextResponse.json({
      data: processedData,
      total: count || 0,
      page,
      per_page,
      has_more: count ? (from + data.length) < count : false
    })
  } catch (err) {
    return serverError(err)
  }
}

export async function POST(request: Request) {
  let currentUser = null;
  let validated = null;
  try {
    const supabase = await createClient()
    const { data: { user: sessionUser }, error: sessionError } = await supabase.auth.getUser()
  const session = sessionUser ? { user: sessionUser } : null
    
    if (sessionError || !session) {
      return unauthorized()
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, role, department_id, is_active')
      .eq('id', session.user.id)
      .single()

    if (userError || !user || !user.is_active) {
      return unauthorized()
    }
    currentUser = user;

    if (currentUser.role === 'employee') {
      return forbidden()
    }

    const json = await request.json()
    validated = CreateTaskSchema.parse(json)

    if (currentUser.role === 'manager' && currentUser.id !== validated.assigned_to) {
      const { data: assignee } = await supabase.from('users').select('department_id').eq('id', validated.assigned_to).single()
      if (!assignee || assignee.department_id !== currentUser.department_id) {
        return forbidden('Can only assign tasks to users in your department')
      }
    }

    const { subtasks, ...taskData } = validated
    
    let assigneeDeptId = null;
    if (validated.assigned_to) {
      const { data: assignee } = await supabase.from('users').select('department_id').eq('id', validated.assigned_to).single()
      assigneeDeptId = assignee?.department_id || null
    }

    // Explicitly set creator_id just like the user requested for "assigned_by"
    const insertData = {
      ...taskData,
      assigned_by: currentUser.id,
      department_id: assigneeDeptId,
    }

    const { data: newTask, error: insertError } = await supabase
      .from('tasks')
      .insert(insertData)
      .select('*')
      .single()

    if (insertError) {
      console.error(`[API ERROR] ${request.method} ${request.url}`, {
        error: insertError,
        userId: currentUser?.id,
        body: validated,
      })
      return apiError(insertError.message, 400, insertError.code)
    }

    if (subtasks && subtasks.length > 0) {
      const subtaskInserts = subtasks.map(st => ({
        task_id: newTask.id,
        title: st.title,
        position: st.position,
      }))
      const { error: subtaskError } = await supabase.from('subtasks').insert(subtaskInserts)
      if (subtaskError) {
        console.error(`[API ERROR] POST subtasks`, { error: subtaskError })
      }
    }

    await logActivity({
      userId: currentUser.id,
      action: 'task_created',
      entityType: 'task',
      entityId: newTask.id,
      entityTitle: newTask.title,
      metadata: { priority: newTask.priority, assigned_to: newTask.assigned_to }
    })

    if (newTask.assigned_to !== currentUser.id) {
      await createNotification({
        userId: newTask.assigned_to,
        type: 'task_assigned',
        title: 'New task assigned',
        body: newTask.title,
        entityId: newTask.id
      })

      // Send push notification
      try {
        await fetch(new URL('/api/push/send', request.url), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userIds: [newTask.assigned_to],
            notification: {
              title: 'New Task Assigned',
              body: `"${newTask.title}" has been assigned to you`,
              url: '/tasks'
            }
          })
        })
      } catch (e) {
        console.error('Failed to send push notification', e)
      }
    }

    return NextResponse.json({ data: newTask }, { status: 201 })
  } catch (error: any) {
    console.error(`[API ERROR] ${request.method} ${request.url}`, {
      error,
      userId: currentUser?.id,
      body: validated,
    })
    if (error.name === 'ZodError') return NextResponse.json({ error: error.errors.map((e: any) => e.message).join(', ') }, { status: 400 })
    return serverError(error)
  }
}
