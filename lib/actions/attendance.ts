'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function logAttendance(action: 'clock_in' | 'clock_out', latitude: number | null, longitude: number | null) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    throw new Error('Not authenticated')
  }

  const { error } = await supabase
    .from('attendance_logs')
    .insert({
      user_id: session.user.id,
      action,
      latitude,
      longitude,
    })

  if (error) {
    console.error('Error logging attendance:', error)
    throw new Error('Failed to log attendance')
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function getLatestAttendance() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return null
  }

  const { data, error } = await supabase
    .from('attendance_logs')
    .select('*')
    .eq('user_id', session.user.id)
    .order('timestamp', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching latest attendance:', error)
  }

  return data
}
