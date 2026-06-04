import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { serverError, unauthorized } from '@/lib/utils/errors'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user: sessionUser } } = await supabase.auth.getUser()
  const session = sessionUser ? { user: sessionUser } : null
    if (!session) return unauthorized()

    const { task_id, started_at, ended_at, note } = await request.json()
    if (!task_id || !started_at || !ended_at) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const start = new Date(started_at)
    const end = new Date(ended_at)

    if (end <= start) {
      return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 })
    }

    const duration = Math.floor((end.getTime() - start.getTime()) / 1000)
    
    // Validate < 24 hours
    if (duration > 24 * 60 * 60) {
      return NextResponse.json({ error: 'Duration cannot exceed 24 hours' }, { status: 400 })
    }

    const { data: entry, error } = await supabase
      .from('time_entries')
      .insert({
        task_id,
        user_id: session.user.id,
        started_at: start.toISOString(),
        ended_at: end.toISOString(),
        duration_seconds: duration,
        note: note || null,
        is_manual: true
      })
      .select()
      .single()

    if (error) return serverError(error)

    return NextResponse.json({ data: entry }, { status: 201 })
  } catch (err) {
    return serverError(err)
  }
}
