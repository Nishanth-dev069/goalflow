import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { serverError, unauthorized, forbidden } from '@/lib/utils/errors'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string, dependencyId: string }> }
) {
  try {
    const { id, dependencyId } = await params
    const supabase = await createClient()
    const { data: { user: sessionUser } } = await supabase.auth.getUser()
  const session = sessionUser ? { user: sessionUser } : null
    if (!session) return unauthorized()

    const { data: user } = await supabase.from('users').select('role').eq('id', session.user.id).single()
    if (!user || user.role === 'employee') return forbidden('Only managers and admins can remove dependencies')

    const adminClient = await createAdminClient()
    const { error } = await adminClient.from('task_dependencies').delete().eq('id', dependencyId).eq('task_id', id)

    if (error) return serverError(error)

    return NextResponse.json({ success: true })
  } catch (err) {
    return serverError(err)
  }
}
