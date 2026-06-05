import { createAdminClient } from '@/lib/supabase/server'
import { Goal, Task } from '@/types'
import { differenceInDays, isPast } from 'date-fns'
import { sendPushNotification } from '@/lib/push'

export async function logActivity({
  userId,
  action,
  entityType,
  entityId,
  entityTitle,
  metadata = {},
}: {
  userId: string
  action: string
  entityType: string
  entityId: string
  entityTitle?: string
  metadata?: Record<string, any>
}) {
  try {
    const adminClient = await createAdminClient()
    await adminClient.from('activity_log').insert({
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      entity_title: entityTitle || null,
      metadata,
    })
  } catch (error) {
    console.error('Failed to log activity:', error)
    // We intentionally swallow this error so it doesn't break the main operation
  }
}

export async function createNotification({
  userId,
  type,
  title,
  body,
  entityId,
  url,
}: {
  userId: string
  type: string
  title: string
  body: string
  entityId?: string
  url?: string
}) {
  try {
    const adminClient = await createAdminClient()
    await adminClient.from('notifications').insert({
      user_id: userId,
      type,
      title,
      body,
      entity_id: entityId || null,
    })

    // Dispatch web push directly
    await sendPushNotification([userId], {
      title,
      body,
      type,
      url: url || '/'
    })

  } catch (error) {
    console.error('Failed to create notification:', error)
  }
}

// computeGoalFields expects a raw goal object from DB
export function computeGoalFields(goal: any): Goal {
  const progress = goal.target_value
    ? Math.min(Math.round((goal.current_value / goal.target_value) * 100), 100)
    : 0
  const daysLeft = differenceInDays(new Date(goal.end_date), new Date())
  
  return {
    ...goal,
    // Normalise type — some existing DB rows may have null type
    type: goal.type ?? 'monthly',
    progress_percentage: progress,
    days_remaining: daysLeft,
    is_overdue: daysLeft < 0 && goal.status === 'active',
  }
}

// computeTaskFields expects a raw task object from DB
export function computeTaskFields(task: any): Task {
  let isOverdue = false
  if (task.due_date && !['done', 'cancelled'].includes(task.status)) {
    isOverdue = isPast(new Date(task.due_date))
  }
  
  return {
    ...task,
    is_overdue: isOverdue,
  }
}
