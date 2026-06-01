import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { serverError, unauthorized } from '@/lib/utils/errors'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return unauthorized()

    const { searchParams } = new URL(request.url)
    const task_id = searchParams.get('task_id')

    if (!task_id) return NextResponse.json({ error: 'task_id required' }, { status: 400 })

    const { data, error } = await supabase
      .from('time_entries')
      .select('*, user:users!time_entries_user_id_fkey(id, full_name, avatar_url)')
      .eq('task_id', task_id)
      .not('ended_at', 'is', null)
      .order('started_at', { ascending: false })

    if (error) return serverError(error)

    return NextResponse.json({ data })
  } catch (err) {
    return serverError(err)
  }
}
