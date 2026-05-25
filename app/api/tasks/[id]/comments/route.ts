import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CreateCommentSchema } from '@/lib/validations/task.schemas'
import { logActivity, createNotification } from '@/lib/api-helpers'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('task_comments')
    .select(`
      *,
      user:users!task_comments_user_id_fkey(id, full_name, avatar_url)
    `)
    .eq('task_id', id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: currentUser } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single()

  if (!currentUser || !currentUser.is_active) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: task } = await supabase.from('tasks').select('*').eq('id', id).single()
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

  try {
    const json = await request.json()
    const body = CreateCommentSchema.parse(json)

    const { data: comment, error } = await supabase
      .from('task_comments')
      .insert({
        task_id: id,
        user_id: currentUser.id,
        content: body.content,
      })
      .select(`
        *,
        user:users!task_comments_user_id_fkey(id, full_name, avatar_url)
      `)
      .single()

    if (error) throw error

    await logActivity({
      userId: currentUser.id,
      action: 'task_commented',
      entityType: 'task',
      entityId: id,
      entityTitle: task.title,
    })

    if (task.assigned_to !== currentUser.id) {
      await createNotification({
        userId: task.assigned_to,
        type: 'task_commented',
        title: `New comment on: ${task.title}`,
        body: body.content.substring(0, 50) + (body.content.length > 50 ? '...' : ''),
        entityId: id
      })
    }

    return NextResponse.json({ data: comment }, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ZodError') return NextResponse.json({ error: error.errors.map((e: any) => e.message).join(', ') }, { status: 400 })
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
