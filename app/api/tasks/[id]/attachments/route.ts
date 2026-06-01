import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { serverError, unauthorized } from '@/lib/utils/errors'

const uuidv4 = () => crypto.randomUUID()

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
      .from('task_attachments')
      .select('*, uploader:users!task_attachments_uploaded_by_fkey(id, full_name, avatar_url)')
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

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 })
    }

    const fileExt = file.name.split('.').pop()
    const filePath = `${id}/${uuidv4()}.${fileExt}`

    const adminClient = await createAdminClient()
    
    const { data: uploadData, error: uploadError } = await adminClient
      .storage
      .from('task-attachments')
      .upload(filePath, file)

    if (uploadError) {
      return serverError(uploadError)
    }

    // Generate a long-lived signed URL to fulfill prompt's public_url requirement securely
    const { data: signedUrlData } = await adminClient
      .storage
      .from('task-attachments')
      .createSignedUrl(filePath, 315360000) // 10 years

    const publicUrl = signedUrlData?.signedUrl || ''

    const { data: attachment, error: dbError } = await adminClient
      .from('task_attachments')
      .insert({
        task_id: id,
        uploaded_by: session.user.id,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        storage_path: filePath,
        public_url: publicUrl
      })
      .select('*, uploader:users!task_attachments_uploaded_by_fkey(id, full_name, avatar_url)')
      .single()

    if (dbError) {
      await adminClient.storage.from('task-attachments').remove([filePath])
      return serverError(dbError)
    }

    return NextResponse.json({ data: attachment }, { status: 201 })
  } catch (err) {
    return serverError(err)
  }
}
