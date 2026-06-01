import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { serverError, unauthorized, forbidden } from '@/lib/utils/errors'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return unauthorized()

    const { data: user } = await supabase.from('users').select('role').eq('id', session.user.id).single()
    if (!user || user.role === 'employee') return forbidden('Only admins and managers can view reports')

    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    if (!from || !to) return NextResponse.json({ error: 'from and to dates required' }, { status: 400 })

    const { data: entries, error } = await supabase
      .from('time_entries')
      .select('*, user:users!time_entries_user_id_fkey(full_name), task:tasks!time_entries_task_id_fkey(title)')
      .gte('started_at', `${from}T00:00:00.000Z`)
      .lte('started_at', `${to}T23:59:59.999Z`)
      .not('ended_at', 'is', null)

    if (error) return serverError(error)

    let total_seconds = 0
    const by_employee: Record<string, number> = {}
    const by_task: Record<string, number> = {}

    entries.forEach((e: any) => {
      const dur = e.duration_seconds || 0
      total_seconds += dur

      const empName = e.user?.full_name || 'Unknown User'
      by_employee[empName] = (by_employee[empName] || 0) + dur

      const taskName = e.task?.title || 'Unknown Task'
      by_task[taskName] = (by_task[taskName] || 0) + dur
    })

    const employeeData = Object.entries(by_employee).map(([name, seconds]) => ({
      name,
      hours: +(seconds / 3600).toFixed(2)
    })).sort((a, b) => b.hours - a.hours)

    const taskData = Object.entries(by_task).map(([taskTitle, seconds]) => ({
      taskTitle,
      hours: +(seconds / 3600).toFixed(2)
    })).sort((a, b) => b.hours - a.hours)

    return NextResponse.json({
      data: {
        total_hours: +(total_seconds / 3600).toFixed(2),
        hours_by_employee: employeeData,
        hours_by_task: taskData
      }
    })
  } catch (err) {
    return serverError(err)
  }
}
