import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { serverError, unauthorized } from '@/lib/utils/errors'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user: sessionUser } } = await supabase.auth.getUser()
  const session = sessionUser ? { user: sessionUser } : null
    if (!session) return unauthorized()

    const { entry_id, note } = await request.json()
    if (!entry_id) return NextResponse.json({ error: 'entry_id required' }, { status: 400 })

    const { data: entry } = await supabase
      .from('time_entries')
      .select('started_at, user_id')
      .eq('id', entry_id)
      .is('ended_at', null)
      .maybeSingle()

    if (!entry || entry.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Active timer not found' }, { status: 404 })
    }

    const duration = Math.floor((Date.now() - new Date(entry.started_at).getTime()) / 1000)

    const { data: updated, error } = await supabase
      .from('time_entries')
      .update({ 
        ended_at: new Date().toISOString(), 
        duration_seconds: duration,
        note: note || null 
      })
      .eq('id', entry_id)
      .select()
      .single()

    if (error) return serverError(error)

    return NextResponse.json({ data: updated })
  } catch (err) {
    return serverError(err)
  }
}
