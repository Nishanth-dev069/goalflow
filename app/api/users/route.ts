import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { CreateUserSchema } from '@/lib/validations/user.schemas'
import { logActivity } from '@/lib/api-helpers'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user: sessionUser } } = await supabase.auth.getUser()
  const session = sessionUser ? { user: sessionUser } : null
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: currentUser } = await supabase
    .from('users')
    .select('*, department:departments!users_department_id_fkey(*)')
    .eq('id', session.user.id)
    .single()

  if (!currentUser || !currentUser.is_active) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')
  const role = searchParams.get('role')
  const departmentId = searchParams.get('department_id')
  const isActive = searchParams.get('is_active')

  let query = supabase
    .from('users')
    .select('*, department:departments!users_department_id_fkey(id, name)')
    .limit(50)

  // Role-based filtering
  if (currentUser.role === 'manager') {
    if (!currentUser.department_id) {
      // Manager without a department sees no one
      return NextResponse.json({ data: [] })
    }
    query = query.eq('department_id', currentUser.department_id)
  } else if (currentUser.role === 'employee') {
    // Employee shouldn't normally list all users unless for a specific UI picker,
    // but spec says "Admin sees all... Manager sees users in their dept... Users can get themselves (in /api/users/[id])".
    // For safety, an employee getting the list might just see themselves or everyone in their dept. 
    // Spec says: "Admin sees all... Manager sees users in dept". We will return 403 for employees on listing,
    // OR restrict them to just themselves. Let's restrict to themselves.
    query = query.eq('id', currentUser.id)
  }

  // URL filters
  if (search) {
    query = query.ilike('full_name', `%${search}%`)
  }
  if (role && currentUser.role === 'admin') {
    query = query.eq('role', role)
  }
  if (departmentId && currentUser.role === 'admin') {
    query = query.eq('department_id', departmentId)
  }
  if (isActive !== null) {
    query = query.eq('is_active', isActive === 'true')
  }

  const { data, error } = await query
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user: sessionUser } } = await supabase.auth.getUser()
  const session = sessionUser ? { user: sessionUser } : null
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: currentUser } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single()

  if (!currentUser || !currentUser.is_active || !['admin', 'manager'].includes(currentUser.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const json = await request.json()
    const body = CreateUserSchema.parse(json)

    if (currentUser.role === 'manager' && body.department_id && body.department_id !== currentUser.department_id) {
      return NextResponse.json({ error: 'Managers can only assign users to their own department' }, { status: 403 })
    }

    // Check if email exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', body.email)
      .single()

    if (existingUser) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
    }

    const adminClient = await createAdminClient()
    
    // Create auth user
    // Provide a random secure password for new users, they can reset it later or it can be sent via email
    const tempPassword = Math.random().toString(36).slice(-10) + 'A1!' 
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: body.email,
      password: body.password || tempPassword,
      email_confirm: true,
      user_metadata: { full_name: body.full_name },
    })

    if (authError || !authData.user) {
      return NextResponse.json({ error: authError?.message || 'Failed to create auth user' }, { status: 500 })
    }

    const newUserId = authData.user.id

    // Wait a brief moment to ensure the database trigger `handle_new_user` has completed
    await new Promise((resolve) => setTimeout(resolve, 500))

    // If manager is creating the user, force the department_id to the manager's department
    const assignedDepartmentId = currentUser.role === 'manager' 
      ? currentUser.department_id 
      : (body.department_id || null);

    const { data: updatedUser, error: updateError } = await adminClient
      .from('users')
      .update({
        role: body.role,
        department_id: assignedDepartmentId,
      })
      .eq('id', newUserId)
      .select('*, department:departments!users_department_id_fkey(id, name)')
      .single()

    if (updateError) {
      return NextResponse.json({ error: 'User created in auth but failed to update public record' }, { status: 500 })
    }

    await logActivity({
      userId: currentUser.id,
      action: 'user_created',
      entityType: 'user',
      entityId: newUserId,
      entityTitle: body.full_name,
      metadata: { role: body.role, department_id: body.department_id }
    })

    return NextResponse.json({ data: updatedUser }, { status: 201 })
  } catch (error: any) {
    console.error('POST /api/users Error:', error)
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
