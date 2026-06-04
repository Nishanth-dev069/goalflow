import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { unauthorized, forbidden, serverError, apiError } from '@/lib/utils/errors'
import { CreateGoalSchema } from '@/lib/validations/goal.schemas'
import { logActivity, computeGoalFields } from '@/lib/api-helpers'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user: sessionUser }, error: sessionError } = await supabase.auth.getUser()
  const session = sessionUser ? { user: sessionUser } : null
    
    if (sessionError || !session) {
      return unauthorized()
    }

    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('id, role, department_id, is_active')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser || !currentUser.is_active) {
      return unauthorized()
    }

    const { searchParams } = new URL(request.url)
    const scope = searchParams.get('scope')
    const status = searchParams.get('status')
    const archived = searchParams.get('archived') === 'true'
    const page = parseInt(searchParams.get('page') || '1', 10)
    const per_page = 20

    let query = supabase
      .from('goals')
      .select(`
        id, title, type, scope, status, target_value, current_value, unit, start_date, end_date, is_archived, is_private, assigned_to_user_id, assigned_to_dept_id, created_by, created_at, updated_at, description,
        assigned_user:users!goals_assigned_to_user_id_fkey(id, full_name, avatar_url),
        assigned_dept:departments!goals_assigned_to_dept_id_fkey(id, name),
        creator:users!goals_created_by_fkey(id, full_name)
      `, { count: 'exact' })
      .eq('is_archived', archived)

    if (status) {
      query = query.eq('status', status)
    }
    if (scope) {
      query = query.eq('scope', scope)
    }

    // Role-based filtering
    if (currentUser.role === 'manager') {
      if (currentUser.department_id) {
        query = query.eq('assigned_to_dept_id', currentUser.department_id)
      } else {
        query = query.eq('id', '00000000-0000-0000-0000-000000000000')
      }
    } else if (currentUser.role === 'employee') {
      let orFilter = `scope.eq.company,assigned_to_user_id.eq.${currentUser.id},created_by.eq.${currentUser.id}`
      if (currentUser.department_id) {
        orFilter += `,assigned_to_dept_id.eq.${currentUser.department_id}`
      }
      query = query.or(orFilter)
    }

    // Pagination
    const from = (page - 1) * per_page
    const to = from + per_page - 1
    query = query.order('created_at', { ascending: false }).range(from, to)

    const { data, error, count } = await query

    if (error) {
      console.error(`[API ERROR] ${request.method} ${request.url}`, {
        error,
        userId: currentUser?.id,
      })
      return apiError(error.message, 500, error.code)
    }

    const computedData = data.map(computeGoalFields)

    return NextResponse.json({
      data: computedData,
      total: count || 0,
      page,
      per_page,
      has_more: count ? (from + data.length) < count : false
    })
  } catch (err) {
    return serverError(err)
  }
}

export async function POST(request: Request) {
  let currentUser = null;
  let validated = null;
  try {
    const supabase = await createClient()
    const { data: { user: sessionUser }, error: sessionError } = await supabase.auth.getUser()
  const session = sessionUser ? { user: sessionUser } : null
    
    if (sessionError || !session) {
      return unauthorized()
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, role, department_id, is_active')
      .eq('id', session.user.id)
      .single()

    if (userError || !user || !user.is_active) {
      return unauthorized()
    }
    currentUser = user;

    if (currentUser.role === 'employee') {
      return forbidden()
    }

    const json = await request.json()
    validated = CreateGoalSchema.parse(json)

    if (currentUser.role === 'manager') {
      if (validated.scope === 'company') {
        return forbidden('Managers cannot create company goals')
      }
      if (validated.scope === 'department' && validated.assigned_to_dept_id !== currentUser.department_id) {
        return forbidden('Cannot create department goals outside your department')
      }
    }

    const goalData = {
      title: validated.title,
      description: validated.description ?? null,
      type: validated.type,
      scope: validated.scope,
      target_value: validated.target_value ?? null,
      start_date: validated.start_date,
      end_date: validated.end_date,
      created_by: currentUser.id,
      status: 'active' as const,
      // Explicitly set based on scope — never let wrong values through
      assigned_to_user_id: validated.scope === 'personal' ? (validated.assigned_to_user_id ?? null) : null,
      assigned_to_dept_id: validated.scope === 'department' ? (validated.assigned_to_dept_id ?? null) : null,
    }

    const { data: newGoal, error: insertError } = await supabase
      .from('goals')
      .insert(goalData)
      .select('*')
      .single()

    if (insertError) {
      console.error(`[API ERROR] ${request.method} ${request.url}`, {
        error: insertError,
        userId: currentUser?.id,
        body: validated,
      })
      return apiError(insertError.message, 400, insertError.code)
    }

    await logActivity({
      userId: currentUser.id,
      action: 'goal_created',
      entityType: 'goal',
      entityId: newGoal.id,
      entityTitle: newGoal.title,
    })

    return NextResponse.json({ data: newGoal }, { status: 201 })
  } catch (error: any) {
    console.error(`[API ERROR] ${request.method} ${request.url}`, {
      error,
      userId: currentUser?.id,
      body: validated,
    })
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors.map((e: any) => e.message).join(', ') }, { status: 400 })
    }
    return serverError(error)
  }
}
