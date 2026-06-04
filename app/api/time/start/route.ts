import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { serverError, unauthorized } from '@/lib/utils/errors'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user: sessionUser } } = await supabase.auth.getUser()
  const session = sessionUser ? { user: sessionUser } : null
    if (!session) return unauthorized()

    const { task_id } = await request.json()
    if (!task_id) return NextResponse.json({ error: 'task_id required' }, { status: 400 })

    const { data: activeTimer } = await supabase
      .from('time_entries')
      .select('id, started_at')
      .eq('user_id', session.user.id)
      .is('ended_at', null)
      .maybeSingle()

    if (activeTimer) {
      const duration = Math.floor((Date.now() - new Date(activeTimer.started_at).getTime()) / 1000)
      await supabase
        .from('time_entries')
        .update({ ended_at: new Date().toISOString(), duration_seconds: duration })
        .eq('id', activeTimer.id)
    }

    const { data: entry, error } = await supabase
      .from('time_entries')
      .insert({
        task_id,
        user_id: session.user.id,
        started_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) return serverError(error)

    return NextResponse.json({ data: entry }, { status: 201 })
  } catch (err) {
    return serverError(err)
  }
}
