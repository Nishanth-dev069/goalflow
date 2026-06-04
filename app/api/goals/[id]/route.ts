import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { UpdateGoalSchema } from '@/lib/validations/goal.schemas'
import { logActivity, computeGoalFields } from '@/lib/api-helpers'

export async function GET(
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

  const { data: goal, error } = await supabase
    .from('goals')
    .select(`
      *,
      assigned_user:users!goals_assigned_to_user_id_fkey(id, full_name, avatar_url),
      assigned_dept:departments!goals_assigned_to_dept_id_fkey(id, name),
      creator:users!goals_created_by_fkey(id, full_name),
      goal_updates(
        *,
        updater:users!goal_updates_updated_by_fkey(id, full_name, avatar_url)
      )
    `)
    .eq('id', id)
    .single()

  if (error || !goal) {
    return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
  }

  // Authorization Check
  if (currentUser.role !== 'admin') {
    const isOwnerOrAssigned = goal.created_by === currentUser.id || goal.assigned_to_user_id === currentUser.id
    const isDeptGoal = goal.scope === 'department' && goal.assigned_to_dept_id === currentUser.department_id
    const isCompanyGoal = goal.scope === 'company'

    if (!isOwnerOrAssigned && !isDeptGoal && !isCompanyGoal) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const computedGoal: any = computeGoalFields(goal)
  // Sort updates by created_at ASC
  if (computedGoal.goal_updates) {
    computedGoal.goal_updates.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  }

  return NextResponse.json({ data: computedGoal })
}

export async function PATCH(
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

  const isAdmin = currentUser.role === 'admin'
  const isOwningManager = currentUser.role === 'manager' && (
    goal.created_by === currentUser.id || 
    (goal.scope === 'department' && goal.assigned_to_dept_id === currentUser.department_id)
  )
  const isAssignee = goal.assigned_to_user_id === currentUser.id
  const isDeptMember = goal.scope === 'department' && goal.assigned_to_dept_id === currentUser.department_id

  if (!isAdmin && !isOwningManager && !isAssignee && !isDeptMember) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const json = await request.json()
    const body = UpdateGoalSchema.parse(json)

    if (Object.keys(body).length === 0) return NextResponse.json({ data: goal })

    const adminClientForUpdate = await createAdminClient()
    const { data: updatedGoal, error } = await adminClientForUpdate
      .from('goals')
      .update(body)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    await logActivity({
      userId: currentUser.id,
      action: 'goal_updated',
      entityType: 'goal',
      entityId: id,
      entityTitle: updatedGoal.title,
    })

    if (body.status === 'completed' && goal.status !== 'completed') {
      try {
        const adminClient = await createAdminClient()
        const { data: admins } = await adminClient
          .from('users')
          .select('id')
          .eq('role', 'admin')
          .eq('is_active', true)
        
        if (admins && admins.length > 0) {
          const completedBy = currentUser.full_name
          const notifications = admins.map(admin => ({
            user_id: admin.id,
            title: '🎯 Goal Completed',
            body: `${completedBy} completed the goal: "${goal.title}"`,
            type: 'goal_completed',
            entity_id: goal.id,
          }))
          await adminClient.from('notifications').insert(notifications)
        }

        await adminClient.from('activity_log').insert({
          user_id: currentUser.id,
          action: 'goal_completed',
          entity_type: 'goal',
          entity_id: id,
          entity_title: updatedGoal.title,
          metadata: { completed_by: currentUser.full_name, completed_at: new Date().toISOString() }
        })
      } catch (e) {
        console.error('Failed to create notification or activity log:', e)
      }
    }

    return NextResponse.json({ data: computeGoalFields(updatedGoal) })
  } catch (error: any) {
    console.error('PATCH /api/goals/[id] Error:', error)
    if (error.name === 'ZodError') return NextResponse.json({ error: error.errors.map((e: any) => e.message).join(', ') }, { status: 400 })
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(
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

  const { data: goal } = await supabase.from('goals').select('id, title, scope, assigned_to_dept_id, created_by').eq('id', id).single()
  if (!goal) return NextResponse.json({ error: 'Goal not found' }, { status: 404 })

  const canDelete =
    currentUser.role === 'admin' ||
    (currentUser.role === 'manager' && (goal.assigned_to_dept_id === currentUser.department_id || goal.created_by === currentUser.id))

  if (!canDelete) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const adminClientForDelete = await createAdminClient()
  const { error } = await adminClientForDelete
    .from('goals')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  try {
    const adminClient = await createAdminClient()
    await adminClient.from('activity_log').insert({
      user_id: currentUser.id,
      action: 'goal_updated',
      entity_type: 'goal',
      entity_id: goal.id,
      entity_title: goal.title,
      metadata: { action: 'deleted' }
    })
  } catch (e) {
    // ignore
  }

  return NextResponse.json({ success: true })
}
