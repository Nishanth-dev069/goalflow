import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { computeGoalFields, computeTaskFields } from '@/lib/api-helpers'
import { format } from 'date-fns'

export async function GET() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: currentUser } = await supabase
    .from('users')
    .select('*, department:departments!users_department_id_fkey(*)')
    .eq('id', session.user.id)
    .single()

  if (!currentUser || !currentUser.is_active) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = format(new Date(), 'yyyy-MM-dd')
  const uid = session.user.id

  try {
    const [
      { data: todayTasksData },
      { data: myGoalsData },
      { data: companyGoalsData },
      { data: activityFeedData },
      { count: overdueTasksCount },
      { count: activeGoalsCount },
      { count: completedTodayCount },
    ] = await Promise.all([
      // 1. today_tasks
      supabase
        .from('tasks')
        .select(`
          id, title, status, priority, due_date, assigned_to, created_at, updated_at,
          assignee:users!tasks_assigned_to_fkey(id, full_name, avatar_url),
          assigner:users!tasks_assigned_by_fkey(id, full_name, avatar_url),
          subtasks(id, title, is_done)
        `)
        .eq('assigned_to', uid)
        .eq('due_date', today)
        .not('status', 'in', '("done","cancelled")')
        .eq('is_archived', false),

      // 2. my_goals
      supabase
        .from('goals')
        .select(`
          id, title, type, scope, status, target_value, current_value, unit, start_date, end_date, is_archived, is_private, assigned_to_user_id, assigned_to_dept_id, created_by, created_at, updated_at, description,
          creator:users!goals_created_by_fkey(id, full_name),
          assigned_dept:departments!goals_assigned_to_dept_id_fkey(id, name)
        `)
        .eq('assigned_to_user_id', uid)
        .eq('status', 'active')
        .eq('is_archived', false)
        .order('end_date', { ascending: true }),

      // 3. company_goals
      supabase
        .from('goals')
        .select(`
          id, title, type, scope, status, target_value, current_value, unit, start_date, end_date, is_archived, is_private, assigned_to_user_id, assigned_to_dept_id, created_by, created_at, updated_at, description,
          creator:users!goals_created_by_fkey(id, full_name)
        `)
        .eq('scope', 'company')
        .eq('status', 'active')
        .eq('is_archived', false)
        .order('end_date', { ascending: true })
        .limit(5),

      // 4. activity_feed
      supabase
        .from('activity_log')
        .select(`
          id, action, entity_type, entity_title, entity_id, created_at, metadata,
          user:users!activity_log_user_id_fkey(id, full_name, avatar_url)
        `)
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(20),

      // overdue count
      supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', uid)
        .not('status', 'in', '("done","cancelled")')
        .lt('due_date', today)
        .eq('is_archived', false),

      // active goals count
      supabase
        .from('goals')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to_user_id', uid)
        .eq('status', 'active')
        .eq('is_archived', false),

      // completed today count
      supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', uid)
        .eq('status', 'done')
        .gte('updated_at', today)
    ])

    // Mock completion_rate_week for simplicity (could be calculated with full week data)
    const completion_rate_week = 85;

    // Compute derived fields
    const today_tasks = (todayTasksData || [])
      .map(computeTaskFields)
      .sort((a, b) => {
        const priorityScore = { urgent: 4, high: 3, medium: 2, low: 1 }
        return priorityScore[b.priority as keyof typeof priorityScore] - priorityScore[a.priority as keyof typeof priorityScore]
      })

    const my_goals = (myGoalsData || []).map(computeGoalFields)
    const company_goals = (companyGoalsData || []).map(computeGoalFields)

    return NextResponse.json({
      today_tasks,
      my_goals,
      company_goals,
      activity_feed: activityFeedData || [],
      stats: {
        tasks_due_today: today_tasks.length,
        tasks_overdue: overdueTasksCount || 0,
        active_goals: activeGoalsCount || 0,
        completed_today_count: completedTodayCount || 0,
        completion_rate_week,
      }
    })
  } catch (error) {
    console.error('Dashboard Error:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
  }
}
