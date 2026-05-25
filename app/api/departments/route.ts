import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { DepartmentSchema } from '@/lib/validations/department.schemas'
import { logActivity } from '@/lib/api-helpers'

export async function GET() {
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

  // To get member count, we can do a subquery or fetch users and group them.
  // Using supabase syntax: users(count) where department_id matches
  const { data, error } = await supabase
    .from('departments')
    .select(`
      *,
      manager:users!fk_dept_manager(id, full_name, avatar_url),
      users!users_department_id_fkey(count)
    `)
    .eq('is_active', true)
    .order('name')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Format the users count nicely
  const formattedData = data.map(d => ({
    ...d,
    member_count: d.users?.[0]?.count || 0
  }))

  return NextResponse.json({ data: formattedData })
}

export async function POST(request: Request) {
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

  try {
    const json = await request.json()
    const body = DepartmentSchema.parse(json)

    const adminClient = await createAdminClient()
    const { data: newDept, error } = await adminClient
      .from('departments')
      .insert({
        name: body.name,
        description: body.description || null,
        manager_id: body.manager_id || null
      })
      .select()
      .single()

    if (error) throw error

    await logActivity({
      userId: currentUser.id,
      action: 'department_created',
      entityType: 'department',
      entityId: newDept.id,
      entityTitle: newDept.name,
    })

    return NextResponse.json({ data: newDept }, { status: 201 })
  } catch (error: any) {
    console.error('POST /api/departments Error:', error)
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
