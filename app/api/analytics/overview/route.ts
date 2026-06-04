import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { format, subDays, differenceInDays, parseISO, eachDayOfInterval } from 'date-fns'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user: sessionUser } } = await supabase.auth.getUser()
  const session = sessionUser ? { user: sessionUser } : null
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: currentUser } = await supabase.from('users').select('*').eq('id', session.user.id).single()
  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'manager')) {
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
    let userIdsInDept: string[] = []
    if (currentUser.role === 'manager' && currentUser.department_id) {
      const { data: deptUsers } = await supabase.from('users').select('id').eq('department_id', currentUser.department_id)
      userIdsInDept = (deptUsers || []).map(u => u.id)
      if (userIdsInDept.length === 0) userIdsInDept = ['00000000-0000-0000-0000-000000000000'] // dummy to prevent empty IN clause
    }

    // 1. Tasks completed
    let qTasksComp = supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'done').gte('updated_at', from).lte('updated_at', to)
    if (currentUser.role === 'manager') qTasksComp = qTasksComp.in('assigned_to', userIdsInDept)

    // Prev tasks completed
    let qPrevTasks = supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'done').gte('updated_at', prevFrom).lte('updated_at', prevTo)
    if (currentUser.role === 'manager') qPrevTasks = qPrevTasks.in('assigned_to', userIdsInDept)

    // 2. Goal stats
    let qGoals = supabase.from('goals').select('status, assigned_to_dept_id, end_date')
    if (currentUser.role === 'manager') qGoals = qGoals.eq('assigned_to_dept_id', currentUser.department_id)

    // 3. Overdue tasks
    let qOverdue = supabase.from('tasks').select('*', { count: 'exact', head: true }).not('status', 'in', '("done","cancelled")').lt('due_date', todayStr)
    if (currentUser.role === 'manager') qOverdue = qOverdue.in('assigned_to', userIdsInDept)

    // 4 & 5. Completed tasks for daily & employee stats
    let qDoneTasks = supabase.from('tasks').select('updated_at, assignee:users!tasks_assigned_to_fkey(id, full_name)').eq('status', 'done').gte('updated_at', from).lte('updated_at', to)
    if (currentUser.role === 'manager') qDoneTasks = qDoneTasks.in('assigned_to', userIdsInDept)

    // 6. Departments
    let qDepts = supabase.from('departments').select('id, name')
    if (currentUser.role === 'manager') qDepts = qDepts.eq('id', currentUser.department_id)

    // 7. All tasks (for department health)
    let qAllTasks = supabase.from('tasks').select('status, due_date, assigned_to, assignee:users!tasks_assigned_to_fkey(department_id)')
    if (currentUser.role === 'manager') qAllTasks = qAllTasks.in('assigned_to', userIdsInDept)

    const [
      { count: tasksCompleted },
      { count: prevTasksCompleted },
      { data: allGoals },
      { count: overdueTasksCount },
      { data: doneTasksInRange },
      { data: departments },
      { data: allTasks },
    ] = await Promise.all([
      qTasksComp,
      qPrevTasks,
      qGoals,
      qOverdue,
      qDoneTasks,
      qDepts,
      qAllTasks
    ])

    // Process Goal Stats
    const goal_stats: Record<string, number> = { active: 0, completed: 0, draft: 0, cancelled: 0, overdue: 0 }
    allGoals?.forEach((g: any) => {
      goal_stats[g.status] = (goal_stats[g.status] || 0) + 1
      if (g.status === 'active' && g.end_date && g.end_date < todayStr) {
        goal_stats['overdue'] = (goal_stats['overdue'] || 0) + 1
      }
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
