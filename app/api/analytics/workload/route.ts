import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { serverError, unauthorized, forbidden } from '@/lib/utils/errors'
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, addWeeks } from 'date-fns'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return unauthorized()

    const { data: user } = await supabase.from('users').select('role').eq('id', session.user.id).single()
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
    const { data: users, error: usersError } = await adminClient
      .from('users')
      .select('id, full_name, avatar_url, department:departments(name)')

    if (usersError) return serverError(usersError)

    const nowStr = new Date().toISOString()
    const startStr = start.toISOString()
    const endStr = end.toISOString()

    const workloadData = await Promise.all(((users as any[]) || []).map(async (u: any) => {
      const { count: dueThisPeriod } = await adminClient
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', u.id)
        .gte('due_date', startStr)
        .lte('due_date', endStr)
        .neq('status', 'cancelled')

      const { data: overdueTasks } = await adminClient
        .from('tasks')
        .select('id, title, due_date')
        .eq('assigned_to', u.id)
        .lt('due_date', nowStr)
        .neq('status', 'done')
        .neq('status', 'cancelled')
        .order('due_date', { ascending: true })
      
      const overdueCount = overdueTasks?.length || 0

      const mappedOverdue = (overdueTasks || []).map(t => ({
        ...t,
        days_overdue: Math.max(1, Math.floor((Date.now() - new Date(t.due_date as string).getTime()) / (1000 * 60 * 60 * 24)))
      }))

      const { count: inProgressCount } = await adminClient
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', u.id)
        .eq('status', 'in_progress')

      const { data: timeEntries } = await adminClient
        .from('time_entries')
        .select('duration_seconds')
        .eq('user_id', u.id)
        .gte('started_at', startStr)
        .lte('started_at', endStr)
      
      const sumSeconds = (timeEntries || []).reduce((acc, curr) => acc + (curr.duration_seconds || 0), 0)
      const estimatedHours = +(sumSeconds / 3600).toFixed(1)

      const { count: doneCount } = await adminClient
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', u.id)
        .eq('status', 'done')
        .gte('due_date', startStr)
        .lte('due_date', endStr)
      
      const { count: totalCount } = await adminClient
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', u.id)
        .gte('due_date', startStr)
        .lte('due_date', endStr)
        .neq('status', 'cancelled')

      const completionRate = totalCount && totalCount > 0 ? (doneCount || 0) / totalCount : 0

      const { count: activeCount } = await adminClient
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', u.id)
        .in('status', ['todo', 'in_progress'])

      return {
        ...u,
        dueThisPeriod: dueThisPeriod || 0,
        overdue: overdueCount,
        overdue_tasks: mappedOverdue,
        inProgress: inProgressCount || 0,
        estimatedHours,
        completionRate,
        totalTasks: activeCount || 0
      }
    }))

    return NextResponse.json({ data: workloadData })
  } catch (err) {
    return serverError(err)
  }
}
