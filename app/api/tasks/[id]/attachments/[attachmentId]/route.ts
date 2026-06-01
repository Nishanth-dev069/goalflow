import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { serverError, unauthorized, forbidden } from '@/lib/utils/errors'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string, attachmentId: string }> }
) {
  try {
    const { id, attachmentId } = await params
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return unauthorized()

    const { data: attachment } = await supabase.from('task_attachments').select('*').eq('id', attachmentId).single()
    
    if (!attachment) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const { data: user } = await supabase.from('users').select('role').eq('id', session.user.id).single()

    if (attachment.uploaded_by !== session.user.id && user?.role !== 'admin') {
      return forbidden('Only the uploader or an admin can delete this attachment.')
    }

    const adminClient = await createAdminClient()

    if (attachment.storage_path) {
      await adminClient.storage.from('task-attachments').remove([attachment.storage_path])
    }

    const { error: dbError } = await adminClient.from('task_attachments').delete().eq('id', attachmentId)

    if (dbError) return serverError(dbError)

    return NextResponse.json({ success: true })
  } catch (err) {
    return serverError(err)
  }
}
