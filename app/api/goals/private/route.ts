import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { unauthorized, serverError, apiError } from '@/lib/utils/errors'
import { CreateGoalSchema } from '@/lib/validations/goal.schemas'
import { logActivity, computeGoalFields } from '@/lib/api-helpers'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
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
    const status = searchParams.get('status')
    const archived = searchParams.get('archived') === 'true'

    let query = supabase
      .from('goals')
      .select(`
        *,
        creator:users!goals_created_by_fkey(id, full_name)
      `)
      .eq('is_private', true)
      .eq('created_by', currentUser.id)
      .eq('is_archived', archived)

    if (status) {
      query = query.eq('status', status)
    }

    query = query.order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) {
      console.error(`[API ERROR] GET /api/goals/private`, { error, userId: currentUser.id })
      return apiError(error.message, 500, error.code)
    }

    const computedData = data.map(computeGoalFields)

    return NextResponse.json({
      data: computedData,
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
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
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

    const json = await request.json()
    // Override scope to personal and is_private to true
    validated = CreateGoalSchema.parse({
      ...json,
      scope: 'personal',
      is_private: true
    })

    const goalData = {
      title: validated.title,
      description: validated.description ?? null,
      type: validated.type,
      scope: 'personal',
      target_value: validated.target_value ?? null,
      start_date: validated.start_date,
      end_date: validated.end_date,
      created_by: currentUser.id,
      status: 'active' as const,
      is_private: true,
      assigned_to_user_id: currentUser.id, // private goals are always assigned to the creator
      assigned_to_dept_id: null,
    }

    const { data: newGoal, error: insertError } = await supabase
      .from('goals')
      .insert(goalData)
      .select('*')
      .single()

    if (insertError) {
      console.error(`[API ERROR] POST /api/goals/private`, {
        error: insertError,
        userId: currentUser.id,
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
    console.error(`[API ERROR] POST /api/goals/private`, {
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
