import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: currentUser } = await supabase.from('users').select('*').eq('id', session.user.id).single()
  if (!currentUser || currentUser.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  
  if (!from || !to) {
    return NextResponse.json({ error: 'Missing from/to dates' }, { status: 400 })
  }

  const todayStr = format(new Date(), 'yyyy-MM-dd')

  try {
    const [
      { data: users },
      { data: tasks },
      { data: goals }
    ] = await Promise.all([
      supabase.from('users').select('id, full_name, email, avatar_url, department:departments!users_department_id_fkey(name)'),
      supabase.from('tasks').select('assigned_to, status, due_date, created_at, updated_at'),
      supabase.from('goals').select('assigned_to_user_id, status')
    ])

    const teamStats = (users || []).map((u: any) => {
      let tasks_assigned = 0
      let tasks_completed = 0
      let tasks_overdue = 0

      tasks?.forEach((t: any) => {
        if (t.assigned_to === u.id) {
          // Assigned in period? We'll just count total assigned tasks or those active in period.
          // Spec says "tasks assigned", usually means total active or created in period.
          // Let's count tasks created in period for assigned, and updated in period for completed.
          if (t.created_at >= from && t.created_at <= to) tasks_assigned++
          if (t.status === 'done' && t.updated_at >= from && t.updated_at <= to) tasks_completed++
          if (t.due_date && t.due_date < todayStr && t.status !== 'done' && t.status !== 'cancelled') tasks_overdue++
        }
      })

      let goals_active = 0
      let goals_completed = 0
      goals?.forEach((g: any) => {
        if (g.assigned_to_user_id === u.id) {
          if (g.status === 'active') goals_active++
          if (g.status === 'completed') goals_completed++
        }
      })

      return {
        user: {
          id: u.id,
          full_name: u.full_name,
          email: u.email,
          avatar_url: u.avatar_url,
          department_name: Array.isArray(u.department) ? u.department[0]?.name : u.department?.name
        },
        stats: {
          tasks_assigned,
          tasks_completed,
          tasks_overdue,
          goals_active,
          goals_completed
        }
      }
    })

    return NextResponse.json({ data: teamStats })

  } catch (error: any) {
    console.error('Analytics Team Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
