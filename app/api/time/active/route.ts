import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { serverError, unauthorized } from '@/lib/utils/errors'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return unauthorized()

    const { data: entry, error } = await supabase
      .from('time_entries')
      .select('*, task:tasks!time_entries_task_id_fkey(id, title)')
      .eq('user_id', session.user.id)
      .is('ended_at', null)
      .maybeSingle()

    if (error) return serverError(error)

    return NextResponse.json({ data: entry || null })
  } catch (err) {
    return serverError(err)
  }
}
