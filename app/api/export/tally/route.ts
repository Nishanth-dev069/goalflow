import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user: sessionUser } } = await supabase.auth.getUser()
  const session = sessionUser ? { user: sessionUser } : null

  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // Check role
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (!user || !['admin', 'manager'].includes(user.role)) {
    return new NextResponse('Forbidden: Admins and Managers only', { status: 403 })
  }

  // Fetch Time Entries with User info
  const { data: entries, error } = await supabase
    .from('time_entries')
    .select(`
      id,
      started_at,
      ended_at,
      duration_seconds,
      note,
      is_manual,
      created_at,
      task_id,
      users:user_id ( full_name, email )
    `)
    .order('started_at', { ascending: false })

  if (error) {
    console.error('Error fetching time entries:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }

  // Format as CSV
  // Header: Date, Employee, Email, Start Time, End Time, Duration (hrs), Note
  const headers = ['Date', 'Employee', 'Email', 'Start Time', 'End Time', 'Duration (hrs)', 'Note', 'Task ID', 'Manual']
  
  const rows = entries.map(entry => {
    const userObj = Array.isArray(entry.users) ? entry.users[0] : entry.users
    const name = userObj?.full_name || 'Unknown'
    const email = userObj?.email || 'Unknown'
    
    const startedAt = new Date(entry.started_at)
    const endedAt = entry.ended_at ? new Date(entry.ended_at) : null
    
    const dateStr = startedAt.toLocaleDateString()
    const startTimeStr = startedAt.toLocaleTimeString()
    const endTimeStr = endedAt ? endedAt.toLocaleTimeString() : ''
    
    const durationHrs = entry.duration_seconds 
      ? (entry.duration_seconds / 3600).toFixed(2) 
      : ''
    
    // Escape quotes in note
    const note = entry.note ? `"${entry.note.replace(/"/g, '""')}"` : ''

    return [
      dateStr,
      `"${name}"`,
      `"${email}"`,
      startTimeStr,
      endTimeStr,
      durationHrs,
      note,
      entry.task_id,
      entry.is_manual ? 'Yes' : 'No'
    ].join(',')
  })

  const csvContent = [headers.join(','), ...rows].join('\n')

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="tally_export_${new Date().toISOString().split('T')[0]}.csv"`
    }
  })
}
