import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { serverError, unauthorized, forbidden } from '@/lib/utils/errors'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return unauthorized()

    const { data, error } = await supabase
      .from('task_dependencies')
      .select('*, depends_on:tasks!task_dependencies_depends_on_id_fkey(id, title, status, priority)')
      .eq('task_id', id)
      .order('created_at', { ascending: false })

    if (error) return serverError(error)

    return NextResponse.json({ data })
  } catch (err) {
    return serverError(err)
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return unauthorized()

    const { data: user } = await supabase.from('users').select('role').eq('id', session.user.id).single()
    if (!user || user.role === 'employee') return forbidden('Only managers and admins can add dependencies')

    const json = await request.json()
    const depends_on_id = json.depends_on_id

    if (!depends_on_id || id === depends_on_id) {
      return NextResponse.json({ error: 'Invalid dependency' }, { status: 400 })
    }

    const adminClient = await createAdminClient()
    
    // Check if cyclic dependency exists (1 level deep)
    const { data: existing } = await adminClient
      .from('task_dependencies')
      .select('id')
      .eq('task_id', depends_on_id)
      .eq('depends_on_id', id)
      .maybeSingle()
      
    if (existing) {
      return NextResponse.json({ error: 'Cyclic dependency detected' }, { status: 400 })
    }

    const { data: dependency, error } = await adminClient
      .from('task_dependencies')
      .insert({
        task_id: id,
        depends_on_id,
        created_by: session.user.id
      })
      .select('*, depends_on:tasks!task_dependencies_depends_on_id_fkey(id, title, status, priority)')
      .single()

    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: 'Dependency already exists' }, { status: 400 })
      return serverError(error)
    }

    return NextResponse.json({ data: dependency }, { status: 201 })
  } catch (err) {
    return serverError(err)
  }
}
