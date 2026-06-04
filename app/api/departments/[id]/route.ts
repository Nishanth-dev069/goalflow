import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { UpdateDepartmentSchema } from '@/lib/validations/department.schemas'
import { logActivity } from '@/lib/api-helpers'

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

  if (!currentUser || !currentUser.is_active || currentUser.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const json = await request.json()
    const body = UpdateDepartmentSchema.parse(json)

    if (Object.keys(body).length === 0) {
      return NextResponse.json({ error: 'No data to update' }, { status: 400 })
    }

    const adminClient = await createAdminClient()
    const { data: updatedDept, error } = await adminClient
      .from('departments')
      .update(body)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // If a manager was assigned or changed, update their department_id in the users table
    if (body.manager_id !== undefined && body.manager_id !== null) {
      await adminClient
        .from('users')
        .update({ department_id: updatedDept.id })
        .eq('id', body.manager_id)
    }

    await logActivity({
      userId: currentUser.id,
      action: 'department_updated',
      entityType: 'department',
      entityId: updatedDept.id,
      entityTitle: updatedDept.name,
    })

    return NextResponse.json({ data: updatedDept })
  } catch (error: any) {
    console.error('PATCH /api/departments/[id] Error:', error)
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
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

  if (!currentUser || !currentUser.is_active || currentUser.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const adminClient = await createAdminClient()
  const { error } = await adminClient
    .from('departments')
    .update({ is_active: false })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await logActivity({
    userId: currentUser.id,
    action: 'department_deactivated',
    entityType: 'department',
    entityId: id,
  })

  return NextResponse.json({ success: true })
}
