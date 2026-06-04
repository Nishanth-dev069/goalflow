import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { serverError, unauthorized, forbidden } from '@/lib/utils/errors'
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, addWeeks } from 'date-fns'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user: sessionUser } } = await supabase.auth.getUser()
  const session = sessionUser ? { user: sessionUser } : null
    if (!session) return unauthorized()

    const { data: user } = await supabase.from('users').select('role, department_id').eq('id', session.user.id).single()
    if (!user || user.role === 'employee') return forbidden('Only admins and managers can view workload')

    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') || 'this_week'

    let start = startOfWeek(new Date(), { weekStartsOn: 1 })
    let end = endOfWeek(new Date(), { weekStartsOn: 1 })

    if (filter === 'next_week') {
      start = startOfWeek(addWeeks(new Date(), 1), { weekStartsOn: 1 })
      end = endOfWeek(addWeeks(new Date(), 1), { weekStartsOn: 1 })
    } else if (filter === 'this_month') {
      start = startOfMonth(new Date())
      end = endOfMonth(new Date())
    }

    const adminClient = await createAdminClient()
    let usersQuery = adminClient
      .from('users')
      .select('id, full_name, avatar_url, department:departments!users_department_id_fkey(name)')

    if (user.role === 'manager') {
      if (user.department_id) {
        usersQuery = usersQuery.eq('department_id', user.department_id)
      } else {
        // Manager without a department has no team members
        usersQuery = usersQuery.eq('department_id', '00000000-0000-0000-0000-000000000000')
      }
    }

    const { data: users, error: usersError } = await usersQuery

    if (usersError) return serverError(usersError)

    const nowStr = new Date().toISOString()
    const startStr = start.toISOString()
    const endStr = end.toISOString()

    const userIds = (users as any[] || []).map(u => u.id)
    const filterIds = userIds.length > 0 ? userIds : ['00000000-0000-0000-0000-000000000000']

    // 1. Fetch ALL relevant tasks in one query
    let tasksQuery = adminClient.from('tasks').select('id, title, due_date, status, assigned_to')
    if (user.role === 'manager') tasksQuery = tasksQuery.in('assigned_to', filterIds)
    const { data: allTasks, error: tasksError } = await tasksQuery
      
    // 2. Fetch ALL time entries in the period
    let timeQuery = adminClient.from('time_entries').select('user_id, duration_seconds').gte('started_at', startStr).lte('started_at', endStr)
    if (user.role === 'manager') timeQuery = timeQuery.in('user_id', filterIds)
    const { data: timeEntries, error: timeError } = await timeQuery

    if (tasksError) return serverError(tasksError)

    // Process everything in memory
    const workloadData = (users as any[] || []).map((u: any) => {
      let dueThisPeriod = 0
      let overdueCount = 0
      let inProgressCount = 0
      let doneCount = 0
      let totalCount = 0
      let activeCount = 0
      const overdue_tasks: any[] = []

      // Group tasks for this user
      const userTasks = ((allTasks as any[]) || []).filter((t: any) => t.assigned_to === u.id)
      
      userTasks.forEach(t => {
        const isCancelled = t.status === 'cancelled'
        const isDone = t.status === 'done'
        const inRange = t.due_date && t.due_date >= startStr && t.due_date <= endStr
        const isOverdue = t.due_date && t.due_date < nowStr

        // dueThisPeriod: gte start, lte end, not cancelled
        if (inRange && !isCancelled) {
          dueThisPeriod++
          totalCount++
          if (isDone) doneCount++
        }

        // overdue tasks
        if (isOverdue && !isDone && !isCancelled) {
          overdueCount++
          overdue_tasks.push({
            id: t.id,
            title: t.title,
            due_date: t.due_date,
            days_overdue: Math.max(1, Math.floor((Date.now() - new Date(t.due_date).getTime()) / (1000 * 60 * 60 * 24)))
          })
        }

        if (t.status === 'in_progress') inProgressCount++
        if (t.status === 'todo' || t.status === 'in_progress') activeCount++
      })

      // Sort overdue tasks by due date
      overdue_tasks.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())

      // Group time entries for this user
      const userTime = ((timeEntries as any[]) || []).filter((te: any) => te.user_id === u.id)
      const sumSeconds = userTime.reduce((acc, curr) => acc + (curr.duration_seconds || 0), 0)
      const estimatedHours = +(sumSeconds / 3600).toFixed(1)

      const completionRate = totalCount > 0 ? doneCount / totalCount : 0

      return {
        ...u,
        dueThisPeriod,
        overdue: overdueCount,
        overdue_tasks,
        inProgress: inProgressCount,
        estimatedHours,
        completionRate,
        totalTasks: activeCount
      }
    })

    return NextResponse.json({ data: workloadData })
  } catch (err) {
    return serverError(err)
  }
}
