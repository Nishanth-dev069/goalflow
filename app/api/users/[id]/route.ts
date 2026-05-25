import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { UpdateUserSchema } from '@/lib/validations/user.schemas'
import { logActivity } from '@/lib/api-helpers'

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
    .select('*, department:departments!users_department_id_fkey(*)')
    .eq('id', session.user.id)
    .single()

  if (!currentUser || !currentUser.is_active) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: targetUser, error } = await supabase
    .from('users')
    .select('*, department:departments!users_department_id_fkey(id, name)')
    .eq('id', id)
    .single()

  if (error || !targetUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Authorization Check
  if (currentUser.role === 'employee' && currentUser.id !== id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (currentUser.role === 'manager' && currentUser.id !== id && currentUser.department_id !== targetUser.department_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json({ data: targetUser })
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

  // Check target user exists
  const { data: targetUser } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single()

  if (!targetUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Authz
  const isAdmin = currentUser.role === 'admin'
  const isSelf = currentUser.id === id

  if (!isAdmin && !isSelf) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const json = await request.json()
    const body = UpdateUserSchema.parse(json)

    // Strip fields if not admin
    let updates: any = {}
    if (isAdmin) {
      updates = { ...body }
    } else {
      // Self update only
      if (body.full_name !== undefined) updates.full_name = body.full_name
      if (body.avatar_url !== undefined) updates.avatar_url = body.avatar_url
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ data: targetUser })
    }

    const adminClient = await createAdminClient()

    const { data: updatedUser, error: updateError } = await adminClient
      .from('users')
      .update(updates)
      .eq('id', id)
      .select('*, department:departments!users_department_id_fkey(id, name)')
      .single()

    if (updateError) {
      throw updateError
    }

    // Logging & Side Effects
    if (updates.role !== undefined && updates.role !== targetUser.role) {
      await logActivity({
        userId: currentUser.id,
        action: 'role_changed',
        entityType: 'user',
        entityId: id,
        entityTitle: updatedUser.full_name,
        metadata: { old_role: targetUser.role, new_role: updates.role }
      })
    }

    if (updates.is_active === false && targetUser.is_active === true) {
      await adminClient.auth.admin.signOut(id, 'global')
      await logActivity({
        userId: currentUser.id,
        action: 'user_deactivated',
        entityType: 'user',
        entityId: id,
        entityTitle: updatedUser.full_name
      })
    }

    return NextResponse.json({ data: updatedUser })
  } catch (error: any) {
    console.error('PATCH /api/users/[id] Error:', error)
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

  const adminClient = await createAdminClient()
  
  // Soft delete
  const { error } = await adminClient
    .from('users')
    .update({ is_active: false })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await adminClient.auth.admin.signOut(id, 'global')

  await logActivity({
    userId: currentUser.id,
    action: 'user_deactivated',
    entityType: 'user',
    entityId: id,
  })

  return NextResponse.json({ success: true })
}
