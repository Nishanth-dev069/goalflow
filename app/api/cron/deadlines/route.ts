import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { addDays, format } from 'date-fns'

export async function GET(request: Request) {
  // Protect this route with a simple secret in production
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const supabase = createAdminClient()
    const today = new Date()
    const tomorrow = addDays(today, 1)
    
    const todayStr = format(today, 'yyyy-MM-dd')
    const tomorrowStr = format(tomorrow, 'yyyy-MM-dd')

    // Find tasks due tomorrow or overdue that are NOT done/cancelled
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('id, title, assigned_to, due_date')
      .not('status', 'in', '("done","cancelled")')
      .lte('due_date', tomorrowStr)

    if (error) throw error

    let notificationsCreated = 0

    // Process tasks
    for (const task of (tasks as any[]) || []) {
      const isOverdue = task.due_date && task.due_date < todayStr
      const title = isOverdue ? 'Task Overdue' : 'Task Due Tomorrow'
      const message = isOverdue 
        ? `The task "${task.title}" is overdue.` 
        : `The task "${task.title}" is due tomorrow.`

      const { data: existing } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', task.assigned_to)
        .eq('title', title)
        .eq('link', `/tasks/${task.id}`)
        .gte('created_at', todayStr)
        .limit(1)

      if (!existing || existing.length === 0) {
        await supabase.from('notifications').insert({
          user_id: task.assigned_to,
          title,
          message,
          type: isOverdue ? 'alert' : 'mention',
          link: `/tasks/${task.id}`,
        })
        notificationsCreated++

        try {
          await fetch(new URL('/api/push/send', request.url), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userIds: [task.assigned_to],
              notification: {
                title,
                body: message,
                url: `/tasks/${task.id}`,
                type: 'deadline'
              }
            })
          })
        } catch (e) {
          console.error('Failed to send push notification', e)
        }
      }
    }

    // Process goals
    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select('id, title, created_by, end_date')
      .not('status', 'in', '("completed","cancelled")')
      .lte('end_date', tomorrowStr)

    if (!goalsError && goals) {
      for (const goal of (goals as any[])) {
        const isOverdue = goal.end_date && goal.end_date < todayStr
        const title = isOverdue ? 'Goal Overdue' : 'Goal Due Tomorrow'
        const message = isOverdue 
          ? `The goal "${goal.title}" is overdue.` 
          : `The goal "${goal.title}" is due tomorrow.`

        const { data: existing } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', goal.created_by)
          .eq('title', title)
          .eq('link', `/goals/${goal.id}`)
          .gte('created_at', todayStr)
          .limit(1)

        if (!existing || existing.length === 0) {
          await supabase.from('notifications').insert({
            user_id: goal.created_by,
            title,
            message,
            type: isOverdue ? 'alert' : 'mention',
            link: `/goals/${goal.id}`,
          })
          notificationsCreated++

          try {
            await fetch(new URL('/api/push/send', request.url), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userIds: [goal.created_by],
                notification: {
                  title,
                  body: message,
                  url: `/goals/${goal.id}`,
                  type: 'deadline'
                }
              })
            })
          } catch (e) {
            console.error('Failed to send push notification', e)
          }
        }
      }
    }

    return NextResponse.json({ success: true, processed: tasks?.length || 0, created: notificationsCreated })
  } catch (error: any) {
    console.error('Deadline Cron Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
