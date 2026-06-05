import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GoalUpdateSchema } from '@/lib/validations/goal.schemas'
import { logActivity, computeGoalFields, createNotification } from '@/lib/api-helpers'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user: sessionUser } } = await supabase.auth.getUser()
  const session = sessionUser ? { user: sessionUser } : null
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: currentUser } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single()

  if (!currentUser || !currentUser.is_active) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: goal } = await supabase.from('goals').select('*').eq('id', id).single()
  if (!goal) return NextResponse.json({ error: 'Goal not found' }, { status: 404 })

  // Authz: Assigned user + managers + admin
  const isAssigned = goal.assigned_to_user_id === currentUser.id
  const isManagerOrAdmin = currentUser.role === 'admin' || currentUser.role === 'manager'
  
  if (!isAssigned && !isManagerOrAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const json = await request.json()
    const body = GoalUpdateSchema.parse(json)

    // Insert goal_update
    const { error: updateError } = await supabase
      .from('goal_updates')
      .insert({
        goal_id: id,
        updated_by: currentUser.id,
        previous_value: goal.current_value,
        new_value: body.new_value,
        note: body.note || null,
      })

    if (updateError) throw updateError

    // Update goal current_value and optionally status
    let updates: any = { current_value: body.new_value }
    let isCompletedNow = false

    if (goal.target_value && body.new_value >= goal.target_value && goal.status !== 'completed') {
      updates.status = 'completed'
      isCompletedNow = true
    }

    const { data: updatedGoal, error: goalUpdateError } = await supabase
      .from('goals')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (goalUpdateError) throw goalUpdateError

    await logActivity({
      userId: currentUser.id,
      action: 'goal_progress_updated',
      entityType: 'goal',
      entityId: id,
      entityTitle: updatedGoal.title,
      metadata: { previous: goal.current_value, new: body.new_value }
    })

    if (isCompletedNow) {
      await logActivity({
        userId: currentUser.id,
        action: 'goal_completed',
        entityType: 'goal',
        entityId: id,
        entityTitle: updatedGoal.title,
      })
    }

    // Send push notification to the goal creator if someone else updated it
    if (goal.created_by && goal.created_by !== currentUser.id) {
      try {
        await createNotification({
          userId: goal.created_by,
          type: isCompletedNow ? 'goal_completed' : 'goal_progress_updated',
          title: isCompletedNow ? 'Goal Completed' : 'Goal Progress Updated',
          body: isCompletedNow 
            ? `"${updatedGoal.title}" has been completed by ${currentUser.full_name || 'a team member'}`
            : `Progress added to "${updatedGoal.title}"`,
          entityId: id,
          url: `/goals/${id}`
        })
      } catch (e) {
        console.error('Failed to create notification', e)
      }
    }

    return NextResponse.json({ data: computeGoalFields(updatedGoal) })
  } catch (error: any) {
    console.error('POST /api/goals/[id]/update Error:', error)
    if (error.name === 'ZodError') return NextResponse.json({ error: error.errors.map((e: any) => e.message).join(', ') }, { status: 400 })
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
