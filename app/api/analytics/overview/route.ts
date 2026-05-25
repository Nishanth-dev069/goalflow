import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { format, subDays, differenceInDays, parseISO, eachDayOfInterval } from 'date-fns'

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
  const daysDiff = differenceInDays(parseISO(to), parseISO(from))
  const prevFrom = format(subDays(parseISO(from), daysDiff), 'yyyy-MM-dd')
  const prevTo = format(subDays(parseISO(to), daysDiff), 'yyyy-MM-dd')

  try {
    const [
      { count: tasksCompleted },
      { count: prevTasksCompleted },
      { data: allGoals },
      { count: overdueTasksCount },
      { data: doneTasksInRange },
      { data: departments },
      { data: allTasks },
    ] = await Promise.all([
      // 1. Tasks completed
      supabase.from('tasks').select('*', { count: 'exact', head: true })
        .eq('status', 'done')
        .gte('updated_at', from).lte('updated_at', to),
      
      // Prev tasks completed
      supabase.from('tasks').select('*', { count: 'exact', head: true })
        .eq('status', 'done')
        .gte('updated_at', prevFrom).lte('updated_at', prevTo),

      // 2. Goal stats (fetch all to group)
      supabase.from('goals').select('status, assigned_to_dept_id'),

      // 3. Overdue tasks
      supabase.from('tasks').select('*', { count: 'exact', head: true })
        .not('status', 'in', '("done","cancelled")')
        .lt('due_date', todayStr),

      // 4 & 5. Completed tasks for daily & employee stats
      supabase.from('tasks').select(`
        updated_at,
        assignee:users!tasks_assigned_to_fkey(id, full_name)
      `)
      .eq('status', 'done')
      .gte('updated_at', from).lte('updated_at', to),

      // 6. Department health (need all departments)
      supabase.from('departments').select('id, name'),

      // Need all tasks to compute department health precisely without a million queries
      supabase.from('tasks').select('status, due_date, assigned_to, assignee:users!tasks_assigned_to_fkey(department_id)')
    ])

    // Process Goal Stats
    const goal_stats: Record<string, number> = { active: 0, completed: 0, draft: 0, cancelled: 0 }
    allGoals?.forEach((g: any) => {
      goal_stats[g.status] = (goal_stats[g.status] || 0) + 1
    })

    // Process Daily Completions
    const dailyMap: Record<string, number> = {}
    doneTasksInRange?.forEach((t: any) => {
      const d = format(new Date(t.updated_at), 'yyyy-MM-dd')
      dailyMap[d] = (dailyMap[d] || 0) + 1
    })

    const allDays = eachDayOfInterval({ start: parseISO(from), end: parseISO(to) })
    const daily_completions = allDays.map(date => {
      const dStr = format(date, 'yyyy-MM-dd')
      return {
        date: dStr,
        count: dailyMap[dStr] || 0
      }
    })

    // Process Employee Completions
    const empMap: Record<string, { name: string, count: number }> = {}
    doneTasksInRange?.forEach((t: any) => {
      if (t.assignee && typeof t.assignee === 'object' && !Array.isArray(t.assignee)) {
        const id = t.assignee.id
        if (!empMap[id]) empMap[id] = { name: t.assignee.full_name, count: 0 }
        empMap[id].count++
      }
    })
    const tasks_by_employee = Object.entries(empMap)
      .map(([id, data]) => ({ id, name: data.name, count: data.count }))
      .sort((a, b) => b.count - a.count)

    // Process Department Health
    const deptHealth = (departments || []).map((dept: any) => {
      const active_goals = allGoals?.filter((g: any) => g.assigned_to_dept_id === dept.id && g.status === 'active').length || 0
      
      let total_tasks = 0
      let completed_tasks = 0
      let overdue_tasks_dept = 0

      allTasks?.forEach((t: any) => {
        // Safe check for relation
        if (t.assignee && typeof t.assignee === 'object' && !Array.isArray(t.assignee) && t.assignee.department_id === dept.id) {
          total_tasks++
          if (t.status === 'done') completed_tasks++
          if (t.due_date && t.due_date < todayStr && t.status !== 'done' && t.status !== 'cancelled') {
            overdue_tasks_dept++
          }
        }
      })

      return {
        id: dept.id,
        name: dept.name,
        total_tasks,
        completed_tasks,
        active_goals,
        overdue_tasks: overdue_tasks_dept
      }
    })

    let tasks_completed_trend = 0
    const currentCount = tasksCompleted || 0
    const prevCount = prevTasksCompleted || 0
    if (prevCount === 0) {
      tasks_completed_trend = currentCount > 0 ? 100 : 0
    } else {
      tasks_completed_trend = Math.round(((currentCount - prevCount) / prevCount) * 100)
    }

    return NextResponse.json({
      data: {
        tasks_completed: currentCount,
        tasks_completed_trend,
        goal_stats,
        overdue_tasks: overdueTasksCount || 0,
        daily_completions,
        tasks_by_employee,
        department_health: deptHealth
      }
    })

  } catch (error: any) {
    console.error('Analytics Overview Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
