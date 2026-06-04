import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user: sessionUser } } = await supabase.auth.getUser()
  const session = sessionUser ? { user: sessionUser } : null
  
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || ''
  
  if (query.length < 2) {
    return NextResponse.json({ data: { tasks: [], goals: [], users: [] } })
  }

  const { data: currentUser } = await supabase.from('users').select('role').eq('id', session.user.id).single()
  const isAdmin = currentUser?.role === 'admin'

  const limit = 5
  
  // Tasks query
  let tasksQuery = supabase.from('tasks').select('id, title, status, due_date').ilike('title', `%${query}%`).limit(limit)
  if (!isAdmin) tasksQuery = tasksQuery.eq('assigned_to', session.user.id)

  // Goals query
  let goalsQuery = supabase.from('goals').select('id, title, status, end_date').ilike('title', `%${query}%`).limit(limit)
  // For simplicity, we just return goals matching title. Assuming employees can search all public goals

  // Users query (admin only)
  let usersQuery: any = supabase.from('users').select('id, full_name, email, role').ilike('full_name', `%${query}%`).limit(limit)

  const [
    { data: tasks },
    { data: goals },
    { data: users }
  ] = await Promise.all([
    tasksQuery,
    goalsQuery,
    isAdmin ? usersQuery : Promise.resolve({ data: [] })
  ])

  // Also try email for users if admin and no names match
  let finalUsers = users || []
  if (isAdmin && finalUsers.length === 0) {
    const { data: emailUsers } = await supabase.from('users').select('id, full_name, email, role').ilike('email', `%${query}%`).limit(limit)
    finalUsers = emailUsers || []
  }

  return NextResponse.json({
    data: {
      tasks: tasks || [],
      goals: goals || [],
      users: finalUsers
    }
  })
}
