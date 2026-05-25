import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { UpdateGoalSchema } from '@/lib/validations/goal.schemas'
import { logActivity, computeGoalFields } from '@/lib/api-helpers'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
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
  const { data: { session } } = await supabase.auth.getSession()
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

  if (!isAdmin && !isOwningManager) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const json = await request.json()
    const body = UpdateGoalSchema.parse(json)

    if (Object.keys(body).length === 0) return NextResponse.json({ data: goal })

    const { data: updatedGoal, error } = await supabase
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
      await logActivity({
        userId: currentUser.id,
        action: 'goal_completed',
        entityType: 'goal',
        entityId: id,
        entityTitle: updatedGoal.title,
      })
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
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: currentUser } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single()

  if (!currentUser || !currentUser.is_active || currentUser.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await supabase
    .from('goals')
    .update({ is_archived: true })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logActivity({
    userId: currentUser.id,
    action: 'goal_archived',
    entityType: 'goal',
    entityId: id,
  })

  return NextResponse.json({ success: true })
}
